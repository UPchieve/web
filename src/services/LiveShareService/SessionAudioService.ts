import store from '@/store'
import LoggerService from '@/services/LoggerService'
import NetworkService from '../NetworkService'
import ZoomVideo from '@zoom/videosdk'
import { createScreenShareActor } from './ScreenShareService'
import { ScreenShareEvent } from './machines/screenShareMachine'

const getSignature = async (sessionId: string) => {
  // Role 1 is host/co-host, 0 is attendee
  const role = 1
  const response = await NetworkService.getZoomSignature(sessionId, role)
  return response.data.signature
}

export enum SessionAudioState {
  Initial = 'Initial',
  CheckingEligibility = 'CheckingEligibility',
  AudioNotSupported = 'AudioNotSupported',
  Joining = 'Joining',
  Joined = 'Joined',
  JoinError = 'JoinError',
  Leaving = 'Leaving',
  End = 'End',
  IsActiveInAnotherTab = 'IsActiveInAnotherTab',
  ReactivatingCurrentTab = 'ReactivatingCurrentTab',
  JoiningAsBanned = 'JoiningAsBanned',
  JoinedAsBanned = 'JoinedAsBanned',
  JoinAsBannedError = 'JoinAsBannedError',
}

export enum SessionAudioEvent {
  CHECK_ELIGIBILITY = 'CHECK_ELIGIBILITY',
  JOIN = 'JOIN',
  JOINED = 'JOINED',
  JOIN_ERROR = 'JOIN_ERROR',
  LEAVE = 'LEAVE',
  LEFT_CALL = 'LEFT_CALL',
  RETRY = 'RETRY',
  AUDIO_NOT_SUPPORTED = 'AUDIO_NOT_SUPPORTED',
  UNABLE_TO_JOIN = 'UNABLE_TO_JOIN',
  JOINED_IN_OTHER_TAB = 'JOINED_IN_OTHER_TAB',
  CLOSED_OTHER_TAB = 'CLOSED_OTHER_TAB',
  REACTIVATE = 'REACTIVATE',
  REACTIVATE_AS_BANNED = 'REACTIVATE_AS_BANNED',
  BAN = 'BAN',
  UNBAN = 'UNBAN',
  JOIN_AS_BANNED = 'JOIN_AS_BANNED',
}
interface FSMStateConfig {
  on?: Partial<Record<SessionAudioEvent, SessionAudioState>>
  actions?: Actions[]
}

interface FSMDefinition {
  initial: SessionAudioState
  states: Record<SessionAudioState, FSMStateConfig>
}

