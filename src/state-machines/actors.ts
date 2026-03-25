import NetworkService from '@/services/NetworkService'
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  DefaultModality,
  LogLevel,
  MeetingSessionConfiguration,
  VideoTileState,
  type AudioVideoFacade,
  type EventName,
} from 'amazon-chime-sdk-js'
import { fromCallback, fromPromise } from 'xstate'
import type { Context, Events, Attendee } from './meeting-machine'
import { moderateScreenShare } from '@/services/LiveShareService/moderation-tools'
import store from '@/store'
import { CustomActiveSpeakerPolicy } from '@/utils/CustomActiveSpeakerPolicy'

export const fetchChimeMeeting = fromPromise(
  async ({ input }: { input: { sessionId: string | null } }) => {
    if (!input.sessionId) {
      // @TODO have a state that handles the error, log it and display it
      throw new Error('Session ID is required')
    }
    const { data } = await NetworkService.getOrCreateSessionMeeting(
      input.sessionId
    )
    return data
  }
)

export const createMeetingSession = fromPromise(
  async ({
    input,
  }: {
    input: { context: Context }
  }): Promise<{ meetingSession: DefaultMeetingSession }> => {
    const logger = new ConsoleLogger('chimeMeetingLogger', LogLevel.WARN)
    const deviceController = new DefaultDeviceController(logger)
    const meetingSessionConfig = new MeetingSessionConfiguration(
      input.context.meeting,
      input.context.attendee
    )

    const meetingSession = new DefaultMeetingSession(
      meetingSessionConfig,
      logger,
      deviceController
    )
    return { meetingSession }
  }
)

function startScreenShareObserver({
  audioVideo,
  videoElement,
  attendee,
  parent,
}: {
  audioVideo: AudioVideoFacade
  videoElement: HTMLVideoElement | null
  attendee?: Attendee
  parent: { send: (event: Events) => void }
}) {
  // @TODO: for some reason the `sendBack` that we're supposed to pass in doesn't work
  // I suspect it might be due to the `define: { global: {} }` in our vite.config.
  // Passing it in to the `videoTileDidUpdate` function seems to lose the reference to the parent
  // Using parent directly works becaue (i'm guessing) it's not referenceing `global` which maybe xstate
  // defines one way and aws defines another :shrug:
  const sendBack = (e: Events) => parent.send(e)
  const screenShareObserver = {
    videoTileDidUpdate: (tileState: VideoTileState) => {
      sendBack({
        type: 'set_screen_share_dimensions',
        width: tileState.videoStreamContentWidth ?? 0,
        height: tileState.videoStreamContentHeight ?? 0,
      })
      if (!tileState.boundAttendeeId) return // Ignore unbound tiles
      const myId = attendee?.AttendeeId
      if (tileState.isContent && myId) {
        const boundAttendeeId = tileState.boundAttendeeId
        const baseAttendeeId = new DefaultModality(boundAttendeeId).base()
        if (!videoElement) throw 'No video element is available'

        if (myId === baseAttendeeId) {
          // Bind video element when content share starts
          audioVideo.bindVideoElement(tileState.tileId!, videoElement)
        }

        if (myId !== baseAttendeeId) {
          audioVideo.bindVideoElement(tileState.tileId!, videoElement)
          sendBack({ type: 'partner_shared_screen' })
        }
      }
    },
    contentShareDidStop: () => {
      sendBack({ type: 'stop_share_screen' })
    },
    videoTileWasRemoved: () => {
      sendBack({ type: 'partner_stopped_sharing_screen' })
    },
  }

  audioVideo.addContentShareObserver(screenShareObserver)
  audioVideo.addObserver(screenShareObserver)

  return () => {
    audioVideo.removeContentShareObserver(screenShareObserver)
    audioVideo.removeObserver(screenShareObserver)
  }
}

