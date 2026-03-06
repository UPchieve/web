import { socket } from '@/socket'
import * as MeetingMachine from '@/state-machines/meeting-machine'
import { expect, vi } from 'vitest'
import { createActor, fromCallback, fromPromise } from 'xstate'

const noop = () => {}
const fetchChimeMeeting = fromPromise(async ({ input }) => {
  return Promise.resolve({
    meeting: { MeetingId: input.sessionId },
    attendee: { AttendeeId: 'mock-attendee-id' },
    partnerAttendee: { AttendeeId: 'mock-partner-attendee-id' },
  })
})

const createMeetingSession = fromPromise(async ({ input }) => {
  const meetingSession = {
    sessionId: input.sessionId,
    userId: input.userId,
    partnerUserId: input.partnerUserId,
    audioVideo: {
      realtimeUnmuteLocalAudio: () => Promise.resolve(),
      realtimeMuteLocalAudio: () => Promise.resolve(),
    },
  }
  return { meetingSession }
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const requestMicAccess = fromPromise(async ({ input }) => {
  return { micAudioStream: {} }
})

let isBanned = false
let mockMachine = null
const isBannedFromLiveMedia = fromCallback(({ sendBack }) => {
  if (isBanned) {
    sendBack({ type: 'banned' })
  } else {
    sendBack({ type: 'not_banned' })
  }
})

const joinMeeting = fromCallback(noop)
const startingShareMyScreen = fromPromise(() => ({
  endScreenShareModeration: noop,
}))
export const stopShareMyScreen = fromPromise(noop)
export const stopShareMyScreenAndMic = fromPromise(noop)
export const maybeStartTranscription = fromPromise(noop)
export const requestSpeakerAccess = fromPromise(noop)

const defaultActors = {
  fetchChimeMeeting,
  createMeetingSession,
  joinMeeting,
  isBannedFromLiveMedia,
  startingShareMyScreen,
  stopShareMyScreen,
  stopShareMyScreenAndMic,
  requestMicAccess,
  requestSpeakerAccess,
  maybeStartTranscription,
}

function passInitialLoading(machine) {
  machine.send({
    type: 'audio_ui_loaded',
    audioOutputElement: {},
  })
  machine.send({
    type: 'video_ui_loaded',
    videoOutputElement: {},
  })
  machine.send({
    type: 'set_session_id',
    sessionId: 'mock-session-id',
  })

  machine.send({
    type: 'session_started',
  })
}

async function initalizeMeetingMachine() {
  const machine = MeetingMachine.create()
  const mockMachine = createActor(machine.provide({ actors: defaultActors }))

  expect(mockMachine).toBeDefined()

  mockMachine.start()

  expect(
    mockMachine.getSnapshot().matches('Initializing'),
    'We should be in the fetching state'
  ).toBe(true)

  passInitialLoading(mockMachine)

  expect(
    mockMachine.getSnapshot().context.sessionId,
    'We should have the correct sessionId'
  ).toBe('mock-session-id')

  return mockMachine
}

describe('MeetingMachine', () => {
  beforeEach(async () => {
    mockMachine = await initalizeMeetingMachine()
  })

  it('Initializing control elements', async () => {
    expect(
      mockMachine.getSnapshot().matches('Active.ScreenShareControl.Idle')
    ).toBe(true)

    expect(mockMachine.getSnapshot().matches('Active.MicControl.Waiting')).toBe(
      true
    )

    expect(
      mockMachine.getSnapshot().matches('Active.SpeakerControl.Waiting')
    ).toBe(true)
  })

  it('Happy Path Mic Control', async () => {
    mockMachine.send({ type: 'toggle_mute_self' })
    expect(
      mockMachine.getSnapshot().matches('Active.MicControl.FetchMediaRoom')
    ).toBe(true)

    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine.getSnapshot().matches('Active.MediaRouter.JoiningMeeting')
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))
    mockMachine.send({ type: 'meeting_started' })
    expect(
      mockMachine.getSnapshot().matches('Active.MicControl.RequestingMicAccess')
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(
      mockMachine.getSnapshot().matches('Active.MicControl.MicUnmuted')
    ).toBe(true)
    mockMachine.send({ type: 'toggle_mute_self' })
    expect(
      mockMachine.getSnapshot().matches('Active.MicControl.MicMuted')
    ).toBe(true)
  })

  it('Happy Path Screenshare Control', async () => {
    const socketEmitSpy = vi.spyOn(socket, 'emit')

    mockMachine.send({ type: 'share_screen' })

    expect(
      mockMachine
        .getSnapshot()
        .matches('Active.ScreenShareControl.FetchMediaRoom')
    ).toBe(true)

    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine.getSnapshot().matches('Active.MediaRouter.JoiningMeeting')
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))
    mockMachine.send({ type: 'meeting_started' })
    expect(
      mockMachine
        .getSnapshot()
        .matches('Active.ScreenShareControl.StartingShareMyScreen')
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(socketEmitSpy).toBeCalledWith('joinedLiveMedia', {
      sessionId: mockMachine.getSnapshot().context.sessionId,
    })
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine
        .getSnapshot()
        .matches('Active.ScreenShareControl.SharingMyScreen')
    ).toBe(true)

    mockMachine.send({ type: 'stop_share_screen' })
    expect(
      mockMachine
        .getSnapshot()
        .matches('Active.ScreenShareControl.StoppingShareMyScreen')
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine.getSnapshot().matches('Active.ScreenShareControl.Idle')
    ).toBe(true)
  })

  it('Happy Path Speaker Control', async () => {
    expect(
      mockMachine.getSnapshot().matches('Active.SpeakerControl.Waiting')
    ).toBe(true)
    mockMachine.send({ type: 'toggle_mute_partner' })
    expect(
      mockMachine.getSnapshot().matches('Active.SpeakerControl.FetchMediaRoom')
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine.getSnapshot().matches('Active.MediaRouter.JoiningMeeting')
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))
    mockMachine.send({ type: 'meeting_started' })
    expect(
      mockMachine
        .getSnapshot()
        .matches('Active.SpeakerControl.RequestSpeakerAccess')
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine.getSnapshot().matches('Active.SpeakerControl.SpeakerUnmuted')
    ).toBe(true)
    mockMachine.send({ type: 'toggle_mute_partner' })
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine.getSnapshot().matches('Active.SpeakerControl.SpeakerMuted')
    ).toBe(true)
  })

  it('Calls unsubscribeAll when the machine is stopped', async () => {
    const mockUnsubscribeAll = vi.fn()
    mockMachine.send({
      type: 'set_unsubscribe_all',
      unsubscribeAllFn: mockUnsubscribeAll,
      observers: {},
      partnerAttendeeId: '123',
    })
    expect(mockUnsubscribeAll).not.toHaveBeenCalled()
    mockMachine.send({ type: 'meeting_ended' })
    expect(mockUnsubscribeAll).toHaveBeenCalled()
  })

  describe('LiveMedia Ban & Moderation Scenarios', () => {
    it('Joins session as LiveMedia banned', async () => {
      isBanned = true
      mockMachine = await initalizeMeetingMachine()
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(
        mockMachine.getSnapshot().matches('Active.ScreenShareControl.ViewOnly')
      ).toBe(true)
      expect(
        mockMachine.getSnapshot().matches('Active.MicControl.ViewOnly')
      ).toBe(true)
    })

    it('Stop MicControl after moderation infraction', async () => {
      isBanned = false
      mockMachine = await initalizeMeetingMachine()

      mockMachine.send({ type: 'toggle_mute_self' })

      await new Promise((resolve) => setTimeout(resolve, 10))

      mockMachine.send({ type: 'meeting_started' })

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(
        mockMachine.getSnapshot().matches('Active.MicControl.MicUnmuted'),
        'We should be in the mic control mic unmuted state'
      ).toBe(true)

      mockMachine.send({ type: 'stop_stream' })

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(
        mockMachine.getSnapshot().matches('Active.MicControl.Waiting')
      ).toBe(true)
      expect(
        mockMachine.getSnapshot().matches('Active.ScreenShareControl.Idle')
      ).toBe(true)
    })

    it('Stop ScreenShareControl after moderation infraction', async () => {
      isBanned = false
      mockMachine = await initalizeMeetingMachine()

      mockMachine.send({ type: 'share_screen' })

      await new Promise((resolve) => setTimeout(resolve, 10))

      mockMachine.send({ type: 'meeting_started' })

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(
        mockMachine
          .getSnapshot()
          .matches('Active.ScreenShareControl.SharingMyScreen')
      ).toBe(true)

      mockMachine.send({ type: 'stop_stream' })

      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(
        mockMachine.getSnapshot().matches('Active.ScreenShareControl.Idle')
      ).toBe(true)
      expect(
        mockMachine.getSnapshot().matches('Active.MicControl.Waiting')
      ).toBe(true)
    })

    it('LiveMedia ban user while their speaking with MicControl', async () => {
      isBanned = false
      mockMachine = await initalizeMeetingMachine()

      mockMachine.send({ type: 'toggle_mute_self' })

      await new Promise((resolve) => setTimeout(resolve, 10))

      mockMachine.send({ type: 'meeting_started' })

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(
        mockMachine.getSnapshot().matches('Active.MicControl.MicUnmuted')
      ).toBe(true)
      isBanned = true
      mockMachine.send({ type: 'ban_user_from_live_media' })
      expect(mockMachine.getSnapshot().matches('ViewOnly')).toBe(true)
      await new Promise((resolve) => setTimeout(resolve, 10))
      //Microphone and Screenshare should be blocked
      expect(
        mockMachine.getSnapshot().matches('Active.MicControl.ViewOnly')
      ).toBe(true)
      expect(
        mockMachine.getSnapshot().matches('Active.ScreenShareControl.ViewOnly'),
        'We should be in the mic control banned state after being banned'
      ).toBe(true)
    })

    it('LiveMedia ban user while their screensharing with ScreenShareControl', async () => {
      isBanned = false
      mockMachine = await initalizeMeetingMachine()

      mockMachine.send({ type: 'share_screen' })

      await new Promise((resolve) => setTimeout(resolve, 10))

      mockMachine.send({ type: 'meeting_started' })

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(
        mockMachine
          .getSnapshot()
          .matches('Active.ScreenShareControl.SharingMyScreen')
      ).toBe(true)
      isBanned = true
      mockMachine.send({ type: 'ban_user_from_live_media' })
      expect(mockMachine.getSnapshot().matches('ViewOnly')).toBe(true)
      await new Promise((resolve) => setTimeout(resolve, 10))
      //Microphone and Screenshare should be blocked
      expect(
        mockMachine.getSnapshot().matches('Active.ScreenShareControl.ViewOnly')
      ).toBe(true)
      expect(
        mockMachine.getSnapshot().matches('Active.MicControl.ViewOnly')
      ).toBe(true)
    })
  })
})