const callStateDefinition: FSMDefinition = {
  initial: SessionAudioState.Initial,
  states: {
    [SessionAudioState.Initial]: {
      on: {
        [SessionAudioEvent.CHECK_ELIGIBILITY]:
          SessionAudioState.CheckingEligibility,
      },
    },
    [SessionAudioState.CheckingEligibility]: {
      actions: ['checkEligibility'],
      on: {
        [SessionAudioEvent.JOIN]: SessionAudioState.Joining,
        [SessionAudioEvent.JOIN_AS_BANNED]: SessionAudioState.JoiningAsBanned,
        [SessionAudioEvent.AUDIO_NOT_SUPPORTED]:
          SessionAudioState.AudioNotSupported,
        [SessionAudioEvent.BAN]: SessionAudioState.JoiningAsBanned,
      },
    },
    [SessionAudioState.AudioNotSupported]: {},
    [SessionAudioState.Joined]: {
      actions: ['createScreenShareActor'],
      on: {
        [SessionAudioEvent.LEAVE]: SessionAudioState.Leaving,
        [SessionAudioEvent.BAN]: SessionAudioState.JoinedAsBanned,
        [SessionAudioEvent.JOINED_IN_OTHER_TAB]:
          SessionAudioState.IsActiveInAnotherTab,
      },
    },
    [SessionAudioState.Joining]: {
      actions: ['joinChannel'],
      on: {
        [SessionAudioEvent.JOINED]: SessionAudioState.Joined,
        [SessionAudioEvent.JOIN_ERROR]: SessionAudioState.JoinError,
      },
    },
    [SessionAudioState.JoinError]: {
      // maybe rename to onEnterEvent
      actions: ['handleJoinError'],
      on: {
        [SessionAudioEvent.RETRY]: SessionAudioState.Joining,
        [SessionAudioEvent.UNABLE_TO_JOIN]: SessionAudioState.AudioNotSupported,
      },
    },
    [SessionAudioState.IsActiveInAnotherTab]: {
      actions: ['inactivate'],
      on: {
        [SessionAudioEvent.CLOSED_OTHER_TAB]:
          SessionAudioState.ReactivatingCurrentTab,
      },
    },
    [SessionAudioState.ReactivatingCurrentTab]: {
      actions: ['reactivate'],
      on: {
        [SessionAudioEvent.REACTIVATE]: SessionAudioState.Joined,
        [SessionAudioEvent.REACTIVATE_AS_BANNED]:
          SessionAudioState.JoinedAsBanned,
      },
    },
    [SessionAudioState.Leaving]: {
      actions: ['leaveChannel'],
      on: {
        [SessionAudioEvent.LEFT_CALL]: SessionAudioState.End,
      },
    },
    [SessionAudioState.JoinedAsBanned]: {
      actions: ['revokeLiveMediaPrivileges'], // grant/revoke can maybe be a derived state
      on: {
        [SessionAudioEvent.UNBAN]: SessionAudioState.Joined,
        [SessionAudioEvent.LEAVE]: SessionAudioState.Leaving,
        [SessionAudioEvent.JOINED_IN_OTHER_TAB]:
          SessionAudioState.IsActiveInAnotherTab,
      },
    },
    [SessionAudioState.JoiningAsBanned]: {
      actions: ['joinChannelAsBanned'],
      on: {
        [SessionAudioEvent.JOINED]: SessionAudioState.JoinedAsBanned,
        [SessionAudioEvent.JOIN_ERROR]: SessionAudioState.JoinAsBannedError,
      },
    },
    [SessionAudioState.JoinAsBannedError]: {
      actions: ['handleJoinError'],
      on: {
        [SessionAudioEvent.RETRY]: SessionAudioState.JoiningAsBanned,
        [SessionAudioEvent.UNABLE_TO_JOIN]: SessionAudioState.AudioNotSupported,
      },
    },
    [SessionAudioState.End]: {
      on: {
        [SessionAudioEvent.CHECK_ELIGIBILITY]:
          SessionAudioState.CheckingEligibility,
      },
    },
  },
}

const userAddedHandler = async (zoomUsers) => {
  for (const zoomUser of zoomUsers) {
    const isMeInAnotherTab =
      zoomUser.userIdentity ===
        store.state.liveMedia.audio.myZoomUser?.userIdentity &&
      zoomUser.userId !== store.state.liveMedia.audio.myZoomUser?.userId

    /*
      user is me in another tab, move state to JOINED_IN_OTHER_TAB
      in this state, we want to disable any audio controls but
      we want to stay in the call and listen to the events. that way
      if i close the other tab, i can rejoin in this tab
    */
    if (isMeInAnotherTab) {
      await SessionAudioService.send(SessionAudioEvent.JOINED_IN_OTHER_TAB)
      continue
    }
    zoomUser.userIdentity === store.state.user.user.id
      ? store.commit('liveMedia/setMyZoomUser', zoomUser)
      : store.dispatch('liveMedia/setPartnerZoomUser', zoomUser)
  }
}
const userRemovedHandler = async (zoomUsers) => {
  for (const zoomUser of zoomUsers) {
    const isMeInAnotherTab =
      zoomUser.userIdentity ===
        store.state.liveMedia.audio.myZoomUser?.userIdentity &&
      zoomUser.userId !== store.state.liveMedia.audio.myZoomUser?.userId

    /*
      user is me in another tab, move state to JOINED_IN_OTHER_TAB
      in this state, we want to disable any audio controls but
      we want to stay in the call and listen to the events. that way
      if i close the other tab, i can rejoin in this tab
    */
    if (isMeInAnotherTab) {
      await SessionAudioService.send(SessionAudioEvent.CLOSED_OTHER_TAB)
      continue
    }

    if (zoomUser.userIdentity !== store.state.user.user.id) {
      store.commit('liveMedia/setPartnerZoomUser', null)
    }
  }
}