export const joinMeeting = fromCallback(
  ({
    input,
    sendBack,
  }: {
    input: {
      context: Context
      parent: { stop: () => void; send: (event: Events) => void }
    }
    sendBack: (event: Events) => void
  }) => {
    const sendBackToParent = (e: Events) => input.parent.send(e)
    const { meetingSession, partnerAttendeeId, attendee } = input.context

    // This is hoisted up here because we may need to either attach this handler right away if there already
    // is a partner attendee, or later when a new one is added (which is handled in its own handler)
    const subscribeToPartnerVolumeChanges = (partnerAttendeeId: string) => {
      meetingSession!.audioVideo.realtimeSubscribeToVolumeIndicator(
        partnerAttendeeId,
        (
          _attendeeId: string,
          _volume: number | null,
          muted: boolean | null // null indicates no change
        ) => {
          if (muted !== null) {
            sendBackToParent({ type: 'partner_mute_change', muted })
          }
          sendBackToParent({ type: 'received_partner_audio_info' })
        }
      )
    }

    const partnerAddedObserver = (
      attendeeId: string,
      _present: boolean,
      externalUserId?: string
    ) => {
      if (externalUserId === store.getters['user/sessionPartner'].id) {
        subscribeToPartnerVolumeChanges(attendeeId)
        sendBackToParent({
          type: 'new_partner_attendee',
          partnerAttendeeId: attendeeId,
        })
      }
    }

    meetingSession!.audioVideo.realtimeSubscribeToAttendeeIdPresence(
      partnerAddedObserver
    )

    const meetingStartedObserver = {
      eventDidReceive(name: EventName) {
        if (name === 'meetingStartSucceeded') {
          sendBackToParent({ type: 'meeting_started' })
        }
        if (name === 'meetingEnded') {
          sendBackToParent({ type: 'meeting_ended' })
        }
      },
    }
    meetingSession!.eventController!.addObserver(meetingStartedObserver)
    const unsubscribeScreenShareHandler = startScreenShareObserver({
      audioVideo: meetingSession!.audioVideo,
      videoElement: input.context.videoOutputElement,
      attendee: attendee || undefined,
      parent: input.parent,
    })

    if (partnerAttendeeId) {
      subscribeToPartnerVolumeChanges(partnerAttendeeId)
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const activeSpeakerCallback = (speakerIds: string[]) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (speakerIds.length === 0) {
        timeoutId = setTimeout(() => {
          sendBackToParent({ type: 'active_speakers_changed', speakerIds })
        }, 1000)
      } else {
        sendBackToParent({ type: 'active_speakers_changed', speakerIds })
      }
    }

    meetingSession!.audioVideo.subscribeToActiveSpeakerDetector(
      new CustomActiveSpeakerPolicy(),
      activeSpeakerCallback
    )

    const transcriptionObserver = (event) => {
      if (event.type === 'started') {
        sendBackToParent({
          type: 'transcription_status_changed',
          status: 'started',
        })
      }
      if (event.type === 'stopped') {
        sendBackToParent({
          type: 'transcription_status_changed',
          status: 'stopped',
        })
      }
      if (!event.results) return
      // https://docs.aws.amazon.com/chime-sdk/latest/dg/process-msgs.html
      // eventually, we can use the `entities` value (in alternatives) to identify PII for moderation
      for (const result of event.results) {
        if (result.isPartial) {
          store.dispatch('liveMedia/audio/inProgressCaptionMessage', result)
        } else {
          store.dispatch('liveMedia/audio/setCaptionMessage', result)
        }
      }
    }
    if (!store.getters['featureFlags/isNewSpeechToTextEnabled']) {
      meetingSession!.audioVideo.transcriptionController?.subscribeToTranscriptEvent(
        transcriptionObserver
      )
    }

    const observers = {
      transcriptionObserver,
      partnerAddedObserver,
      meetingStartedObserver,
      activeSpeakerCallback,
      unsubscribeScreenShareHandler,
    }
    sendBack({
      type: 'set_unsubscribe_all',
      unsubscribeAllFn: unsubscribeAll,
      observers,
      partnerAttendeeId,
    })

    meetingSession!.audioVideo.start()
    meetingSession!.audioVideo.realtimeMuteLocalAudio()
  }
)

export const isBannedFromLiveMedia = fromCallback(
  ({ sendBack }: { sendBack: (event: Events) => void }) => {
    const isBanned = store.getters['liveMedia/isBannedFromLiveMedia']
    if (isBanned) {
      sendBack({ type: 'banned' })
    } else {
      sendBack({ type: 'not_banned' })
    }
  }
)

const canKeepScreenFocus = typeof CaptureController !== 'undefined'

async function getStream(input: { meetingSession: DefaultMeetingSession }) {
  /*
    Chrome and Edge browsers support the CaptureController API, which allows us to keep the screen
    in focus (rather than jumping to the shared window) when starting a screen share.
  */
  if (canKeepScreenFocus) {
    const controller = new CaptureController()
    controller.setFocusBehavior('no-focus-change')
    const contentShareStream = await navigator.mediaDevices.getDisplayMedia({
      controller,
    })

    await input.meetingSession.audioVideo.startContentShare(contentShareStream)
  } else {
    await input.meetingSession.audioVideo.startContentShareFromScreenCapture()
  }
}

async function startSessionRecording(sessionId: string) {
  await NetworkService.startSessionRecording(sessionId)
}

