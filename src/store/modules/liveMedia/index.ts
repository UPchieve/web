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
  },
  getters: {
    isBannedFromLiveMedia: (state, getters, rootState, rootGetters) => {
      const banType = rootGetters['user/banType']
      return banType && banType === 'live_media'
    },
    isPartnerBannedFromLiveMedia: (state, _getters, rootState, rootGetters) => {
      if (state.isPartnerJustBannedFromLiveMedia) return true
      const session = rootState.user.session
      const key =
        rootGetters['user/userType'] === 'student'
          ? 'volunteerBannedFromLiveMedia'
          : 'studentBannedFromLiveMedia'
      return session && session[key]
    },
    moderationInfractionSource: (state): string => {
      let source = ''
      switch (state.moderationInfraction?.source) {
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
  },
  actions: {
    reset({ commit, dispatch }) {
      commit('setScreenShareActor', null)
      commit('setIsPartnerJustBannedFromLiveMedia', false)
      commit('setModerationInfraction', null)
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
  },
}
