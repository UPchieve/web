import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
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
}

type TutorBotActionContext = ActionContext<TutorBotStoreState, RootState> & {
  rootGetters: RootGetters
}

export default {
  namespaced: true,
  state: {
    currentConversation: {} as Record<string, never>,
    messageIsSending: false,
    isFetchingConversation: false,
    errors: [],
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
    async sendMessage(
      { commit, rootState, rootGetters, state }: TutorBotActionContext,
      message: string
    ) {
      commit('clearErrors')
      commit('setMessageIsSending', true)
      try {
        if (!('conversationId' in state.currentConversation)) {
          commit('setError', 'No active conversation')
          return
        }

        const sessionId = state.currentConversation.sessionId
        if (!sessionId) {
          commit('setError', 'No active tutoring session')
          return
        }

        let snapshotBlob
        const toolType = rootState.user.session.toolType
        const isUpbotSessionEditorContextEnabled =
          rootGetters['featureFlags/isUpbotSessionEditorContextEnabled']
        if (isUpbotSessionEditorContextEnabled && toolType === 'whiteboard') {
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
        const subjectName = rootState.user.session.subTopic
        const payload = {
          userId,
          conversationId,
          message,
          senderUserType,
          sessionId,
          subjectName,
          snapshotBlob,
        }
        await NetworkService.sendTutorBotMessage(payload)

        AnalyticsService.captureEvent(EVENTS.AI_TUTOR_SEND_MESSAGE)
      } catch (e) {
        LoggerService.noticeError(e)
        commit('setError', 'Can not send message')
      } finally {
        commit('setMessageIsSending', false)
      }
    },
    clearErrors({ commit }: TutorBotActionContext) {
      commit('clearErrors')
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
