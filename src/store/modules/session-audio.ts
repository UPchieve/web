import ZoomVideo from '@zoom/videosdk'
import NetworkService from '@/services/NetworkService'
import {
  SessionAudioEvent,
  SessionAudioService,
  SessionAudioState,
} from '@/services/LiveShareService/SessionAudioService'
import { socket } from '@/socket'
import LoggerService from '@/services/LoggerService'

ZoomVideo.preloadDependentAssets()
const zoomClient = ZoomVideo.createClient()

if (ZoomVideo.checkSystemRequirements().audio) {
  zoomClient.init('en-US', 'Global', {
    patchJsMedia: true,
    leaveOnPageUnload: true,
  })
}

const MIN_VOLUME = 0
const MAX_VOLUME = 100

const muteUser = async (stream, zoomUserId) =>
  Promise.allSettled([
    // iOS safari
    stream.muteAllUserAudioLocally(),
    // safari and chrome
    zoomUserId ? stream.muteUserAudioLocally(zoomUserId) : Promise.resolve(),
    // brave and others
    zoomUserId
      ? stream.adjustUserAudioVolumeLocally(zoomUserId, MIN_VOLUME)
      : Promise.resolve(),
  ])

const unmuteUser = async (stream, zoomUserId) =>
  Promise.allSettled([
    // iOS safari
    stream.unmuteAllUserAudioLocally(),
    // safari and chrome
    zoomUserId ? stream.unmuteUserAudioLocally(zoomUserId) : Promise.resolve(),
    // brave and others
    zoomUserId
      ? stream.adjustUserAudioVolumeLocally(zoomUserId, MAX_VOLUME)
      : Promise.resolve(),
  ])

const getDefaultState = () => ({
  // NOTE: sessionAudioState should only ever be set by the SessionAudioService
  sessionAudioState: SessionAudioState.Initial,
  sessionAudio: null,
  isMicMuted: true,
  isSpeaking: false,
  isSpeakingTimeout: null,
  isSpeakerMuted: true,
  isSpeakerOnly: true,
  isPartnerSpeaking: false,
  isPartnerSpeakingTimeout: null,
  myZoomUser: null,
  partnerZoomUser: null,
  isAudioStarted: false,
  displayCallStatus: null,
  everShownDisplayCallStatus: false,
  retryCount: 0,
  retryBackoff: 100,
  isPartnerJustBannedFromLiveMedia: false,
  partnerHasNeverJoinedAudio: true,
  isStartingAudio: false,
  myInProgressCaptionMessage: null,
  partnerInProgressCaptionMessage: null,
  // The zoom transcription client will hold onto unprocessed events even after
  // the audio stream is muted. This state is a workaround to flush any unprocessed events
  // that come through the next time the audio stream is unmuted.
  lastMessageIdBeforeMute: null,
  currentMessageId: null,
  partnerLastMessageIdBeforeMute: null,
  partnerCurrentMessageId: null,
})

