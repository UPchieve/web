import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import { AI_TUTOR_SUPPORTED_SUBJECTS, EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'

export default {
  namespaced: true,
  state: {
    currentConversation: {},
    userConversations: [],
    messageIsSending: false,
    isFetchingConversation: false,
    errors: [],
    subjects: [],
  },

  mutations: {
    setUserConversations: (state, conversations) =>
      (state.userConversations = conversations),
    setCurrentConversation: (state, conversation) =>
      (state.currentConversation = conversation),
    setMessageIsSending: (state, isSending) =>
      (state.messageIsSending = isSending),
    setIsFetchingConversation: (state, isFetchingConversation) =>
      (state.isFetchingConversation = isFetchingConversation),
    addToCurrentConversation: (state, message) => {
      return (state.currentConversation.messages = [
        ...state.currentConversation.messages,
        message,
      ])
    },
    setError: (state, error) => (state.errors = state.errors.concat([error])),
    clearErrors: (state) => (state.errors = []),
    setSubjects: (state, subjects) => {
      if (Object.keys(subjects).length === 0) return []
      state.subjects = AI_TUTOR_SUPPORTED_SUBJECTS.reduce((subs, subject) => {
        const supported = subjects?.[subject] ?? []
        return subs.concat(supported)
      }, [])
    },
    prependFakeMessage: (state, message) => {
      return (state.currentConversation.messages = [
        {
          message,
          senderUserType: 'bot',
          tutorBotConversationId: state.currentConversation.conversationId,
        },
        ...state.currentConversation.messages,
      ])
    },
  },

  actions: {
    prependSystemMessage({ commit }, message) {
      commit('prependFakeMessage', message)
    },
    resetCurrentConversation({ commit }) {
      commit('setCurrentConversation', {})
    },
    async setConversation({ commit, state }, conversationId: string) {
      if (state.currentConversation.conversationId === conversationId) return
      commit('setCurrentConversation', {})
      commit('clearErrors')
      commit('setIsFetchingConversation', true)
      try {
        const messageResults =
          await NetworkService.getAllMessagesForBotConversation(conversationId)
        commit('setCurrentConversation', messageResults.data)
      } catch (e) {
        LoggerService.noticeError(e)
        commit('setError', 'Can not set conversation')
      } finally {
        commit('setIsFetchingConversation', false)
      }
    },
    async sendMessage({ commit, rootState, state }, message) {
      commit('clearErrors')
      commit('setMessageIsSending', true)
      try {
        const userId = rootState.user.user.id
        const senderUserType = rootState.user.user.type
        const sessionId = state.currentConversation.sessionId
        const currentSessionId = rootState.user.session.id
        const isStandAloneBotConversation =
          !sessionId || currentSessionId !== sessionId

        if (isStandAloneBotConversation) {
          // With no session, we don't watch the socket messages so optimistically insert message from user
          const optimisticMessage = {
            message,
            senderUserType,
            tutorBotConversationId: state.currentConversation.conversationId,
            userId,
          }
          commit('addToCurrentConversation', optimisticMessage)
        }

        const results = await NetworkService.sendTutorBotMessage({
          userId,
          conversationId: state.currentConversation.conversationId,
          message,
          senderUserType,
          sessionId: state.currentConversation.sessionId,
        })

        if (isStandAloneBotConversation) {
          // Only add response to the current session if we aren't watching the session socket
          commit('addToCurrentConversation', results.data.botResponse)
        }
        AnalyticsService.captureEvent(EVENTS.AI_TUTOR_SEND_MESSAGE)
      } catch (e) {
        LoggerService.noticeError(e)
        commit('setError', 'Can not send message')
      } finally {
        commit('setMessageIsSending', false)
      }
    },
    async createConversation(
      { commit, rootState },
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
        const senderUserType = rootState.user.user.type
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
    async fetchAllSubjects({ state, commit }) {
      if (state.subjects.length) return
      const result = await NetworkService.getSubjects()
      commit('setSubjects', result.data.subjects)
    },
    clearErrors({ commit }) {
      commit('clearErrors')
    },
  },

  getters: {
    userConversations(state) {
      return state.userConversations
    },
    currentConversation(state) {
      return {
        ...state.currentConversation,
        messagePreview: state.currentConversation?.messages?.[0]?.message,
        subject: state.subjects.find(
          ({ id }) => id === state.currentConversation.subjectId
        ),
      }
    },
  },
}
