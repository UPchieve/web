import audio from './session-audio'

export default {
  namespaced: true,
  modules: { audio },
  state: {
    retryCount: 0,
    retryBackoff: 100,
    isPartnerJustBannedFromLiveMedia: false,
    screenShareActor: null,
    moderationInfraction: null,
    potentialPartnerInfraction: null,
    partnerAckLiveMediaBan: null,
  },
  mutations: {
    setIsPartnerJustBannedFromLiveMedia: (state, val) =>
      (state.isPartnerJustBannedFromLiveMedia = val),
    setScreenShareActor(state, actor) {
      state.screenShareActor = actor
    },
    setModerationInfraction(state, infraction) {
      state.moderationInfraction = infraction
    },

    setPotentialPartnerInfraction(state, infraction) {
      state.potentialPartnerInfraction = infraction
    },
    setPartnerAckLiveMediaBan(state, banType: string) {
      state.partnerAckLiveMediaBan = banType
    },
  },
  getters: {
    isBannedFromLiveMedia: (state, getters, rootState, rootGetters) => {
      const banType = rootGetters['user/banType']
      return Boolean(banType && banType === 'live_media')
    },
    isPartnerBannedFromLiveMedia: (state, _getters, rootState, rootGetters) => {
      if (state?.isPartnerJustBannedFromLiveMedia) return true
      const session = rootState.user.session
      const key =
        rootGetters['user/userType'] === 'student'
          ? 'volunteerBannedFromLiveMedia'
          : 'studentBannedFromLiveMedia'
      return session && session[key]
    },
    moderationInfractionSource: (state): string => {
      let source
      switch (state.moderationInfraction?.source) {
        case 'whiteboard_text_node':
          source = 'whiteboard text content'
          break
        case 'audio_transcription':
          source = 'microphone use'
          break
        case 'screenshare':
          source = 'screenshare use'
          break
        case 'image_upload':
          source = 'image use'
          break
        //used for a session partner's moderation toast message
        case 'session_partner_student_image_upload':
          source = "student's image upload"
          break
        case 'session_partner_coach_image_upload':
          source = "coach's image upload"
          break
        default:
          source = 'screenshare or microphone use'
          break
      }
      return source
    },
    screenShareActor: (state) => {
      return state.screenShareActor
    },
  },
  actions: {
    reset({ commit, dispatch }, data) {
      if (!data?.dontDeleteScreenShareActor) {
        commit('setScreenShareActor', null)
      }
      commit('setIsPartnerJustBannedFromLiveMedia', false)
      commit('setModerationInfraction', null)
      commit('setPotentialPartnerInfraction', null)
      dispatch('liveMedia/audio/resetSessionAudio', null, { root: true })
    },

    async bannedFromLiveMedia({ dispatch, state }) {
      await dispatch(
        'user/addToUser',
        { banType: 'live_media' },
        { root: true }
      )
      state.screenShareActor?.send({ type: 'ban_user_from_live_media' })
    },

    partnerBannedFromLiveMedia({ commit }) {
      commit('setIsPartnerJustBannedFromLiveMedia', true)
    },

    handleModerationInfraction({ state, commit }, data) {
      commit('setModerationInfraction', data)
      if (data.stopStreamImmediatelyReasons?.length) {
        state.screenShareActor?.send({ type: 'stop_stream' })
      }
    },
    handlePotentialPartnerInfraction({ commit }, data) {
      commit('setPotentialPartnerInfraction', data)
    },
    async handlePartnerAckLiveMediaBan({ dispatch, commit, state }, data) {
      if (!data.isBanned) {
        await dispatch('user/addToUser', { banType: null }, { root: true })
        await dispatch('reset', { dontDeleteScreenShareActor: true })
        commit('setPartnerAckLiveMediaBan', 'not_banned')
        state.screenShareActor?.send({
          type: 'not_banned',
        })
      } else {
        commit('setPartnerAckLiveMediaBan', 'banned')
      }
    },
  },
}
