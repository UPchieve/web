import NetworkService from '@/services/NetworkService'
import { SessionAudioState } from '@/services/LiveShareService/SessionAudioService'
import { socket } from '@/socket'
import LoggerService from '@/services/LoggerService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const MIN_VOLUME = 0
const MAX_VOLUME = 100

const muteUser = async (stream, zoomUserId) => {
  const p = Promise.allSettled([
    // iOS safari
    stream.muteAllUserAudioLocally(),
    // safari and chrome
    zoomUserId ? stream.muteUserAudioLocally(zoomUserId) : Promise.resolve(),
    // brave and others
    zoomUserId
      ? stream.adjustUserAudioVolumeLocally(zoomUserId, MIN_VOLUME)
      : Promise.resolve(),
  ])
  /*
   * iOS safari on initial load
   * This hack is necessary because the zoom SDK does not properly mute the speaker
   * when joining the call in iOS Safari. So what we do is loop through all of the
   * audio elements on the page and mute them.

   * NOTE: the way this works right now is that anytime a participant is added to the call,
   * Zoom adds a new `<audio>` element to the DOM. Since refreshing the page can give a user a new zoom `userId`,
   * it's possible there will be multiple audio elements on the page
  */
  const audioEls = document.querySelectorAll('audio')
  if (audioEls.length > 0) {
    audioEls.forEach((audioEl) => {
      audioEl.muted = true
    })
  }
  return p
}

