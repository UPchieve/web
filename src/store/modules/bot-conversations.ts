import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import ModerationService from '@/services/ModerationService'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import type { ActionContext } from 'vuex'
import type { Uuid } from '@/types/shared'
import type {
  TutorBotGeneratedMessagePublic,
  TutorBotMessagePublic,
  TutorBotSystemMessage,
  TutorBotTranscriptPublic,
} from '@/types/bot-conversations'
import type { RootGetters, RootState } from '@/store/index'
import { DISPLAY_CONTEXT } from '@/constants/bot-conversations'

type ConversationMessage =
  | TutorBotGeneratedMessagePublic
  | TutorBotMessagePublic
  | TutorBotSystemMessage

type CurrentConversationState =
  | (Omit<TutorBotTranscriptPublic, 'messages'> & {
      messages: ConversationMessage[]
    })
  | Record<string, never>

export type TutorBotStoreState = {
  currentConversation: CurrentConversationState
  messageIsSending: boolean
  isFetchingConversation: boolean
  errors: string[]
  pendingTransferredConversationId: Uuid | null
}

type TutorBotActionContext = ActionContext<TutorBotStoreState, RootState> & {
  rootGetters: RootGetters
}

type SendMessagePayload = {
  message: string
  displayContext: DISPLAY_CONTEXT
  subjectId?: number
  source: string
}

function buildModerationError(
  failures: Record<string, string>,
  isVolunteer: boolean
) {
  return Object.entries(failures).reduce((message, [key, value], i) => {
    message += i > 0 ? ',' : ''
    if (key === 'profanity' && !isVolunteer) {
      message += ` ${key}`
    } else {
      message += ` ${key} (${value})`
    }
    return message
  }, 'Messages cannot contain personal information, profanity, or links to third party video services: ')
}

