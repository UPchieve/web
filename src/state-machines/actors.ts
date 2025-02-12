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
    contentShareDidStart: () => {
      sendBack({ type: 'partner_shared_screen' })
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
    const { meetingSession, partnerAttendeeId, attendee } = input.context

    const partnerAddedObserver = (attendeeId: string) => {
      if (
        (partnerAttendeeId && partnerAttendeeId === attendeeId) ||
        attendee?.AttendeeId === attendeeId
      ) {
        return
      }

      sendBack({ type: 'new_partner_attendee', attendeeId })
    }

    meetingSession!.audioVideo.realtimeSubscribeToAttendeeIdPresence(
      partnerAddedObserver
    )

    const meetingStartedObserver = {
      eventDidReceive(name: EventName) {
        if (name === 'meetingStartSucceeded') {
          sendBack({ type: 'meeting_started' })
        }
        if (name === 'meetingEnded') {
          sendBack({ type: 'meeting_ended' })
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

    const unsubscribeAll = async () => {
      meetingSession!.audioVideo.realtimeUnsubscribeToAttendeeIdPresence(
        partnerAddedObserver
      )
      meetingSession!.eventController!.removeObserver(meetingStartedObserver)
      unsubscribeScreenShareHandler()

      await meetingSession!.audioVideo.stopContentShare()
      input.context.endScreenShareModeration()
      input.context.meetingSession!.audioVideo.stop()
      store.commit('liveMedia/setScreenShareActor', null)
    }
    sendBack({ type: 'set_unsubscribe_all', unsubscribeAll })
    meetingSession!.audioVideo.start()
  }
)

export const isBannedFromLiveMedia = fromPromise(async () => {
  return {
    isBanned: store.getters['liveMedia/isBannedFromLiveMedia'],
  }
})

export const startingShareMyScreen = fromPromise(
  async ({ input }: { input: { context: Context } }) => {
    const { beginScreenShareModeration, endScreenShareModeration } =
      moderateScreenShare()
    beginScreenShareModeration(input.context.videoOutputElement)
    const contentShareStream =
      await input.context.meetingSession!.audioVideo.startContentShareFromScreenCapture()
    return { contentShareStream, endScreenShareModeration }
  }
)

export const stopShareMyScreen = fromPromise(
  async ({ input }: { input: { context: Context } }) => {
    await input.context.meetingSession!.audioVideo.stopContentShare()
    input.context.endScreenShareModeration()
  }
)
