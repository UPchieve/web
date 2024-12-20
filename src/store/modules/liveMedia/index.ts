import ZoomVideo from '@zoom/videosdk'
import audio from './session-audio'
import screenShare from './session-screenshare'
import {
  SessionAudioEvent,
  SessionAudioService,
  SessionAudioState,
} from '@/services/LiveShareService/SessionAudioService'

ZoomVideo.preloadDependentAssets()
const zoomClient = ZoomVideo.createClient()
if (ZoomVideo.checkSystemRequirements().audio) {
  zoomClient.init('en-US', 'Global', {
    patchJsMedia: true,
    leaveOnPageUnload: true,
  })
}

export default {
  namespaced: true,
  modules: {
    audio,
    screenShare,
  },
  state: {
    zoomClient,
    myZoomUser: null,
    partnerZoomUser: null,
    retryCount: 0,
    retryBackoff: 100,
    isPartnerJustBannedFromLiveMedia: false,
    screenShareActor: null,
  },
  mutations: {
    setMyZoomUser: (state, zoomUser) => (state.myZoomUser = zoomUser),
    updateMyZoomUser: (state, zoomUser) => {
      state.myZoomUser = { ...state.myZoomUser, ...zoomUser }
    },
    setPartnerZoomUser: (state, zoomUser) => (state.partnerZoomUser = zoomUser),
    updatePartnerZoomUser: (state, zoomUser) =>
      (state.partnerZoomUser = {
        ...state.partnerZoomUser,
        ...zoomUser,
      }),
    setRetryCount: (state, retryCount) => (state.retryCount = retryCount),
    setRetryBackoff: (state, retryBackoff) =>
      (state.retryBackoff = retryBackoff),
    setIsPartnerJustBannedFromLiveMedia: (state, val) =>
      (state.isPartnerJustBannedFromLiveMedia = val),
    setScreenShareActor(state, actor) {
      state.screenShareActor = actor
    },
  },
  getters: {
    isJoiningCall: (state, getters, rootState, rootGetters) => {
      // @TODO hoist up here from session-audio store
      return rootGetters['liveMedia/audio/isJoining']
    },
    unableToJoinCall: (_state, _getters, rootState) => {
      // @TODO Rename states for UnableToJoinAudio to UnableToJoinCall
      return (
        rootState.liveMedia.audio.sessionAudioState ===
        SessionAudioState.AudioNotSupported
      )
    },
    isBannedFromLiveMedia: (state, getters, rootState, rootGetters) => {
      const banType = rootGetters['user/banType']
      return banType && banType === 'live_media'
    },
    isPartnerBannedFromLiveMedia: (state, getters, rootState) => {
      if (state.isPartnerJustBannedFromLiveMedia) return true
      const session = rootState.user.session
      const key =
        getters.userType === 'student'
          ? 'volunteerBannedFromLiveMedia'
          : 'studentBannedFromLiveMedia'
      return session && session[key]
    },
  },
  actions: {
    async updateMyZoomUser({ commit }, zoomUser) {
      commit('updateMyZoomUser', zoomUser)
    },
    setPartnerZoomUser({ dispatch, commit }, zoomUser) {
      commit('setPartnerZoomUser', zoomUser)
      dispatch('audio/maybeMutePartnerLocally', zoomUser.userId)
    },
    async updatePartnerZoomUser(
      { state, commit, dispatch, rootGetters },
      zoomUser
    ) {
      // @TODO Maybe do a better job of hiding audio-specific logic from here.
      const wasPreviouslyMuted = rootGetters['liveMedia/audio/partnerIsMuted']
      dispatch('audio/maybeMutePartnerLocally', zoomUser.userId) // @TODO Why do we do this?
      if (state?.myZoomUser && state.myZoomUser?.userId === zoomUser.userId)
        return

      // Zoom SDK seems to have a bug where it doesn't always mute
      // even when `await stream.muteAudioUponStartAudio(true)` is called.
      // seems to be a race condition where they are unmuted before Joining
      // audio but then quickly muted after. This is a workaround to ensure
      // they are always muted on join
      if (
        (zoomUser?.audio?.length === 0 ||
          state.partnerZoomUser?.audio?.length === 0) &&
        zoomUser.muted === false
      ) {
        zoomUser.muted = true
      }

      commit('updatePartnerZoomUser', zoomUser)
      dispatch('audio/updatePartnerZoomUser', { zoomUser, wasPreviouslyMuted })
    },

    async bannedFromLiveMedia({ dispatch }) {
      await dispatch(
        'user/addToUser',
        { banType: 'live_media' },
        { root: true }
      )
      await SessionAudioService.send(SessionAudioEvent.BAN)
    },

    partnerBannedFromLiveMedia({ commit }) {
      commit('setIsPartnerJustBannedFromLiveMedia', true)
    },
  },
}
