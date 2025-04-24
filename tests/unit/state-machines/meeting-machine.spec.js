import * as MeetingMachine from '@/state-machines/meeting-machine'
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

let isBanned = false
const isBannedFromLiveMedia = fromCallback(({ sendBack }) => {
  if (isBanned) {
    sendBack({ type: 'banned' })
  } else {
    sendBack({ type: 'not_banned' })
  }
})
const joinMeeting = fromCallback(noop)
const startingShareMyScreen = fromPromise(() => ({
  endScreenshareModeration: noop,
}))
export const stopShareMyScreen = fromPromise(noop)
export const stopShareMyScreenAndMic = fromPromise(noop)
export const maybeStartTranscription = fromPromise(noop)
export const requestMicAccess = fromPromise(noop)
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
    isAudioEligible: true,
    isScreenshareEligible: true,
  })
}

async function joinMeetingWithLiveMediaAccess(machine) {
  passInitialLoading(machine)
  await new Promise((resolve) => setTimeout(resolve, 10))
  machine.send({
    type: 'meeting_started',
  })
}

describe('MeetingMachine', () => {
  beforeEach(() => {
    isBanned = false
  })
  it('follows the happy path', async () => {
    const machine = MeetingMachine.create()
    const mockMachine = createActor(machine.provide({ actors: defaultActors }))

    expect(mockMachine).toBeDefined()

    mockMachine.start()
    expect(
      mockMachine.getSnapshot().matches('FetchingState'),
      'We should be in the fetching state'
    ).toBe(true)
    passInitialLoading(mockMachine)
    expect(
      mockMachine.getSnapshot().matches('FetchingChimeMeeting.Loading'),
      'We should be in the loading state'
    ).toBe(true)
    expect(
      mockMachine.getSnapshot().context.sessionId,
      'We should have the correct sessionId'
    ).toBe('mock-session-id')
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine.getSnapshot().matches('JoiningMeeting'),
      'We should be in the joining meeting state'
    ).toBe(true)
    mockMachine.send({
      type: 'meeting_started',
    })

    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.ScreenShareControl.Idle'),
      'We should be in the screen share control idle state'
    ).toBe(true)
    expect(
      mockMachine.getSnapshot().matches('JoinedMeeting.MicControl.Waiting'),
      'We should be in the mic control waiting state'
    ).toBe(true)
    expect(
      mockMachine.getSnapshot().matches('JoinedMeeting.SpeakerControl.Waiting'),
      'We should be in the speaker control waiting state'
    ).toBe(true)

    /* partner shared screen */
    mockMachine.send({
      type: 'partner_shared_screen',
    })
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.ScreenShareControl.ViewingPartnerScreenShare'),
      'We should be in the screen share control viewing partner screen share state'
    ).toBe(true)
    mockMachine.send({
      type: 'partner_stopped_sharing_screen',
    })
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.ScreenShareControl.Idle'),
      'We should be back in the screen share control idle state'
    ).toBe(true)

    /* i share my screen */
    mockMachine.send({
      type: 'share_screen',
    })
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.ScreenShareControl.StartingShareMyScreen'),
      'We should be in the screen share control starting share my screen state'
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.ScreenShareControl.SharingMyScreen'),
      'We should be in the screen share control sharing my screen state'
    ).toBe(true)
    mockMachine.send({
      type: 'stop_share_screen',
    })
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.ScreenShareControl.StoppingShareMyScreen'),
      'We should be in the screen share control stopping share my screen state'
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.ScreenShareControl.Idle'),
      'We should be back in the screen share control idle state'
    ).toBe(true)

    /* unmute mic */
    mockMachine.send({ type: 'toggle_mute_self' })
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.MicControl.RequestingMicAccess'),
      'We should be in the mic control requesting mic access state'
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine.getSnapshot().matches('JoinedMeeting.MicControl.MicUnmuted'),
      'We should be in the mic control mic unmuted state'
    ).toBe(true)
    mockMachine.send({ type: 'toggle_mute_self' })
    expect(
      mockMachine.getSnapshot().matches('JoinedMeeting.MicControl.MicMuted'),
      'We should be in the mic control mic muted state'
    ).toBe(true)

    /* unmute partner */
    mockMachine.send({ type: 'toggle_mute_partner' })
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.SpeakerControl.RequestSpeakerAccess'),
      'We should be in the speaker control request speaker access state'
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.SpeakerControl.SpeakerUnmuted'),
      'We should be in the speaker control speaker unmuted state'
    ).toBe(true)
    mockMachine.send({ type: 'toggle_mute_partner' })
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.SpeakerControl.SpeakerMuted'),
      'We should be in the speaker control speaker muted state'
    ).toBe(true)

    /* meeting ended */
    mockMachine.send({ type: 'meeting_ended' })
    expect(
      mockMachine.getSnapshot().matches('Ended'),
      'The meeting should be ended'
    ).toBe(true)
  })

  it('is not eligible for live media', () => {
    const machine = MeetingMachine.create()
    const mockMachine = createActor(machine.provide({ actors: defaultActors }))

    expect(mockMachine).toBeDefined()

    mockMachine.start()
    expect(
      mockMachine.getSnapshot().matches('FetchingState'),
      'We should be in the fetching state'
    ).toBe(true)
    mockMachine.send({
      type: 'audio_ui_loaded',
      audioOutputElement: {},
    })
    mockMachine.send({
      type: 'video_ui_loaded',
      videoOutputElement: {},
    })
    mockMachine.send({
      type: 'set_session_id',
      sessionId: 'mock-session-id',
    })

    mockMachine.send({
      type: 'session_started',
      isAudioEligible: false,
      isScreenshareEligible: false,
    })

    expect(
      mockMachine.getSnapshot().matches('IneligibleForLiveMedia'),
      'We should be in the ineligible for live media state'
    ).toBe(true)
  })

  it('is eligible for voice but not screenshare', async () => {
    const machine = MeetingMachine.create()
    const mockMachine = createActor(machine.provide({ actors: defaultActors }))

    expect(mockMachine).toBeDefined()

    mockMachine.start()
    mockMachine.send({
      type: 'audio_ui_loaded',
      audioOutputElement: {},
    })
    mockMachine.send({
      type: 'video_ui_loaded',
      videoOutputElement: {},
    })
    mockMachine.send({
      type: 'set_session_id',
      sessionId: 'mock-session-id',
    })

    mockMachine.send({
      type: 'session_started',
      isAudioEligible: true,
      isScreenshareEligible: false,
    })
    await new Promise((resolve) => setTimeout(resolve, 10))
    mockMachine.send({
      type: 'meeting_started',
    })
    expect(
      mockMachine.getSnapshot().matches('JoinedMeeting'),
      'We have joined the meeting'
    ).toBe(true)

    mockMachine.send({
      type: 'share_screen',
    })
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.ScreenShareControl.Idle'),
      'We should stay in idle state if screenshare is not eligible'
    ).toBe(true)
    expect(
      mockMachine.getSnapshot().context.isScreenshareEligible,
      'Our context should have `isScreenshareEligible === false`'
    ).toBe(false)
  })

  it('is banned from live media', async () => {
    const machine = MeetingMachine.create()
    isBanned = true
    const mockMachine = createActor(
      machine.provide({
        actors: defaultActors,
      })
    )

    expect(mockMachine).toBeDefined()

    mockMachine.start()
    await joinMeetingWithLiveMediaAccess(mockMachine)

    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.ScreenShareControl.Banned'),
      'We should be in the screen share control banned state'
    ).toBe(true)
    expect(
      mockMachine.getSnapshot().matches('JoinedMeeting.MicControl.Banned'),
      'We should be in the mic control banned state'
    ).toBe(true)
  })

  it('is banned from live media while sharing and speaking', async () => {
    const machine = MeetingMachine.create()
    const mockMachine = createActor(machine.provide({ actors: defaultActors }))

    expect(mockMachine).toBeDefined()

    mockMachine.start()
    await joinMeetingWithLiveMediaAccess(mockMachine)

    /* unmute mic */
    mockMachine.send({ type: 'toggle_mute_self' })
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.MicControl.RequestingMicAccess'),
      'We should be in the mic control requesting mic access state'
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine.getSnapshot().matches('JoinedMeeting.MicControl.MicUnmuted'),
      'We should be in the mic control mic unmuted state'
    ).toBe(true)

    /* unmute partner */
    mockMachine.send({ type: 'toggle_mute_partner' })
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.SpeakerControl.RequestSpeakerAccess'),
      'We should be in the speaker control request speaker access state'
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.SpeakerControl.SpeakerUnmuted'),
      'We should be in the speaker control speaker unmuted state'
    ).toBe(true)

    /* i share my screen */
    mockMachine.send({
      type: 'share_screen',
    })
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.ScreenShareControl.StartingShareMyScreen'),
      'We should be in the screen share control starting share my screen state'
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.ScreenShareControl.SharingMyScreen'),
      'We should be in the screen share control sharing my screen state'
    ).toBe(true)

    /* become banned */
    isBanned = true
    mockMachine.send({ type: 'ban_user_from_live_media' })

    expect(
      mockMachine.getSnapshot().matches('Banned'),
      'We should be in the banned state'
    ).toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(
      mockMachine.getSnapshot().matches('JoinedMeeting.MicControl.Banned'),
      'We should be in the mic control banned state after being banned'
    ).toBe(true)
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.SpeakerControl.SpeakerUnmuted'),
      'We should be in same speaker state as we were before being banned'
    ).toBe(true)
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.ScreenShareControl.Banned'),
      'We should be in the screen share control banned state after being banned'
    ).toBe(true)

    mockMachine.send({ type: 'toggle_mute_self' })
    mockMachine.send({ type: 'share_screen' })
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(
      mockMachine.getSnapshot().matches('JoinedMeeting.MicControl.Banned'),
      'Transitions to unmuted should be ignored when banned'
    ).toBe(true)
    expect(
      mockMachine
        .getSnapshot()
        .matches('JoinedMeeting.ScreenShareControl.Banned'),
      'Transitions to screensharing should be ignored when banned'
    ).toBe(true)
  })
})