const userUpdatedHandler = async (zoomUsers) => {
  for (const zoomUser of zoomUsers) {
    if (zoomUser.userIdentity === store.state.user.user.id) {
      store.dispatch('liveMedia/updateMyZoomUser', zoomUser)
    } else {
      store.dispatch('liveMedia/updatePartnerZoomUser', zoomUser)
    }
  }
}
const activeSpeakerHandler = (payload) => {
  store.dispatch('liveMedia/audio/setActiveSpeakers', payload)
}

const captionMessageHandler = (payload) => {
  if (payload.done) {
    store.dispatch('liveMedia/audio/setCaptionMessage', payload)
  } else {
    store.dispatch('liveMedia/audio/inProgressCaptionMessage', payload)
  }
}
const devicePermissionChangeHandler = (payload) => {
  if (payload.name === 'microphone') {
    store.dispatch('liveMedia/audio/setMicState', payload.state)
  }
}

const screenShareHandler = (payload: {
  state: 'Active' | 'Inactive'
  userId: string
}) => {
  if (payload.state === 'Active' && store.state.liveMedia.screenShareActor) {
    store.state.liveMedia.screenShareActor.send(
      ScreenShareEvent.SCREEN_SHARE_ACTIVATED,
      { zoomUserId: payload.userId }
    )
  } else if (
    payload.state === 'Inactive' &&
    store.state.liveMedia.screenShareActor
  ) {
    // NOTE: this only gets hit if this user has called `stream.startShareView`
    store.state.liveMedia.screenShareActor.send(
      ScreenShareEvent.SCREEN_SHARE_DEACTIVATED
    )
    store.dispatch('liveMedia/screenShare/setScreenShareDimensions', {
      width: undefined,
      height: undefined,
    })
  }
}

// Passive stop is when the share is stopped w/o clicking "Stop Sharing,"
// i.e. by removing the browser permissions
const passivelyStopShareHandler = () => {
  store.state.liveMedia.screenShareActor.send(
    ScreenShareEvent.STOP_SCREEN_SHARE
  )
  store.dispatch('liveMedia/screenShare/setScreenShareDimensions', {
    width: undefined,
    height: undefined,
  })
}

const shareContentDimensionChange = (payload) => {
  store.dispatch('liveMedia/screenShare/setScreenShareDimensions', {
    width: payload.width,
    height: payload.height,
  })
}

type Actions = keyof (typeof SessionAudioService)['actions']

export class SessionAudioService {
  static async start() {
    await this.send(SessionAudioEvent.CHECK_ELIGIBILITY)
  }
  static async send(event: SessionAudioEvent) {
    const currentState = store.state.liveMedia.audio
      .sessionAudioState as SessionAudioState
    const currentStateConfig = callStateDefinition.states[currentState]
    const nextState = currentStateConfig?.on?.[event]

    if (nextState) {
      store.commit('liveMedia/audio/setSessionAudioState', nextState)

      const nextStateConfig =
        callStateDefinition.states[nextState as SessionAudioState]

      for (const action of nextStateConfig?.actions ?? []) {
        await this.actions[action]()
      }
    } else {
      LoggerService.noticeError(
        `Invalid transition, event: '${event}' sent while in state: '${currentState}'`
      )
    }
  }

