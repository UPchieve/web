import { socket } from '@/socket'

export default {
  namespaced: true,
  state: {
    displayCallStatus: null,
    everShownDisplayCallStatus: false,
    myInProgressCaptionMessage: null,
    partnerInProgressCaptionMessage: null,
    currentMessageId: null,
    partnerCurrentMessageId: null,
  },

  getters: {
    sessionId: (state, getters, rootState) => {
      return rootState.user.session.id
    },
    userType: (state, getters, rootState) => {
      return rootState.user.user.userType
    },
  },

  mutations: {
    setCaptionsCurrentMessageId: (state, val) => (state.currentMessageId = val),
    setPartnerCaptionsCurrentMessageId: (state, val) =>
      (state.partnerCurrentMessageId = val),
    setDisplayCallStatus: (state, displayCallStatus) =>
      (state.displayCallStatus = displayCallStatus),
    setEverShownDisplayCallStatus: (state, flag) =>
      (state.everShownDisplayCallStatus = flag),
    setMyInProgressCaptionMessage: (state, data) => {
      state.myInProgressCaptionMessage = data
    },
    setPartnerInProgressCaptionMessage: (state, data) => {
      return (state.partnerInProgressCaptionMessage = data)
    },
  },

  actions: {
    resetSessionAudio: ({ commit }) => {
      commit('setMyInProgressCaptionMessage', null)
      commit('setPartnerInProgressCaptionMessage', null)
      commit('setCaptionsCurrentMessageId', null)
      commit('setPartnerCaptionsCurrentMessageId', null)
      commit('setDisplayCallStatus', null)
      commit('setEverShownDisplayCallStatus', false)
    },
    inProgressCaptionMessage: (
      { commit, rootState, rootGetters },
      payload: {
        resultId: string
        alternatives: {
          transcript: string
          items: {
            attendee: { externalUserId: string }
            type: 'pronunciation' | 'punctuation'
          }[]
        }[]
      }
    ) => {
      const mostConfident = payload.alternatives[0]
      const { transcript, items } = mostConfident
      const userId = items[0].attendee.externalUserId
      const isPartnerMessage = userId !== rootState.user.user.id
      if (isPartnerMessage) {
        commit('setPartnerInProgressCaptionMessage', {
          text: transcript,
          msgId: payload.resultId,
          userType:
            rootGetters['user/userType'] === 'student'
              ? 'volunteer'
              : 'student',
          user: userId,
        })
        commit('setPartnerCaptionsCurrentMessageId', payload.resultId)
      } else {
        commit('setMyInProgressCaptionMessage', {
          text: transcript,
          msgId: payload.resultId,
          userType: rootGetters['user/userType'],
          user: userId,
        })
        commit('setCaptionsCurrentMessageId', payload.resultId)
      }
    },

    setCaptionMessage: async (
      { commit, dispatch, rootState },
      payload: {
        resultId: string
        endTimeMs: number
        alternatives: {
          transcript: string
          items: {
            attendee: { externalUserId: string }
            type: 'pronunciation' | 'punctuation'
          }[]
        }[]
      }
    ) => {
      const mostConfident = payload.alternatives[0]
      const { transcript, items } = mostConfident
      const userId = items[0].attendee.externalUserId
      const isPartnerMessage = userId !== rootState.user.user.id
      if (isPartnerMessage) {
        commit('setPartnerCaptionsCurrentMessageId', payload.resultId)
        await dispatch(
          'user/addPendingMessage',
          {
            contents: transcript,
            type: 'audio-transcription',
            user: userId,
            userType:
              rootState.user.user.type === 'student' ? 'volunteer' : 'student',
            msgId: payload.resultId,
          },
          { root: true }
        )
        commit('setPartnerInProgressCaptionMessage', null)
      } else {
        commit('setCaptionsCurrentMessageId', payload.resultId)
        await dispatch(
          'user/addPendingMessage',
          {
            contents: transcript,
            type: 'audio-transcription',
            user: userId,
            userType: rootState.user.user.userType,
            msgId: payload.resultId,
          },
          { root: true }
        )
        socket.emit('message', {
          sessionId: rootState.user.session.id,
          // `userIdentity` doesn't come back in this payload :/
          // co-op displayName as our userId
          user: { id: userId, _id: userId },
          message: transcript,
          source: '',
          type: 'audio-transcription',
          saidAt: new Date(payload.endTimeMs).toISOString(),
          msgId: payload.resultId,
        })
        commit('setMyInProgressCaptionMessage', null)
      }
    },

    dismissDisplayCallStatus: ({ commit }, args: { afterMs?: number } = {}) => {
      const dismiss = () => commit('setDisplayCallStatus', null)
      if (args?.afterMs) {
        setTimeout(dismiss, args.afterMs)
      } else {
        commit('setEverShownDisplayCallStatus', true)
        dismiss()
      }
    },
    setDisplayCallStatus: ({ commit, dispatch }, displayCallStatus) => {
      commit('setDisplayCallStatus', displayCallStatus)
      if (displayCallStatus?.fadeOutAfterMs) {
        dispatch('dismissDisplayCallStatus', {
          afterMs: displayCallStatus.fadeOutAfterMs,
        })
      }
    },
  },
}
