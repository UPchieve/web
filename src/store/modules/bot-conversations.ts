import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'

const SUPPORTED_SUBJECTS = [
  '6thGradeMath',
  '7thGradeMath',
  '8thGradeMath',
  'prealgebra',
  'algebraOne',
]

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
      state.subjects = SUPPORTED_SUBJECTS.reduce((subs, subject) => {
        const supported = subjects?.[subject] ?? []
        return subs.concat(supported)
      }, [])
    },
  },

  actions: {
    resetCurrentConversation({ commit }) {
      commit('setCurrentConversation', {})
    },
    async setConversation({ commit, state }, conversationId: string) {
      if (state.currentConversation.conversationId === conversationId) return
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
        // Optimistically insert message from user
        const optimisticMessage = {
          message,
          senderUserType,
          tutorBotConversationId: state.currentConversation.conversationId,
          userId,
        }
        commit('addToCurrentConversation', optimisticMessage)
        const results = await NetworkService.sendTutorBotMessage({
          userId,
          conversationId: state.currentConversation.conversationId,
          message,
          senderUserType,
        })
        commit('addToCurrentConversation', results.data.botResponse)
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
      { message, subjectId }: { message: string; subjectId: number }
    ) {
      commit('setCurrentConversation', {})
      commit('clearErrors')
      commit('setIsFetchingConversation', true)
      try {
        const userId = rootState.user.user.id
        const sessionId = rootState.user.session.id
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
