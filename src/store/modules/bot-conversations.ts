import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'

export type Subject = {
  id: string
  name: string
  displayName: string
  topicId: string
  topicDisplayName: string
  topicName: string
}

export default {
  namespaced: true,
  state: {
    currentConversation: {},
    messageIsSending: false,
    isFetchingConversation: false,
    errors: [],
  },

  mutations: {
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
  },

  actions: {
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
    async sendMessage(
      { commit, rootState, state, getters, rootGetters },
      message
    ) {
      commit('clearErrors')
      commit('setMessageIsSending', true)
      try {
        const userId = rootState.user.user.id
        const senderUserType = rootGetters['user/userType']
        await NetworkService.sendTutorBotMessage({
          userId,
          conversationId: state.currentConversation.conversationId,
          message,
          senderUserType,
          sessionId: state.currentConversation.sessionId,
          subjectName: getters.currentConversation.subject.name,
        })

        AnalyticsService.captureEvent(EVENTS.AI_TUTOR_SEND_MESSAGE)
      } catch (e) {
        LoggerService.noticeError(e)
        commit('setError', 'Can not send message')
      } finally {
        commit('setMessageIsSending', false)
      }
    },
    clearErrors({ commit }) {
      commit('clearErrors')
    },
  },

  getters: {
    currentConversation(state, getters, rootState) {
      const getSubjectById = (subjectId: number): Subject | undefined => {
        const subjects = state.subjects?.length
          ? state.subjects
          : Object.values(rootState.subjects.subjects)
        return (subjects as Array).find(
          (subject: any) => subject?.id === subjectId
        )
      }
      const currentSubject =
        state.currentConversation?.subject ??
        getSubjectById(state.currentConversation?.subjectId)
      return {
        ...state.currentConversation,
        messagePreview: state.currentConversation?.messages?.[0]?.message,
        subject: currentSubject,
      }
    },
  },
}