export default {
  namespaced: true,
  state: {
    currentConversation: {} as Record<string, never>,
    messageIsSending: false,
    isFetchingConversation: false,
    errors: [],
    pendingTransferredConversationId: null,
  } as TutorBotStoreState,

  mutations: {
    setCurrentConversation: (
      state: TutorBotStoreState,
      conversation: CurrentConversationState
    ) => (state.currentConversation = conversation),
    setMessageIsSending: (state: TutorBotStoreState, isSending: boolean) =>
      (state.messageIsSending = isSending),
    setIsFetchingConversation: (
      state: TutorBotStoreState,
      isFetching: boolean
    ) => (state.isFetchingConversation = isFetching),
    addToCurrentConversation: (
      state: TutorBotStoreState,
      message: ConversationMessage
    ) => {
      if (!('messages' in state.currentConversation)) return
      state.currentConversation.messages = [
        ...state.currentConversation.messages,
        message,
      ]
    },
    setError: (state: TutorBotStoreState, error: string) =>
      (state.errors = state.errors.concat([error])),
    clearErrors: (state: TutorBotStoreState) => (state.errors = []),
    setPendingTransferredConversationId(
      state: TutorBotStoreState,
      conversationId: Uuid | null
    ) {
      state.pendingTransferredConversationId = conversationId
    },
  },

  actions: {
    async setConversation(
      { commit, state }: TutorBotActionContext,
      conversationId: Uuid
    ) {
      if (
        'conversationId' in state.currentConversation &&
        state.currentConversation.conversationId === conversationId
      )
        return
      commit('setCurrentConversation', {} as Record<string, never>)
      commit('clearErrors')
      commit('setIsFetchingConversation', true)
      try {
        const response =
          await NetworkService.getAllMessagesForBotConversation(conversationId)
        commit('setCurrentConversation', response.data)
      } catch (e) {
        LoggerService.noticeError(e)
        commit('setError', 'Can not set conversation')
      } finally {
        commit('setIsFetchingConversation', false)
      }
    },
    resetCurrentConversation({ commit }: TutorBotActionContext) {
      commit('setCurrentConversation', {})
    },
    async sendMessage(
      { commit, dispatch, rootState, state }: TutorBotActionContext,
      { message, displayContext, subjectId, source }: SendMessagePayload
    ) {
      commit('clearErrors')
      commit('setMessageIsSending', true)

      // 1. Moderate (input stays put while this runs).
      const sessionId =
        'conversationId' in state.currentConversation
          ? state.currentConversation.sessionId
          : null
      const isClean = await ModerationService.checkIfMessageIsClean({
        message,
        sessionId,
        source,
      })
      // When we have a sessionId, we get more granular moderation
      if (isClean.failures && Object.keys(isClean.failures).length) {
        commit(
          'setError',
          buildModerationError(
            isClean.failures,
            rootState.user.user.isVolunteer
          )
        )
        commit('setMessageIsSending', false)
        return false
      }

      if (!isClean) {
        commit(
          'setError',
          'Messages cannot contain personal information, profanity, or links to third party video services'
        )
        commit('setMessageIsSending', false)
        return false
      }

      // 2. Moderation passed.
      if ('conversationId' in state.currentConversation) {
        // Fire-and-forget the send/receive so the textarea can clear right
        // after moderation. messageIsSending stays true until the network call
        // completes, so the typing indicator + disabled input both persist
        // while the bot generates its reply.
        dispatch('sendMessageToConversation', message).finally(() =>
          commit('setMessageIsSending', false)
        )
        return true
      }

      if (displayContext === DISPLAY_CONTEXT.STAND_ALONE) {
        if (!subjectId) {
          commit('setError', 'Please select a subject')
          commit('setMessageIsSending', false)
          return false
        }

        // First message: await so callers (e.g. StandaloneBotChatView) can
        // read the new conversationId out of the store and update the URL.
        try {
          await dispatch('startStandaloneConversation', { message, subjectId })
          return state.errors.length === 0
        } finally {
          commit('setMessageIsSending', false)
        }
      }

      commit('setError', 'No active conversation')
      commit('setMessageIsSending', false)
      return false
    },

    async sendMessageToConversation(
      { commit, rootState, rootGetters, state }: TutorBotActionContext,
      message: string
    ) {
      commit('clearErrors')
      try {
        if (!('conversationId' in state.currentConversation)) {
          commit('setError', 'No active conversation')
          return
        }

        const sessionId = state.currentConversation.sessionId
        const currentSessionId = rootState.user.session?.id
        const isStandAloneBotConversation =
          !sessionId || currentSessionId !== sessionId

        const toolType = rootState.user.session?.toolType
        const isUpbotSessionEditorContextEnabled =
          rootGetters['featureFlags/isUpbotSessionEditorContextEnabled']
        let snapshotBlob

        if (
          sessionId &&
          isUpbotSessionEditorContextEnabled &&
          toolType === 'whiteboard'
        ) {
          const zwibbler = rootState.session.zwibbler
          if (zwibbler?.save) {
            const snapshotDataUrl = zwibbler.save({
              format: 'image/jpeg',
            })
            const response = await fetch(snapshotDataUrl)
            snapshotBlob = await response.blob()
          }
        }

        const userId = rootState.user.user.id
        const senderUserType = rootGetters['user/userType']
        const conversationId = state.currentConversation.conversationId
        const subject =
          rootGetters['subjects/subjectsById'][
            state.currentConversation.subjectId
          ]
        const subjectName = rootState.user.session?.subTopic ?? subject?.name

        if (isStandAloneBotConversation) {
          const optimisticMessage = {
            message,
            senderUserType,
            tutorBotConversationId: conversationId,
            userId,
          }
          commit('addToCurrentConversation', optimisticMessage)
        }

        const results = await NetworkService.sendTutorBotMessage({
          userId,
          conversationId,
          message,
          senderUserType,
          sessionId,
          subjectName,
          snapshotBlob,
        })

        if (isStandAloneBotConversation) {
          commit('addToCurrentConversation', results.data.botResponse)
        }

        AnalyticsService.captureEvent(EVENTS.AI_TUTOR_SEND_MESSAGE)
      } catch (e) {
        LoggerService.noticeError(e)
        commit('setError', 'Can not send message')
      }
    },
    clearErrors({ commit }: TutorBotActionContext) {
      commit('clearErrors')
    },
    async startStandaloneConversation(
      { commit, rootState, rootGetters }: TutorBotActionContext,
      {
        message,
        subjectId,
        sessionId,
      }: { message: string; subjectId: number; sessionId?: string }
    ) {
      commit('setCurrentConversation', {})
      commit('clearErrors')
      commit('setIsFetchingConversation', true)

      try {
        const userId = rootState.user.user.id
        const senderUserType = rootGetters['user/userType']
        const results = await NetworkService.createTutorBotSession({
          userId,
          sessionId,
          message,
          senderUserType,
          subjectId,
        })
        commit('setCurrentConversation', results.data)
        AnalyticsService.captureEvent(EVENTS.AI_TUTOR_CREATE_CONVERSATION)
      } catch (e) {
        LoggerService.noticeError(e)
        commit('setError', 'Can not create conversation')
      } finally {
        commit('setIsFetchingConversation', false)
      }
    },
  },

  getters: {
    currentConversation(state: TutorBotStoreState) {
      return {
        ...state.currentConversation,
      }
    },
  },
}