async function unsubscribeAll(
  context: Partial<Context>,
  observers: {
    transcriptionObserver: (event: any) => void
    partnerAddedObserver: (
      attendeeId: string,
      _present: boolean,
      externalUserId?: string
    ) => void
    meetingStartedObserver: { eventDidReceive(name: EventName): void }
    activeSpeakerCallback: (speakerIds: string[]) => void
    unsubscribeScreenShareHandler: () => void
  },
  partnerAttendeeId: string | null
): Promise<void> {
  // A function that takes context as input and does all the unsubscribe work.
  context.meetingSession!.audioVideo.transcriptionController?.unsubscribeFromTranscriptEvent(
    observers.transcriptionObserver
  )
  context.meetingSession!.audioVideo.realtimeUnsubscribeToAttendeeIdPresence(
    observers.partnerAddedObserver
  )
  context.meetingSession!.eventController!.removeObserver(
    observers.meetingStartedObserver
  )
  context.meetingSession!.audioVideo.unbindAudioElement()
  context.meetingSession!.audioVideo.realtimeUnsubscribeFromVolumeIndicator(
    partnerAttendeeId ?? ''
  )
  context.meetingSession!.audioVideo.unsubscribeFromActiveSpeakerDetector(
    observers.activeSpeakerCallback
  )
  observers.unsubscribeScreenShareHandler()
  context.endScreenShareModeration!()
  context.meetingSession!.audioVideo.stop()
  await context.meetingSession!.audioVideo.stopContentShare()
  await context.meetingSession!.audioVideo.stopAudioInput()

  store.dispatch('liveMedia/reset')
}

export const startingShareMyScreen = fromPromise(
  async ({
    input,
  }: {
    input: {
      sessionId: string
      videoOutputElement: HTMLVideoElement
      sessionRecordingStarted: boolean
      meetingSession: DefaultMeetingSession
    }
  }) => {
    if (!input.sessionRecordingStarted) {
      await startSessionRecording(input.sessionId)
    }
    const { beginScreenShareModeration, endScreenShareModeration } =
      moderateScreenShare()
    beginScreenShareModeration(input.videoOutputElement)
    await getStream({ meetingSession: input.meetingSession })
    return { endScreenShareModeration }
  }
)

const _stopMic = async ({ input }: { input: { context: Context } }) => {
  await input.context.meetingSession!.audioVideo.stopAudioInput()
}

const _stopShareMyScreen = async ({
  input,
}: {
  input: { context: Context }
}) => {
  if (input.context.isSharingMyScreen) {
    await input.context.meetingSession!.audioVideo.stopContentShare()
    input.context.endScreenShareModeration()
  }
}

export const stopShareMyScreen = fromPromise(_stopShareMyScreen)

export const stopShareMyScreenAndMic = fromPromise(
  async ({ input }: { input: { context: Context } }) => {
    await _stopShareMyScreen({ input })
    await _stopMic({ input })
  }
)

export const maybeStartTranscription = fromPromise(
  async ({
    input: { transcriptionStarted, sessionId, sessionRecordingStarted, parent },
  }: {
    input: {
      transcriptionStarted: boolean
      sessionId: string
      sessionRecordingStarted: boolean

      parent: { send: (event: Events) => void }
    }
  }) => {
    if (!transcriptionStarted) {
      parent.send({
        type: 'transcription_status_changed',
        status: 'started',
      })

      await NetworkService.startSessionMeetingTranscription(sessionId)
    }

    if (!sessionRecordingStarted) {
      await startSessionRecording(sessionId)
    }
  }
)

export const requestMicAccess = fromPromise(
  async ({
    input: { meetingSession },
  }: {
    input: {
      meetingSession: DefaultMeetingSession
    }
  }) => {
    meetingSession.audioVideo.setDeviceLabelTrigger(
      async () =>
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        })
    )

    const audioInputDevices =
      await meetingSession.audioVideo.listAudioInputDevices()

    if (!audioInputDevices) {
      throw new Error('No audio input devices available')
    }

    await meetingSession.audioVideo.startAudioInput(audioInputDevices[0])
  }
)

export const requestSpeakerAccess = fromPromise(
  async ({
    input: { meetingSession, audioOutputElement },
  }: {
    input: {
      meetingSession: DefaultMeetingSession
      audioOutputElement: HTMLAudioElement
    }
  }) => {
    await meetingSession.audioVideo.bindAudioElement(audioOutputElement)
    // Start in listen-only mode
    // See https://aws.github.io/amazon-chime-sdk-js/modules/apioverview.html#implement-a-view-onlyobserverspectator-experience
    meetingSession.audioVideo.setDeviceLabelTrigger(() =>
      Promise.resolve(new MediaStream())
    )
    await meetingSession.audioVideo.listAudioInputDevices()
    meetingSession.audioVideo.start()
  }
)