const unmuteUser = async (stream, zoomUserId) => {
  const p = Promise.allSettled([
    // iOS safari
    stream.unmuteAllUserAudioLocally(),
    // safari and chrome
    zoomUserId ? stream.unmuteUserAudioLocally(zoomUserId) : Promise.resolve(),
    // brave and others
    zoomUserId
      ? stream.adjustUserAudioVolumeLocally(zoomUserId, MAX_VOLUME)
      : Promise.resolve(),
  ])
  // iOS safari on initial load
  const audioEls = document.querySelectorAll('audio')
  if (audioEls.length > 0) {
    audioEls.forEach((audioEl) => {
      audioEl.muted = false
    })
  }

  return p
}

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
  isAudioStarted: false,
  displayCallStatus: null,
  everShownDisplayCallStatus: false,
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
    micState: 'prompt', // prompt, denied, granted
    ...getDefaultState(),
  },

  getters: {
    audioCallSupported: (state) =>
      state.sessionAudioState !== SessionAudioState.AudioNotSupported,
    partnerIsInAudioChannel: (_state, _getters, rootState, rootGetters) => {
      return Boolean(
        rootState.liveMedia.partnerZoomUser &&
          rootState.liveMedia.partnerZoomUser.audio?.length > 0 &&
          !rootGetters['liveMedia/isPartnerBannedFromLiveMedia']
      )
    },
    micStatus: (state, getters, rootState, rootGetters) => {
      const name = getters.userType === 'student' ? 'Coach' : 'Student'
      const possessive = name + "'s"
      const online = rootState.session.isPartnerOnline
      const deniedMicPermissions =
        rootState.liveMedia.partnerZoomUser?.isSpeakerOnly &&
        online &&
        getters.partnerIsMuted
      const hasNotJoinedAudioYet =
        rootState.liveMedia.partnerZoomUser &&
        (rootState.liveMedia.partnerZoomUser.audio?.length === 0 ||
          typeof rootState.liveMedia.partnerZoomUser.audio === 'undefined') &&
        getters.partnerIsMuted &&
        online
      if (
        deniedMicPermissions ||
        rootState.liveMedia.partnerZoomUser === null
      ) {
        return `${name} has no mic`
      } else if (rootGetters['liveMedia/isPartnerBannedFromLiveMedia']) {
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
    partnerIsMuted: (_state, _getters, rootState) => {
      return rootState.liveMedia.partnerZoomUser?.muted ?? true
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
    setDisplayCallStatus: (state, displayCallStatus) =>
      (state.displayCallStatus = displayCallStatus),
    setIsSpeakerMuted: (state, isSpeakerMuted) =>
      (state.isSpeakerMuted = isSpeakerMuted),
    setIsMicMuted: (state, isMicMuted) => (state.isMicMuted = isMicMuted),
    setIsAudioStarted: (state, flag) => (state.isAudioStarted = flag),
    setIsPartnerSpeaking: (state, flag) => (state.isPartnerSpeaking = flag),
    setIsSpeaking: (state, flag) => (state.isSpeaking = flag),
    setEverShownDisplayCallStatus: (state, flag) =>
      (state.everShownDisplayCallStatus = flag),
    resetState: (state) => {
      clearTimeout(state.isSpeakingTimeout)
      clearTimeout(state.isPartnerSpeakingTimeout)
      Object.assign(state, {
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
    setIsStartingAudio: (state, val) => (state.isStartingAudio = val),
  },

  actions: {
    setMicState: async ({ state, rootState, commit, dispatch }, micState) => {
      commit('setMicState', micState)

      // Only do this if the audio has been started. starting audio
      // should be tied to a user action (e.g. a click) otherwise
      // the browser may block us
      if (state.isAudioStarted) {
        if (micState === 'denied') {
          commit('setIsMicMuted', true)
          // if we are denying mic access during the call, stop and rejoin with speaker only
          await rootState.liveMedia.zoomClient.getMediaStream().stopAudio()
          await dispatch('startAudio', { speakerOnly: true })
        } else {
          // if we grant mic access during the call, stop and rejoin
          await rootState.liveMedia.getMediaStream().stopAudio()
          await dispatch('startAudio', { speakerOnly: false })
        }
      }
    },
    setActiveSpeakers: ({ commit, state, rootState, dispatch }, payload) => {
      clearTimeout(state.isSpeakingTimeout)
      clearTimeout(state.isPartnerSpeakingTimeout)

      const isSpeaking = payload.some(
        (p) => p.userId === rootState.liveMedia.myZoomUser?.userId
      )
      const isPartnerSpeaking = payload.some(
        (p) => p.userId === rootState.liveMedia.partnerZoomUser?.userId
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
      if (isSpeaking) {
        AnalyticsService.captureEvent(
          EVENTS.VOICE_CHAT_USER_SPOKE_IN_AUDIO_CHANNEL
        )
      }

      // This hack handles any oddball cases where iOS safari doesn't properly mute the speaker. (ex: user refreshes their page)
      // We spam this everytime a user speaks to ensure the partner's speaker is muted when it should be
      dispatch(
        'maybeMutePartnerLocally',
        rootState.liveMedia.partnerZoomUser?.userId
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

    async startAudio(
      { commit, state, rootState },
      { speakerOnly = false } = {}
    ) {
      commit('setIsStartingAudio', true)
      try {
        const stream = rootState.liveMedia.zoomClient.getMediaStream()
        // Start with all audio muted if our speaker is muted
        // This works in most browsers and will prevent any sound
        // from the partner from being heard while we start up
        if (state.isSpeakerMuted) {
          await muteUser(stream, rootState.liveMedia.partnerZoomUser?.userId)
        } else {
          await unmuteUser(stream, rootState.liveMedia.partnerZoomUser?.userId)
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

        // Because iOS Safari doesn't properly mute the speaker when joining the call,
        // We call it hear after the call starts (which sometimes works and sometimes doesn't :gif of me pulling out my hair:)
        if (state.isSpeakerMuted) {
          await muteUser(stream, rootState.liveMedia.partnerZoomUser?.userId)
        } else {
          await unmuteUser(stream, rootState.liveMedia.partnerZoomUser?.userId)
        }
      } catch (e) {
        LoggerService.noticeError(JSON.stringify(e))
      } finally {
        commit('setIsStartingAudio', false)
      }
    },

    async toggleMuteMic({ dispatch, state, rootState }) {
      if (!state.isAudioStarted) {
        await dispatch('startAudio', { speakerOnly: false })
      } else if (
        state.isAudioStarted &&
        state.micState !== 'denied' &&
        state.isSpeakerOnly
      ) {
        await rootState.liveMedia.zoomClient.getMediaStream().stopAudio()
        await dispatch('startAudio', { speakerOnly: false })
      }
      await dispatch('updateMicMuted', !state.isMicMuted)
    },

    async updateMicMuted(
      { commit, state, rootState, dispatch },
      muted: boolean
    ) {
      const stream = rootState.liveMedia.zoomClient.getMediaStream()

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

    async toggleMuteSpeaker({ dispatch, commit, state, rootState }) {
      const isMuted = !state.isSpeakerMuted
      commit('setIsSpeakerMuted', isMuted)

      const stream = rootState.liveMedia.zoomClient.getMediaStream()
      if (!state.isAudioStarted) {
        await dispatch('startAudio', { speakerOnly: true })
      }

      // If we have a partner in the call
      // AND they have started their audio (e.g. clicked speaker or mic)
      // AND their speaker was muted, unmute them
      if (
        isMuted &&
        rootState.liveMedia.partnerZoomUser &&
        rootState.liveMedia.partnerZoomUser?.audio?.length > 0
      ) {
        await muteUser(stream, rootState.liveMedia.partnerZoomUser?.userId)
      } else if (
        rootState.liveMedia.partnerZoomUser &&
        rootState.liveMedia.partnerZoomUser?.audio?.length > 0
      ) {
        await unmuteUser(stream, rootState.liveMedia.partnerZoomUser?.userId)
        await dispatch('dismissDisplayCallStatus')
      }
    },

    async maybeMutePartnerLocally({ state, rootState }, zoomUserId) {
      const stream = rootState.liveMedia.zoomClient.getMediaStream()
      if (state.isSpeakerMuted) {
        await muteUser(stream, zoomUserId)
      } else {
        await unmuteUser(stream, zoomUserId)
      }
    },

    async updatePartnerZoomUser(
      { dispatch, commit, state, rootState, getters, rootGetters },
      data: { zoomUser: any; wasPreviouslyMuted: boolean }
    ) {
      if (data.zoomUser.muted) {
        if (!data.wasPreviouslyMuted && getters.partnerIsMuted) {
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
        rootState.liveMedia.partnerZoomUser &&
        rootState.liveMedia.partnerZoomUser.audio &&
        rootState.liveMedia.partnerZoomUser.audio.length > 0

      if (partnerIsInAudioChannel) {
        commit('setPartnerHasJoinedAudio')
      }

      const shouldShowDisplayCallStatus =
        partnerIsInAudioChannel &&
        typeof rootState.liveMedia.partnerZoomUser.muted === 'boolean' &&
        !rootState.liveMedia.partnerZoomUser.muted &&
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
  },
}