export default {
  namespaced: true,
  state: {
    zoomClient,
    micState: 'prompt', // prompt, denied, granted
    ...getDefaultState(),
  },

  getters: {
    audioCallSupported: (state) =>
      state.sessionAudioState !== SessionAudioState.AudioNotSupported,
    partnerIsInAudioChannel: (state) => {
      return Boolean(
        state.partnerZoomUser && state.partnerZoomUser.audio?.length > 0
      )
    },
    micStatus: (state, getters, rootState) => {
      const name = getters.userType === 'student' ? 'Coach' : 'Student'
      const possessive = name + "'s"
      const online = rootState.session.isPartnerOnline
      const deniedMicPermissions =
        state.partnerZoomUser?.isSpeakerOnly && online && getters.partnerIsMuted
      const hasNotJoinedAudioYet =
        state.partnerZoomUser &&
        (state.partnerZoomUser.audio?.length === 0 ||
          typeof state.partnerZoomUser.audio === 'undefined') &&
        getters.partnerIsMuted &&
        online
      if (deniedMicPermissions || state.partnerZoomUser === null) {
        return `${name} has no mic`
      } else if (getters.isPartnerBannedFromLiveMedia) {
        return `${possessive} mic is censored`
      } else if (hasNotJoinedAudioYet && state.partnerHasNeverJoinedAudio) {
        return `${name} has not enabled their mic yet`
      } else if (hasNotJoinedAudioYet || getters.partnerIsMuted) {
        return `${name} has muted their mic`
      } else {
        return null
      }
    },
    partnerStatus: (state, getters, rootState) => {
      const online = rootState.session.isPartnerOnline
      let status = 'Away'
      if (state.isPartnerSpeaking) {
        status = 'Speaking'
      } else if (online) {
        status = 'In session'
      }
      return status
    },
    sessionId: (state, getters, rootState) => {
      return rootState.user.session.id
    },
    userType: (state, getters, rootState) => {
      return rootState.user.user.userType
    },
    partnerIsMuted: (state) => {
      return state.partnerZoomUser?.muted ?? true
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

    hasSpeakingPrivileges: (state) => {
      return ![
        SessionAudioState.JoinedAsBanned,
        SessionAudioState.JoiningAsBanned,
        SessionAudioState.JoinAsBannedError,
      ].includes(state.sessionAudioState)
    },
    isJoining: (state) => {
      return [
        SessionAudioState.Initial,
        SessionAudioState.CheckingEligibility,
        SessionAudioState.Joining,
        SessionAudioState.JoiningAsBanned,
        SessionAudioState.ReactivatingCurrentTab,
      ].includes(state.sessionAudioState)
    },
    isActiveInAnotherTab: (state) => {
      return state.sessionAudioState === SessionAudioState.IsActiveInAnotherTab
    },
  },

  mutations: {
    setIsSpeakerOnly: (state, val) => (state.isSpeakerOnly = val),
    setCaptionsLastMessageIdBeforeMute: (state, val) =>
      (state.lastMessageIdBeforeMute = val),
    setPartnerCaptionsLastMessageIdBeforeMute: (state, val) =>
      (state.partnerLastMessageIdBeforeMute = val),
    setCaptionsCurrentMessageId: (state, val) => (state.currentMessageId = val),
    setPartnerCaptionsCurrentMessageId: (state, val) =>
      (state.partnerCurrentMessageId = val),
    /**
     * @warning setSessionAudioState should only be called by the SessionAudioService
     * state machine transitions.
     */
    setSessionAudioState: (state, sessionAudioState) =>
      (state.sessionAudioState = sessionAudioState),
    setPartnerHasJoinedAudio: (state) => {
      state.partnerHasNeverJoinedAudio = false
    },
    setRetryCount: (state, retryCount) => (state.retryCount = retryCount),
    setRetryBackoff: (state, retryBackoff) =>
      (state.retryBackoff = retryBackoff),
    setDisplayCallStatus: (state, displayCallStatus) =>
      (state.displayCallStatus = displayCallStatus),
    setIsSpeakerMuted: (state, isSpeakerMuted) =>
      (state.isSpeakerMuted = isSpeakerMuted),
    setIsMicMuted: (state, isMicMuted) => (state.isMicMuted = isMicMuted),
    setMyZoomUser: (state, zoomUser) => (state.myZoomUser = zoomUser),
    setPartnerZoomUser: (state, zoomUser) => (state.partnerZoomUser = zoomUser),
    setIsAudioStarted: (state, flag) => (state.isAudioStarted = flag),
    setIsPartnerSpeaking: (state, flag) => (state.isPartnerSpeaking = flag),
    setIsSpeaking: (state, flag) => (state.isSpeaking = flag),
    setEverShownDisplayCallStatus: (state, flag) =>
      (state.everShownDisplayCallStatus = flag),
    updatePartnerZoomUser: (state, zoomUser) =>
      (state.partnerZoomUser = {
        ...state.partnerZoomUser,
        ...zoomUser,
      }),
    updateMyZoomUser: (state, zoomUser) =>
      (state.myZoomUser = { ...state.myZoomUser, ...zoomUser }),
    resetState: (state) => {
      clearTimeout(state.isSpeakingTimeout)
      clearTimeout(state.isPartnerSpeakingTimeout)
      Object.assign(state, {
        zoomClient: state.zoomClient,
        micState: state.micState,
        ...getDefaultState(),
      })
    },
    setIsSpeakingTimeout: (state, timeout) =>
      (state.isSpeakingTimeout = timeout),
    setIsPartnerSpeakingTimeout: (state, timeout) =>
      (state.isPartnerSpeakingTimeout = timeout),
    setMyInProgressCaptionMessage: (state, data) => {
      state.myInProgressCaptionMessage = data
    },
    setPartnerInProgressCaptionMessage: (state, data) => {
      return (state.partnerInProgressCaptionMessage = data)
    },
    setMicState: (state, micState) => (state.micState = micState),
    setIsPartnerJustBannedFromLiveMedia: (state, val) =>
      (state.isPartnerJustBannedFromLiveMedia = val),
    setIsStartingAudio: (state, val) => (state.isStartingAudio = val),
  },

  actions: {
    setMicState: async ({ state, commit, dispatch }, micState) => {
      commit('setMicState', micState)

      // Only do this if the audio has been started. starting audio
      // should be tied to a user action (e.g. a click) otherwise
      // the browser may block us
      if (state.isAudioStarted) {
        if (micState === 'denied') {
          commit('setIsMicMuted', true)
          // if we are denying mic access during the call, stop and rejoin with speaker only
          await state.zoomClient.getMediaStream().stopAudio()
          await dispatch('startAudio', { speakerOnly: true })
        } else {
          // if we grant mic access during the call, stop and rejoin
          await state.zoomClient.getMediaStream().stopAudio()
          await dispatch('startAudio', { speakerOnly: false })
        }
      }
    },
    setActiveSpeakers: ({ commit, state }, payload) => {
      clearTimeout(state.isSpeakingTimeout)
      clearTimeout(state.isPartnerSpeakingTimeout)

      const isSpeaking = payload.some(
        (p) => p.userId === state?.myZoomUser?.userId
      )
      const isPartnerSpeaking = payload.some(
        (p) => p.userId === state?.partnerZoomUser?.userId
      )
      commit('setIsSpeaking', isSpeaking)
      commit('setIsPartnerSpeaking', isPartnerSpeaking)

      commit(
        'setIsSpeakingTimeout',
        setTimeout(() => {
          commit('setIsSpeaking', false)
        }, 1500)
      )
      commit(
        'setIsPartnerSpeakingTimeout',
        setTimeout(() => {
          commit('setIsPartnerSpeaking', false)
        }, 1500)
      )
    },
    resetState: ({ commit }) => commit('resetState'),

    inProgressCaptionMessage: ({ commit, rootState, state }, payload) => {
      const isPartnerMessage = payload.displayName !== rootState.user.user.id
      const isFromBeforeMute =
        state.lastMessageIdBeforeMute === payload.msgId ||
        state.partnerLastMessageIdBeforeMute === payload.msgId
      if (isFromBeforeMute) {
        return
      }

      if (!isPartnerMessage) {
        commit('setMyInProgressCaptionMessage', {
          ...payload,
          user: payload.displayName,
        })
        commit('setCaptionsCurrentMessageId', payload.msgId)
      } else {
        commit('setPartnerInProgressCaptionMessage', {
          text: payload.text,
          zoomMessageId: payload.msgId,
          msgId: payload.msgId,
          userType:
            rootState.user.user.type === 'student' ? 'volunteer' : 'student',
          user: payload.displayName,
        })
        commit('setPartnerCaptionsCurrentMessageId', payload.msgId)
      }
    },
    setCaptionMessage: async (
      { state, commit, dispatch, rootState },
      payload
    ) => {
      if (!payload) return
      const isPartnerMessage = payload.displayName !== rootState.user.user.id
      const isFromBeforeMute =
        state.lastMessageIdBeforeMute === payload.msgId ||
        state.partnerLastMessageIdBeforeMute === payload.msgId

      // Some caller is calling this after message id is removed
      if (isFromBeforeMute) {
        if (isPartnerMessage) {
          commit('setPartnerInProgressCaptionMessage', null)
        } else {
          commit('setMyInProgressCaptionMessage', null)
        }

        return
      }

      if (!isPartnerMessage) {
        commit('setCaptionsCurrentMessageId', payload.msgId)
        await dispatch(
          'user/addPendingMessage',
          {
            contents: payload.text,
            type: 'audio-transcription',
            user: rootState.user.user.id,
            userType: rootState.user.user.userType,
            zoomMessageId: payload.msgId,
          },
          { root: true }
        )
        socket.emit('message', {
          sessionId: rootState.user.session.id,
          // `userIdentity` doesn't come back in this payload :/
          // co-op displayName as our userId
          user: { id: payload.displayName, _id: payload.displayName },
          message: payload.text,
          source: '',
          type: 'audio-transcription',
          saidAt: new Date(payload.timestamp).toISOString(),
          zoomMessageId: payload.msgId,
        })
        commit('setMyInProgressCaptionMessage', null)
      } else {
        commit('setPartnerCaptionsCurrentMessageId', payload.msgId)
        await dispatch(
          'user/addPendingMessage',
          {
            contents: payload.text,
            type: 'audio-transcription',
            user: payload.displayName,
            userType:
              rootState.user.user.type === 'student' ? 'volunteer' : 'student',
            zoomMessageId: payload.msgId,
          },
          { root: true }
        )
        commit('setPartnerInProgressCaptionMessage', null)
      }
    },

    async startAudio({ commit, state }, { speakerOnly = false } = {}) {
      commit('setIsStartingAudio', true)
      try {
        const stream = state.zoomClient.getMediaStream()
        // Start with all audio muted if our speaker is muted
        if (state.isSpeakerMuted) {
          await muteUser(stream, state.partnerZoomUser?.userId)
        } else {
          await unmuteUser(stream, state.partnerZoomUser?.userId)
        }

        if (state.micState === 'denied' || speakerOnly) {
          await stream.startAudio({ speakerOnly: true })
          commit('setIsSpeakerOnly', true)
        } else {
          await stream.startAudio()
          commit('setIsSpeakerOnly', false)
        }
        await stream.muteAudio()

        commit('setIsAudioStarted', true)
      } catch (e) {
        LoggerService.noticeError(JSON.stringify(e))
      } finally {
        commit('setIsStartingAudio', false)
      }
    },

    async toggleMuteMic({ dispatch, state }) {
      if (!state.isAudioStarted) {
        await dispatch('startAudio', { speakerOnly: false })
      } else if (
        state.isAudioStarted &&
        state.micState !== 'denied' &&
        state.isSpeakerOnly
      ) {
        await state.zoomClient.getMediaStream().stopAudio()
        await dispatch('startAudio', { speakerOnly: false })
      }
      await dispatch('updateMicMuted', !state.isMicMuted)
    },

    async updateMicMuted({ commit, state, dispatch }, muted: boolean) {
      const stream = state.zoomClient.getMediaStream()

      if (!muted && state.isMicMuted) {
        await stream.unmuteAudio()
        commit('setIsMicMuted', stream.isAudioMuted())
      } else if (!state.isMicMuted) {
        clearTimeout(state.isSpeakingTimeout)
        commit('setIsSpeaking', false)
        commit('setIsMicMuted', true)
        if (state.myInProgressCaptionMessage) {
          await dispatch('setCaptionMessage', state.myInProgressCaptionMessage)
        }
        commit('setCaptionsLastMessageIdBeforeMute', state.currentMessageId)
        await stream.muteAudio()
      }
    },

    async toggleMuteSpeaker({ dispatch, commit, state }) {
      const isMuted = !state.isSpeakerMuted
      commit('setIsSpeakerMuted', isMuted)

      const stream = state.zoomClient.getMediaStream()
      if (!state.isAudioStarted) {
        await dispatch('startAudio', { speakerOnly: true })
      }

      // If we have a partner in the call
      // AND they have started their audio (e.g. clicked speaker or mic)
      // AND their speaker was muted, unmute them
      if (
        isMuted &&
        state.partnerZoomUser &&
        state.partnerZoomUser?.audio?.length > 0
      ) {
        await muteUser(stream, state.partnerZoomUser?.userId)
      } else if (
        state.partnerZoomUser &&
        state.partnerZoomUser?.audio?.length > 0
      ) {
        await unmuteUser(stream, state.partnerZoomUser?.userId)
        await dispatch('dismissDisplayCallStatus')
      }
    },

    async maybeMutePartnerLocally({ state }, zoomUserId) {
      const stream = state.zoomClient.getMediaStream()
      if (state.isSpeakerMuted) {
        await muteUser(stream, zoomUserId)
      } else {
        await unmuteUser(stream, zoomUserId)
      }
    },

    async setPartnerZoomUser({ dispatch, commit }, zoomUser) {
      commit('setPartnerZoomUser', zoomUser)
      await dispatch('maybeMutePartnerLocally', zoomUser.userId)
    },

    async updatePartnerZoomUser(
      { dispatch, commit, state, getters, rootGetters },
      zoomUser
    ) {
      const wasPreviouslyMuted = getters.partnerIsMuted
      if (state.myZoomUser && state.myZoomUser?.userId !== zoomUser.userId) {
        if (
          (zoomUser?.audio?.length === 0 ||
            state.partnerZoomUser?.audio?.length === 0) &&
          zoomUser.muted === false
        ) {
          // Zoom SDK seems to have a bug where it doesn't always mute
          // even when `await stream.muteAudioUponStartAudio(true)` is called.
          // seems to be a race condition where they are unmuted before Joining
          // audio but then quickly muted after. This is a workaround to ensure
          // they are always muted on join
          zoomUser.muted = true
        }

        commit('updatePartnerZoomUser', zoomUser)
        if (zoomUser.muted) {
          if (!wasPreviouslyMuted && getters.partnerIsMuted) {
            await dispatch('dismissDisplayCallStatus')
          }
          // The partner may still have an in-progress transcription when they mute themself.
          // Send it as the final transcription (consider it complete)
          // and track the message ID so that when they next unmute,
          // we ignore any further transcription events with that ID.
          await dispatch(
            'setCaptionMessage',
            state.partnerInProgressCaptionMessage
          )
          commit(
            'setPartnerCaptionsLastMessageIdBeforeMute',
            state.partnerCurrentMessageId
          )
          commit('setPartnerInProgressCaptionMessage', null)
        }

        const partnerIsInAudioChannel =
          state.partnerZoomUser &&
          state.partnerZoomUser.audio &&
          state.partnerZoomUser.audio.length > 0

        if (partnerIsInAudioChannel) {
          commit('setPartnerHasJoinedAudio')
        }

        const shouldShowDisplayCallStatus =
          partnerIsInAudioChannel &&
          typeof state.partnerZoomUser.muted === 'boolean' &&
          !state.partnerZoomUser.muted &&
          !state.everShownDisplayCallStatus &&
          state.isSpeakerMuted

        if (shouldShowDisplayCallStatus) {
          commit('setDisplayCallStatus', {
            type: 'partner-speaking',
            icon: 'speaker',
            main: `${rootGetters['user/sessionPartner'].firstName} is speaking`,
            secondary: `Click ${rootGetters['user/sessionPartner'].firstName}'s icon to listen`,
            fadeOutAfterMs: 3000,
          })
          commit('setEverShownDisplayCallStatus', true)
        }
      }
      await dispatch('maybeMutePartnerLocally', zoomUser.userId)
    },
    dismissDisplayCallStatus: (
      { commit },
      args = { fadeOut: true, afterMs: 1000 }
    ) => {
      const dismiss = () => commit('setDisplayCallStatus', null)
      if (args.fadeOut) {
        setTimeout(dismiss, args.afterMs)
      } else {
        dismiss()
      }
    },

    async updateMyZoomUser({ commit }, zoomUser) {
      commit('updateMyZoomUser', zoomUser)
    },

    // TDOO create this before volunteer joins
    async syncSessionAudio({ state, getters }) {
      if (!state.sessionAudio) {
        const { data } = await NetworkService.getOrCreateSessionAudio(
          getters.sessionId
        )
        state.sessionAudio = data.sessionAudio
      }

      if (
        getters.userType === 'student' &&
        !state.sessionAudio.studentJoinedAt
      ) {
        state.sessionAudio = await NetworkService.updateSessionAudio(
          getters.sessionId,
          {
            studentJoinedAt: new Date().toISOString(),
          }
        )
      }

      if (
        getters.userType === 'volunteer' &&
        !state.sessionAudio.volunteerJoinedAt
      ) {
        state.sessionAudio = await NetworkService.updateSessionAudio(
          getters.sessionId,
          {
            volunteerJoinedAt: new Date().toISOString(),
          }
        )
      }
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
