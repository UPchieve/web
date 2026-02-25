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
  endScreenShareModeration: noop,
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
  })
}

// async function joinMeetingWithLiveMediaAccess(machine) {
//   passInitialLoading(machine)
//   await new Promise((resolve) => setTimeout(resolve, 10))
//   machine.send({
//     type: 'meeting_started',
//   })
// }

describe('MeetingMachine', () => {
  beforeEach(() => {
    isBanned = false
  })

  it('Initializing control elements', async () => {
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
      mockMachine.getSnapshot().context.sessionId,
      'We should have the correct sessionId'
    ).toBe('mock-session-id')

    expect(
      mockMachine.getSnapshot().matches('LiveMedia.ScreenShareControl.Idle'),
      'We should be in the screen share control idle state'
    ).toBe(true)

    expect(
      mockMachine.getSnapshot().matches('LiveMedia.MicControl.Waiting'),
      'We should be in the mic control idle state'
    ).toBe(true)

    expect(
      mockMachine.getSnapshot().matches('LiveMedia.SpeakerControl.Waiting'),
      'We should be in the speaker control idle state'
    ).toBe(true)
  })

  // it('UnMute Mic', async () => {
  //   const machine = MeetingMachine.create()
  //   const mockMachine = createActor(machine.provide({ actors: defaultActors }))

  //   expect(mockMachine).toBeDefined()

  //   mockMachine.start()

  //   expect(
  //     mockMachine.getSnapshot().matches('FetchingState'),
  //     'We should be in the fetching state'
  //   ).toBe(true)

  //   passInitialLoading(mockMachine)

  //   expect(
  //     mockMachine.getSnapshot().context.sessionId,
  //     'We should have the correct sessionId'
  //   ).toBe('mock-session-id')

  //   /* unmute mic */
  //   mockMachine.send({ type: 'toggle_mute_self' })
  //   expect(
  //     mockMachine.getSnapshot().matches('LiveMedia.MicControl.FetchMediaRoom'),
  //     'We should be in the mic control requesting mic access state'
  //   ).toBe(true)
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine.getSnapshot().matches('LiveMedia.MicControl.MicUnmuted'),
  //     'We should be in the mic control mic unmuted state'
  //   ).toBe(true)
  //   mockMachine.send({ type: 'toggle_mute_self' })
  //   expect(
  //     mockMachine.getSnapshot().matches('LiveMedia.MicControl.MicMuted'),
  //     'We should be in the mic control mic muted state'
  //   ).toBe(true)
  // })

  // it('follows the happy path', async () => {
  //   const machine = MeetingMachine.create()
  //   const mockMachine = createActor(machine.provide({ actors: defaultActors }))

  //   expect(mockMachine).toBeDefined()

  //   mockMachine.start()
  //   expect(
  //     mockMachine.getSnapshot().matches('FetchingState'),
  //     'We should be in the fetching state'
  //   ).toBe(true)
  //   passInitialLoading(mockMachine)
  //   expect(
  //     mockMachine.getSnapshot().matches('FetchingChimeMeeting.Loading'),
  //     'We should be in the loading state'
  //   ).toBe(true)
  //   expect(
  //     mockMachine.getSnapshot().context.sessionId,
  //     'We should have the correct sessionId'
  //   ).toBe('mock-session-id')
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine.getSnapshot().matches('JoiningMeeting'),
  //     'We should be in the joining meeting state'
  //   ).toBe(true)
  //   mockMachine.send({
  //     type: 'meeting_started',
  //   })

  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.Idle'),
  //     'We should be in the screen share control idle state'
  //   ).toBe(true)
  //   expect(
  //     mockMachine.getSnapshot().matches('JoinedMeeting.MicControl.Waiting'),
  //     'We should be in the mic control waiting state'
  //   ).toBe(true)
  //   expect(
  //     mockMachine.getSnapshot().matches('JoinedMeeting.SpeakerControl.Waiting'),
  //     'We should be in the speaker control waiting state'
  //   ).toBe(true)

  //   /* partner shared screen */
  //   mockMachine.send({
  //     type: 'partner_shared_screen',
  //   })
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.ViewingPartnerScreenShare'),
  //     'We should be in the screen share control viewing partner screen share state'
  //   ).toBe(true)
  //   mockMachine.send({
  //     type: 'partner_stopped_sharing_screen',
  //   })
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.Idle'),
  //     'We should be back in the screen share control idle state'
  //   ).toBe(true)

  //   /* i share my screen */
  //   mockMachine.send({
  //     type: 'share_screen',
  //   })
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.StartingShareMyScreen'),
  //     'We should be in the screen share control starting share my screen state'
  //   ).toBe(true)
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.SharingMyScreen'),
  //     'We should be in the screen share control sharing my screen state'
  //   ).toBe(true)
  //   mockMachine.send({
  //     type: 'stop_share_screen',
  //   })
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.StoppingShareMyScreen'),
  //     'We should be in the screen share control stopping share my screen state'
  //   ).toBe(true)
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.Idle'),
  //     'We should be back in the screen share control idle state'
  //   ).toBe(true)

  //   /* unmute mic */
  //   mockMachine.send({ type: 'toggle_mute_self' })
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.MicControl.RequestingMicAccess'),
  //     'We should be in the mic control requesting mic access state'
  //   ).toBe(true)
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine.getSnapshot().matches('JoinedMeeting.MicControl.MicUnmuted'),
  //     'We should be in the mic control mic unmuted state'
  //   ).toBe(true)
  //   mockMachine.send({ type: 'toggle_mute_self' })
  //   expect(
  //     mockMachine.getSnapshot().matches('JoinedMeeting.MicControl.MicMuted'),
  //     'We should be in the mic control mic muted state'
  //   ).toBe(true)

  //   /* unmute partner */
  //   mockMachine.send({ type: 'toggle_mute_partner' })
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.SpeakerControl.RequestSpeakerAccess'),
  //     'We should be in the speaker control request speaker access state'
  //   ).toBe(true)
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.SpeakerControl.SpeakerUnmuted'),
  //     'We should be in the speaker control speaker unmuted state'
  //   ).toBe(true)
  //   mockMachine.send({ type: 'toggle_mute_partner' })
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.SpeakerControl.SpeakerMuted'),
  //     'We should be in the speaker control speaker muted state'
  //   ).toBe(true)

  //   /* meeting ended */
  //   mockMachine.send({ type: 'meeting_ended' })
  //   expect(
  //     mockMachine.getSnapshot().matches('Ended'),
  //     'The meeting should be ended'
  //   ).toBe(true)
  // })

  // it('is banned from live media', async () => {
  //   const machine = MeetingMachine.create()
  //   isBanned = true
  //   const mockMachine = createActor(
  //     machine.provide({
  //       actors: defaultActors,
  //     })
  //   )

  //   expect(mockMachine).toBeDefined()

  //   mockMachine.start()
  //   await joinMeetingWithLiveMediaAccess(mockMachine)
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.ViewingEligibleOnly'),
  //     'We should be in the screen share control banned state'
  //   ).toBe(true)
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.MicControl.ViewingEligibleOnly'),
  //     'We should be in the mic control banned state'
  //   ).toBe(true)
  // })

  // it('is banned from live media while sharing and speaking', async () => {
  //   const machine = MeetingMachine.create()
  //   const mockMachine = createActor(machine.provide({ actors: defaultActors }))

  //   expect(mockMachine).toBeDefined()

  //   mockMachine.start()
  //   await joinMeetingWithLiveMediaAccess(mockMachine)

  //   /* unmute mic */
  //   mockMachine.send({ type: 'toggle_mute_self' })
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.MicControl.RequestingMicAccess'),
  //     'We should be in the mic control requesting mic access state'
  //   ).toBe(true)
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine.getSnapshot().matches('JoinedMeeting.MicControl.MicUnmuted'),
  //     'We should be in the mic control mic unmuted state'
  //   ).toBe(true)

  //   /* unmute partner */
  //   mockMachine.send({ type: 'toggle_mute_partner' })
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.SpeakerControl.RequestSpeakerAccess'),
  //     'We should be in the speaker control request speaker access state'
  //   ).toBe(true)
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.SpeakerControl.SpeakerUnmuted'),
  //     'We should be in the speaker control speaker unmuted state'
  //   ).toBe(true)

  //   /* i share my screen */
  //   mockMachine.send({
  //     type: 'share_screen',
  //   })
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.StartingShareMyScreen'),
  //     'We should be in the screen share control starting share my screen state'
  //   ).toBe(true)
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.SharingMyScreen'),
  //     'We should be in the screen share control sharing my screen state'
  //   ).toBe(true)

  //   /* become banned */
  //   isBanned = true
  //   mockMachine.send({ type: 'ban_user_from_live_media' })

  //   expect(
  //     mockMachine.getSnapshot().matches('ViewingEligibleOnly'),
  //     'We should be in the banned state'
  //   ).toBe(true)
  //   await new Promise((resolve) => setTimeout(resolve, 10))

  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.MicControl.ViewingEligibleOnly'),
  //     'We should be in the mic control banned state after being banned'
  //   ).toBe(true)
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.SpeakerControl.SpeakerUnmuted'),
  //     'We should be in same speaker state as we were before being banned'
  //   ).toBe(true)
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.ViewingEligibleOnly'),
  //     'We should be in the screen share control banned state after being banned'
  //   ).toBe(true)

  //   mockMachine.send({ type: 'toggle_mute_self' })
  //   mockMachine.send({ type: 'share_screen' })
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.MicControl.ViewingEligibleOnly'),
  //     'Transitions to unmuted should be ignored when banned'
  //   ).toBe(true)
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.ViewingEligibleOnly'),
  //     'Transitions to screensharing should be ignored when banned'
  //   ).toBe(true)
  // })

  // it('takes the user out of mic-on and screenshare-on states when the stop_stream event is received', async () => {
  //   const machine = MeetingMachine.create()
  //   const mockMachine = createActor(
  //     machine.provide({
  //       actors: defaultActors,
  //     })
  //   )

  //   expect(mockMachine).toBeDefined()

  //   mockMachine.start()
  //   await joinMeetingWithLiveMediaAccess(mockMachine)
  //   // Unmute mic
  //   mockMachine.send({ type: 'toggle_mute_self' })
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.MicControl.RequestingMicAccess'),
  //     'We should be in the mic control requesting mic access state'
  //   ).toBe(true)
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine.getSnapshot().matches('JoinedMeeting.MicControl.MicUnmuted'),
  //     'We should be in the mic control mic unmuted state'
  //   ).toBe(true)

  //   // Start sharing screen
  //   mockMachine.send({
  //     type: 'share_screen',
  //   })
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.StartingShareMyScreen'),
  //     'We should be in the screen share control starting share my screen state'
  //   ).toBe(true)
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.SharingMyScreen'),
  //     'We should be in the screen share control sharing my screen state'
  //   ).toBe(true)

  //   // Now stop the stream (should cut screenshare AND mic)
  //   mockMachine.send({ type: 'stop_stream' })
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(mockMachine.getSnapshot())
  //   expect(
  //     mockMachine.getSnapshot().matches('JoinedMeeting.MicControl.Waiting'),
  //     'We should return to the Waiting state for microphone controls'
  //   ).toBe(true)
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.Idle'),
  //     'We should return to the Idle state for screenshare controls'
  //   ).toBe(true)

  //   // Assuming not banned, can return to mic-on and screenshare-on states
  //   // Unmute mic
  //   mockMachine.send({ type: 'toggle_mute_self' })
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.MicControl.RequestingMicAccess'),
  //     'We should be in the mic control requesting mic access state'
  //   ).toBe(true)
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine.getSnapshot().matches('JoinedMeeting.MicControl.MicUnmuted'),
  //     'We should be in the mic control mic unmuted state'
  //   ).toBe(true)

  //   // Start sharing screen
  //   mockMachine.send({
  //     type: 'share_screen',
  //   })
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.StartingShareMyScreen'),
  //     'We should be in the screen share control starting share my screen state'
  //   ).toBe(true)
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.SharingMyScreen'),
  //     'We should be in the screen share control sharing my screen state'
  //   ).toBe(true)
  // })

  // it('Ends continuous screenshare moderation when screenshare ends', async () => {
  //   const mockEndScreenShareModeration = vi.fn()
  //   const machine = MeetingMachine.create()
  //   const startingShareMyScreen = fromPromise(() => ({
  //     endScreenShareModeration: mockEndScreenShareModeration,
  //   }))
  //   const stopShareMyScreen = fromPromise(async (input) => {
  //     await input.context.endScreenShareModeration()
  //   })
  //   const mockMachine = createActor(
  //     machine.provide({
  //       actors: {
  //         ...defaultActors,
  //         startingShareMyScreen,
  //         stopShareMyScreen,
  //       },
  //     })
  //   )
  //   expect(mockMachine).toBeDefined()

  //   mockMachine.start()
  //   await joinMeetingWithLiveMediaAccess(mockMachine)
  //   expect(
  //     mockMachine.getSnapshot().context.endScreenShareModeration()
  //   ).toEqual(undefined) // default value for endScreenShareModeration is () => void

  //   // Start sharing screen
  //   mockMachine.send({
  //     type: 'share_screen',
  //   })
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.StartingShareMyScreen'),
  //     'We should be in the screen share control starting share my screen state'
  //   ).toBe(true)
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.SharingMyScreen'),
  //     'We should be in the screen share control sharing my screen state'
  //   ).toBe(true)
  //   // Confirm the updated value for endScreenShareModeration stored in context
  //   expect(mockMachine.getSnapshot().context.endScreenShareModeration).toEqual(
  //     mockEndScreenShareModeration
  //   )

  //   // Stop sharing screen
  //   mockMachine.send({ type: 'stop_share_screen' })

  //   // Confirm the new value of endScreenShareModeration is called.
  //   expect(
  //     mockMachine
  //       .getSnapshot()
  //       .matches('JoinedMeeting.ScreenShareControl.StoppingShareMyScreen')
  //   )
  //   await new Promise((resolve) => setTimeout(resolve, 10))
  //   expect(
  //     mockMachine.getSnapshot().matches('JoinedMeeting.ScreenShareControl.Idle')
  //   )

  //   // Ensure that endScreenShareModeration was called after the screenshare stops
  //   expect(mockEndScreenShareModeration).toHaveBeenCalled()
  // })

  // it('Calls unsubscribeAll when the machine is stopped', async () => {
  //   const machine = MeetingMachine.create()
  //   const mockMachine = createActor(
  //     machine.provide({
  //       actors: defaultActors,
  //     })
  //   )
  //   expect(mockMachine).toBeDefined()

  //   mockMachine.start()
  //   await joinMeetingWithLiveMediaAccess(mockMachine)
  //   const mockUnsubscribeAll = vi.fn()
  //   mockMachine.send({
  //     type: 'set_unsubscribe_all',
  //     unsubscribeAllFn: mockUnsubscribeAll,
  //     observers: {},
  //     partnerAttendeeId: '123',
  //   })
  //   expect(mockUnsubscribeAll).not.toHaveBeenCalled()
  //   mockMachine.send({ type: 'meeting_ended' })
  //   expect(mockUnsubscribeAll).toHaveBeenCalled()
  // })
})