  private static actions = {
    createScreenShareActor() {
      const screenShareActor = createScreenShareActor({ inspect: false })
      screenShareActor.start()
      store.commit('liveMedia/setScreenShareActor', screenShareActor)
    },
    async handleJoinError() {
      LoggerService.noticeError('Failed to join call, retrying...')

      if (store.state.liveMedia.retryCount < 5) {
        setTimeout(async () => {
          store.commit(
            'liveMedia/setRetryCount',
            store.state.liveMedia.retryCount + 1
          )
          store.commit(
            'liveMedia/setRetryBackoff',
            store.state.liveMedia.retryBackoff * 3
          )
          await SessionAudioService.send(SessionAudioEvent.RETRY)
        }, store.state.liveMedia.retryBackoff)
      } else {
        LoggerService.noticeError('Unable to join call. Not retrying')
        await SessionAudioService.send(SessionAudioEvent.UNABLE_TO_JOIN)
      }
    },

    async joinChannelCommon() {
      try {
        await store.dispatch('liveMedia/audio/syncSessionAudio')
        const zoomClient = store.state.liveMedia.zoomClient

        /* TODO: we should remove these handlers in a`JoinError` state action
          or add the event handlers in an earlier state. that way we don't risk
          adding duplicate handlers if something in here throws an error
        */
        this.removeHandlers()

        zoomClient.on('user-added', userAddedHandler)
        zoomClient.on('user-removed', userRemovedHandler)
        zoomClient.on('user-updated', userUpdatedHandler)
        zoomClient.on(`caption-message`, captionMessageHandler)
        zoomClient.on(`active-speaker`, activeSpeakerHandler)
        zoomClient.on(`device-permission-change`, devicePermissionChangeHandler)
        zoomClient.on(`active-share-change`, screenShareHandler)
        zoomClient.on('passively-stop-share', passivelyStopShareHandler)
        zoomClient.on(
          'share-content-dimension-change',
          shareContentDimensionChange
        )
        // NOTE: when adding a new handler, make sure to remove it in the `leaveChannel` method

        const token = await getSignature(
          store.getters['liveMedia/audio/sessionId']
        )

        /*
         Zoom sometimes stalls on the `.join` but it doesn't throw an error.
         Inspecting the websocket messages, I can see that an error is returned but
         the zoom client seems to ignore it and I couldn't find anything in the docs
         or online around what MMR full means.

         error details: "error_desc":"FailedFromZcOrMmr, RESULT_MMR_FULL, 103008, MMR full"

         To handle that, we're setting a time out to reject the `.race`. This will put us in the
         `JoinError` state which will retry the join and get the zoom client in a good state.
        */
        await Promise.race([
          zoomClient.join(
            store.getters['liveMedia/audio/sessionId'],
            token,
            store.state.user.user.id
          ),
          new Promise((resolve, reject) =>
            setTimeout(() => reject('No response from zoom'), 10000)
          ),
        ])

        if (zoomClient.isHost() || zoomClient.isManager()) {
          const stream = zoomClient.getMediaStream()
          await stream.muteAudioUponStartAudio(true)
        }

        const ltc =
          store.state.liveMedia.zoomClient.getLiveTranscriptionClient()
        await ltc.startLiveTranscription({ language: 'en' })
      } catch (e) {
        LoggerService.noticeError(e)
        await SessionAudioService.send(SessionAudioEvent.JOIN_ERROR)
      }
    },

    async joinChannel() {
      try {
        await this.joinChannelCommon()
        await SessionAudioService.send(SessionAudioEvent.JOINED)
      } catch (e) {
        LoggerService.noticeError(e)
        await SessionAudioService.send(SessionAudioEvent.JOIN_ERROR)
      }
    },

    async joinChannelAsBanned() {
      try {
        await this.joinChannelCommon()
        await this.revokeLiveMediaPrivileges()
        await SessionAudioService.send(SessionAudioEvent.JOINED)
      } catch (e) {
        LoggerService.noticeError(e)
        await SessionAudioService.send(SessionAudioEvent.JOIN_ERROR)
      }
    },

    async leaveChannel() {
      try {
        // TODO: do we need a retry if this somehow throws?
        // and if we can never leave, then refresh the page?
        this.removeHandlers()

        store.state.liveMedia.screenShareActor.send(ScreenShareEvent.DESTROY)
        store.commit('liveMedia/setScreenShareActor', null)

        await store.state.liveMedia.zoomClient.getMediaStream().stopAudio()
        await store.state.liveMedia.zoomClient.leave()
        // reset audio
        await SessionAudioService.send(SessionAudioEvent.LEFT_CALL)
      } catch (e) {
        LoggerService.noticeError(e)
      } finally {
        store.dispatch('liveMedia/audio/resetState')
      }
    },

    async inactivate() {
      const zoomClient = store.state.liveMedia.zoomClient
      // Remove all handlers EXCEPT for device-permissions and user-removed
      zoomClient.off('user-added', userAddedHandler)
      zoomClient.off('user-updated', userUpdatedHandler)
      zoomClient.off(`caption-message`, captionMessageHandler)
      zoomClient.off(`active-speaker`, activeSpeakerHandler)
      zoomClient.off(
        'share-content-dimension-change',
        shareContentDimensionChange
      )

      await store.state.liveMedia.zoomClient.getMediaStream().stopAudio()
      store.commit('liveMedia/audio/setIsMicMuted', true)
      // TODO why is the `paratner speaking` pop up showing?
    },

    async reactivate() {
      const zoomClient = store.state.liveMedia.zoomClient
      zoomClient.on('user-added', userAddedHandler)
      zoomClient.on('user-updated', userUpdatedHandler)
      zoomClient.on(`caption-message`, captionMessageHandler)
      zoomClient.on(`active-speaker`, activeSpeakerHandler)
      zoomClient.on(
        'share-content-dimension-change',
        shareContentDimensionChange
      )

      await store.dispatch('liveMedia/audio/startAudio')

      if (store.state.liveMedia.audio.isBanned) {
        await SessionAudioService.send(SessionAudioEvent.REACTIVATE_AS_BANNED)
      } else {
        await SessionAudioService.send(SessionAudioEvent.REACTIVATE)
      }
    },

    removeHandlers() {
      const zoomClient = store.state.liveMedia.zoomClient
      zoomClient.off('user-added', userAddedHandler)
      zoomClient.off('user-removed', userRemovedHandler)
      zoomClient.off('user-updated', userUpdatedHandler)
      zoomClient.off(`caption-message`, captionMessageHandler)
      zoomClient.off(`active-speaker`, activeSpeakerHandler)
      zoomClient.off(`device-permission-change`, devicePermissionChangeHandler)
      zoomClient.off(`active-share-change`, screenShareHandler)
      zoomClient.off('passively-stop-share', passivelyStopShareHandler)
      zoomClient.off(
        'share-content-dimension-change',
        shareContentDimensionChange
      )
    },

    async revokeLiveMediaPrivileges() {
      if (store.state.liveMedia?.screenShareActor) {
        await store.state.liveMedia?.screenShareActor?.send(
          ScreenShareEvent.STOP_SCREEN_SHARE
        )
      }
      await store.dispatch('liveMedia/audio/updateMicMuted', true)
    },

    async checkEligibility() {
      if (!ZoomVideo.checkSystemRequirements().audio) {
        return await SessionAudioService.send(
          SessionAudioEvent.AUDIO_NOT_SUPPORTED
        )
      }

      const isBannedFromLiveMedia =
        store.getters['liveMedia/isBannedFromLiveMedia']
      if (isBannedFromLiveMedia) {
        await SessionAudioService.send(SessionAudioEvent.JOIN_AS_BANNED)
      } else {
        await SessionAudioService.send(SessionAudioEvent.JOIN)
      }
    },
  }
}
