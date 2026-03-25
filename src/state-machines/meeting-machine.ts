import { DefaultMeetingSession } from 'amazon-chime-sdk-js'
import { assign, setup, raise } from 'xstate'
import {
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
} from './actors'
import store from '@/store'
import LoggerService from '@/services/LoggerService'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import { socket } from '@/socket'

const MAX_RETRY_COUNT = 3
const BASE_RETRY_DELAY = 1000
const RETRY_DELAY_MULTIPLIER = 2

type Meeting = {
  MeetingId: string
}

export type Attendee = {
  AttendeeId: string
  ExternalUserId?: string
}

export type Context = {
  audioOutputElement: HTMLAudioElement | null
  videoOutputElement: HTMLVideoElement | null
  retryCount: number
  maxRetries: number
  sessionId: string | null
  meeting: Meeting | null
  attendee: Attendee | null
  partnerAttendeeId: string | null
  meetingSession: DefaultMeetingSession | null
  showPartnerScreenShare: boolean
  isSharingMyScreen: boolean
  endScreenShareModeration: () => void
  isPartnerMicMuted: boolean
  activeSpeakerIds: string[]
  isPartnerSpeaking: boolean
  hasReceivedPartnerAudio: boolean // We use this to determine if we know the partner's mic status or not.
  transcriptionStarted: boolean
  screenShareWidth: number | undefined
  screenShareHeight: number | undefined
  sessionRecordingStarted: boolean
  isMeetingJoined: boolean
}

export type Events =
  | { type: 'audio_ui_loaded'; audioOutputElement: HTMLAudioElement }
  | { type: 'video_ui_loaded'; videoOutputElement: HTMLVideoElement }
  | { type: 'meeting_started' }
  | { type: 'new_partner_attendee'; partnerAttendeeId: string }
  | {
      type: 'set_unsubscribe_all'
      unsubscribeAllFn: (
        context: Partial<Context>,
        observers: any,
        partnerAttendeeId: string | null
      ) => Promise<void>
      observers: any
      partnerAttendeeId: string | null
    }
  | { type: 'set_session_id'; sessionId: string }
  | { type: 'partner_shared_screen' }
  | { type: 'partner_stopped_sharing_screen' }
  | { type: 'meeting_ended' }
  | { type: 'share_screen' }
  | { type: 'stop_share_screen' }
  | { type: 'toggle_mute_self' }
  | { type: 'toggle_mute_partner' }
  | { type: 'active_speakers_changed'; speakerIds: string[] }
  | { type: 'partner_mute_change'; muted: boolean }
  | { type: 'received_partner_audio_info' }
  | {
      type: 'session_started'
    }
  | { type: 'ban_user_from_live_media' }
  | { type: 'transcription_not_started' }
  | { type: 'transcription_started' }
  | { type: 'set_screen_share_dimensions'; width: number; height: number }
  | { type: 'banned' }
  | { type: 'not_banned' }
  | { type: 'transcription_status_changed'; status: 'started' | 'stopped' }
  | { type: 'stop_stream' }
  | { type: 'media_room_is_ready' }
  | { type: 'fetch_media_room' }
export function create() {
  return setup({
    types: {
      tags: {} as
        | 'loadingScreenShare'
        | 'error'
        | 'loadingAudioCall'
        | 'unableToJoinMediaRoom'
        | 'unableToJoinAudio'
        | 'loadingSpeakerControl',

      context: {} as Context,
      events: {} as Events,
      input: {} as { sessionId: string },
    },
    delays: {
      timeout: ({ context }) =>
        BASE_RETRY_DELAY * RETRY_DELAY_MULTIPLIER ** context.retryCount,
    },
    actors: {
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
    },
    actions: {
      entry: ({ self }) => {
        store.commit('liveMedia/setScreenShareActor', self)
      },
      incrementRetryCount: assign({
        retryCount: ({ context }) => context.retryCount + 1,
      }),
      setupOnStop: (
        { self },
        params: {
          unsubscribeAllFn: (
            context: Partial<Context>,
            observers: any,
            partnerAttendeeId: string | null
          ) => Promise<void>
          observers: any
          partnerAttendeeId: string | null
        }
      ) => {
        // this is the only way to clean up when a machine is stopped
        const sub = self.subscribe({
          complete: async () => {
            await params.unsubscribeAllFn(
              // Reference context this way instead of passing it as a param along with { self }
              // Passing it along as { self, context } appears to serve a stale version of context
              // whereas pulling context from the snapshot serves the most recent context available.
              self.getSnapshot().context,
              params.observers,
              params.partnerAttendeeId
            )
            sub.unsubscribe()
          },
          error: async () => {
            await params.unsubscribeAllFn(
              self.getSnapshot().context,
              params.observers,
              params.partnerAttendeeId
            )
            sub.unsubscribe()
          },
        })
      },
      fetchMediaRoom: raise({ type: 'fetch_media_room' }),
      notifyMediaRoomReady: raise({ type: 'media_room_is_ready' }),
      setMeetingJoined: assign({
        isMeetingJoined: () => true,
      }),
    },
    guards: {
      maxRetriesReached: ({ context }) => {
        return context.retryCount > context.maxRetries
      },
      hasJoinedMediaRoom: ({ context }) => {
        return context?.isMeetingJoined
      },
      hasNotJoinedMediaRoom: ({ context }) => {
        return !context?.isMeetingJoined
      },
    },
  }).createMachine({
    id: 'MeetingMachine',
    context: () => ({
      sessionId: null,
      audioOutputElement: null,
      videoOutputElement: null,
      retryCount: 0,
      maxRetries: MAX_RETRY_COUNT,
      meeting: null,
      attendee: null,
      partnerAttendeeId: null,
      meetingSession: null,
      showPartnerScreenShare: false,
      isSharingMyScreen: false,
      endScreenShareModeration: () => {},
      isPartnerMicMuted: true,
      activeSpeakerIds: [],
      isPartnerSpeaking: false,
      hasReceivedPartnerAudio: false,
      transcriptionStarted: false,
      screenShareWidth: undefined,
      screenShareHeight: undefined,
      sessionRecordingStarted: false,
      isMeetingJoined: false,
    }),
    initial: 'Initializing',
    entry: { type: 'entry' },
    on: {
      meeting_ended: {
        target: '#MeetingMachine.Ended',
      },
      ban_user_from_live_media: {
        target: '#MeetingMachine.ViewOnly',
      },
      stop_stream: {
        target: '#MeetingMachine.ViewOnly',
      },
      new_partner_attendee: {
        actions: assign({
          partnerAttendeeId: ({ event }) => event.partnerAttendeeId,
        }),
      },
      set_unsubscribe_all: {
        actions: {
          type: 'setupOnStop',
          params: ({ event }) => ({
            unsubscribeAllFn: event.unsubscribeAllFn,
            observers: event.observers,
            partnerAttendeeId: event.partnerAttendeeId,
          }),
        },
      },
      set_screen_share_dimensions: {
        actions: assign({
          screenShareWidth: ({ event }) => event.width,
          screenShareHeight: ({ event }) => event.height,
        }),
      },
      transcription_status_changed: {
        actions: assign({
          transcriptionStarted: ({ event }) => event.status === 'started',
        }),
      },
    },
    states: {
      Initializing: {
        type: 'parallel',
        onDone: {
          target: 'Active',
        },
        states: {
          LoadingAudioUI: {
            initial: 'Waiting',
            states: {
              Waiting: {
                on: {
                  audio_ui_loaded: {
                    target: 'Loaded',
                    actions: assign({
                      audioOutputElement: ({ context, event }) =>
                        (context.audioOutputElement = event.audioOutputElement),
                    }),
                  },
                },
              },
              Loaded: {
                type: 'final',
              },
            },
          },
          LoadingVideoUI: {
            initial: 'Waiting',
            description: `this state waits for the <video> element to be
              loaded and is triggered in the onMount of the component`,
            states: {
              Waiting: {
                on: {
                  video_ui_loaded: {
                    target: 'Loaded',
                    actions: assign({
                      videoOutputElement: ({ context, event }) =>
                        (context.videoOutputElement = event.videoOutputElement),
                    }),
                  },
                },
              },
              Loaded: { type: 'final' },
            },
          },
          LoadingSessionId: {
            initial: 'Waiting',
            states: {
              Waiting: {
                on: {
                  set_session_id: {
                    target: 'Loaded',
                    actions: assign({
                      sessionId: ({ event }) => event.sessionId,
                    }),
                  },
                },
              },
              Loaded: { type: 'final' },
            },
          },
          WaitingForSessionStart: {
            initial: 'Waiting',
            description: `this state waits for the UPChieve session to be matched (e.g. volunteer joins)`,
            states: {
              Waiting: {
                on: {
                  session_started: {
                    target: 'Loaded',
                  },
                },
              },
              Loaded: { type: 'final' },
            },
          },
        },
      },
      Active: {
        type: 'parallel',
        states: {
          ScreenShareControl: {
            initial: 'CheckingEligibility',
            states: {
              Idle: {
                on: {
                  share_screen: {
                    target: 'FetchMediaRoom',
                  },
                  partner_shared_screen: [
                    {
                      guard: 'hasNotJoinedMediaRoom',
                      target: 'ViewingPartnerScreenShare',
                      actions: [
                        'fetchMediaRoom',
                        assign({ showPartnerScreenShare: () => true }),
                      ],
                    },
                    {
                      target: 'ViewingPartnerScreenShare',
                      actions: assign({ showPartnerScreenShare: () => true }),
                    },
                  ],
                },
              },
              FetchMediaRoom: {
                tags: ['loadingScreenShare'],
                entry: 'fetchMediaRoom',
                always: [
                  {
                    target: 'StartingShareMyScreen',
                    guard: 'hasJoinedMediaRoom',
                  },
                ],
                on: {
                  media_room_is_ready: {
                    target: 'StartingShareMyScreen',
                  },
                },
              },
              ViewOnly: {
                on: {
                  partner_shared_screen: {
                    target: 'ViewingPartnerScreenShare',
                    actions: [
                      assign({ showPartnerScreenShare: () => true }),
                      () => {
                        AnalyticsService.captureEvent(
                          EVENTS.SCREENSHARE_USER_VIEWED_SCREENSHARE
                        )
                      },
                    ],
                  },
                  not_banned: {
                    target: 'CheckingEligibility',
                  },
                },
              },
              CheckingEligibility: {
                on: {
                  banned: [
                    {
                      target: 'ViewingPartnerScreenShare',
                      guard: ({ context }) => context.showPartnerScreenShare,
                    },
                    {
                      target: 'ViewOnly',
                    },
                  ],
                  not_banned: {
                    target: 'Idle',
                  },
                },
                invoke: {
                  id: 'ScreenShareControl.CheckingEligibility:checkEligibility',
                  src: 'isBannedFromLiveMedia',
                },
              },
              StartingShareMyScreen: {
                invoke: {
                  id: 'ScreenShareControl.StartingShareMyScreen:startingShareMyScreen',
                  src: 'startingShareMyScreen',
                  input: ({ context }) => ({
                    sessionId: context.sessionId!,
                    sessionRecordingStarted: context.sessionRecordingStarted,
                    videoOutputElement: context.videoOutputElement!,
                    meetingSession: context.meetingSession!,
                  }),
                  onDone: {
                    target: 'SharingMyScreen',
                    actions: [
                      assign({
                        isSharingMyScreen: () => true,
                        endScreenShareModeration: ({ event }) => {
                          return event.output.endScreenShareModeration
                        },
                        sessionRecordingStarted: () => true,
                      }),
                      () =>
                        AnalyticsService.captureEvent(
                          EVENTS.SCREENSHARE_USER_SHARED_SCREEN
                        ),
                      ({ self, event }) => {
                        self.subscribe({
                          complete: () => {
                            event.output.endScreenShareModeration()
                          },
                          error: () => {
                            event.output.endScreenShareModeration()
                          },
                        })
                      },
                      ({ context }) => {
                        socket.emit('joinedLiveMedia', {
                          sessionId: context.sessionId,
                        })
                      },
                    ],
                  },
                  onError: {
                    target: 'Idle',
                    actions: ({ event }) => {
                      LoggerService.noticeError(
                        `Error starting share my screen`,
                        event.error
                      )
                    },
                  },
                },
              },
              SharingMyScreen: {
                on: {
                  stop_share_screen: {
                    target: 'StoppingShareMyScreen',
                  },
                },
              },
              StoppingShareMyScreen: {
                invoke: {
                  id: 'ScreenShareControl.StoppingShareMyScreen:stopShareMyScreen',
                  src: 'stopShareMyScreen',
                  input: ({ context }) => ({ context }),
                  onDone: {
                    target: 'Idle',
                    actions: () =>
                      AnalyticsService.captureEvent(
                        EVENTS.SCREENSHARE_USER_STOPPED_SCREENSHARE
                      ),
                  },
                },
              },
              ViewingPartnerScreenShare: {
                on: {
                  partner_stopped_sharing_screen: [
                    {
                      guard: () =>
                        store.getters['liveMedia/isBannedFromLiveMedia'],
                      target: 'ViewOnly',
                    },
                    {
                      target: 'Idle',
                      actions: [
                        assign({ showPartnerScreenShare: () => false }),
                        () => {
                          AnalyticsService.captureEvent(
                            EVENTS.SCREENSHARE_USER_STOPPED_VIEWING_SCREENSHARE
                          )
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
          MicControl: {
            description: `State machine that manages the user's microphone`,
            initial: 'CheckingEligibility',
            states: {
              AudioCallUnavailable: {
                type: 'final',
                tags: ['unableToJoinAudio'],
              },
              ViewOnly: {
                on: {
                  not_banned: {
                    target: 'CheckingEligibility',
                  },
                },
              },
              CheckingEligibility: {
                invoke: {
                  id: 'MicControl.CheckingEligibility:checkEligibility',
                  src: 'isBannedFromLiveMedia',
                },
                on: {
                  banned: {
                    target: 'ViewOnly',
                  },
                  not_banned: {
                    target: 'Waiting',
                  },
                },
              },

              Waiting: {
                description: 'Waiting for the user to request to use their mic',
                on: {
                  toggle_mute_self: {
                    target: 'FetchMediaRoom',
                  },
                },
              },
              FetchMediaRoom: {
                tags: ['loadingAudioCall'],
                entry: 'fetchMediaRoom',
                always: [
                  {
                    target: 'RequestingMicAccess',
                    guard: 'hasJoinedMediaRoom',
                  },
                ],
                on: {
                  media_room_is_ready: {
                    target: 'RequestingMicAccess',
                  },
                },
              },
              RequestingMicAccess: {
                tags: ['loadingAudioCall'],
                description: `Request mic permissions and start the user's audio input, or move them to an ineligible
                state if no audio input device is available or they deny permissions.`,
                invoke: {
                  id: 'MicControl.RequestingMicAccess:requestMicAccess',
                  src: 'requestMicAccess',
                  input: ({ context }) => ({
                    meetingSession: context.meetingSession!,
                  }),
                  onDone: {
                    target: 'WaitingForTranscription',
                  },
                  onError: {
                    target: 'MicPermissionsDenied',
                  },
                },
              },
              MicUnmuted: {
                entry: [
                  ({ context }) => {
                    context.meetingSession?.audioVideo.realtimeUnmuteLocalAudio()
                  },
                ],
                on: {
                  toggle_mute_self: {
                    target: 'MicMuted',
                  },
                },
              },
              MicMuted: {
                entry: [
                  ({ context }) => {
                    context.meetingSession?.audioVideo.realtimeMuteLocalAudio()
                  },
                ],
                on: {
                  toggle_mute_self: {
                    target: 'WaitingForTranscription',
                  },
                },
              },

              WaitingForTranscription: {
                tags: ['loadingAudioCall'],
                on: {
                  transcription_not_started: {
                    target: 'MicMuted',
                  },
                  transcription_started: {
                    target: 'MicUnmuted',
                  },
                },
                invoke: {
                  id: 'MicControl.WaitingForTranscription:maybeStartTranscription',
                  src: 'maybeStartTranscription',
                  input: ({ context, self }) => ({
                    transcriptionStarted: context.transcriptionStarted,
                    sessionId: context.sessionId!,
                    sessionRecordingStarted: context.sessionRecordingStarted,
                    parent: self,
                  }),
                  onDone: {
                    target: 'MicUnmuted',
                    actions: assign({
                      sessionRecordingStarted: () => true,
                    }),
                  },
                  onError: {
                    target: 'MicMuted',
                    actions: () =>
                      AnalyticsService.captureEvent(
                        EVENTS.GENERAL_TRANSCRIPTION_ERROR,
                        {
                          isFeatureFlagEnabled:
                            store.getters[
                              'featureFlags/isNewSpeechToTextEnabled'
                            ],
                        }
                      ),
                  },
                },
              },

              MicPermissionsDenied: {
                description: 'Failed to get mic permissions',
                on: {
                  toggle_mute_self: {
                    target: 'RequestingMicAccess',
                  },
                },
              },
            },
          },
          SpeakerControl: {
            description: `State machine that manages the user's speaker controls (muting/unmuting the other person)`,
            initial: 'PreviousState',
            states: {
              PreviousState: { type: 'history', target: 'Waiting' },
              Waiting: {
                description: `Waiting for the user to attempt to interact with the speaker.`,
                on: {
                  toggle_mute_partner: {
                    target: 'FetchMediaRoom',
                  },
                },
              },
              FetchMediaRoom: {
                tags: ['loadingSpeakerControl'],
                entry: 'fetchMediaRoom',
                always: [
                  {
                    target: 'RequestSpeakerAccess',
                    guard: 'hasJoinedMediaRoom',
                  },
                ],
                on: {
                  media_room_is_ready: {
                    target: 'RequestSpeakerAccess',
                  },
                },
              },
              RequestSpeakerAccess: {
                tags: ['loadingSpeakerControl'],
                invoke: {
                  id: 'SpeakerControl.RequestSpeakerAccess#requestSpeakerAccess',
                  src: 'requestSpeakerAccess',
                  input: ({ context }) => ({
                    meetingSession: context.meetingSession!,
                    audioOutputElement: context.audioOutputElement!,
                  }),
                  onDone: {
                    target: 'SpeakerUnmuted',
                  },
                  onError: {
                    target: 'SpeakerPermissionsDenied',
                  },
                },
              },
              SpeakerUnmuted: {
                entry: [
                  () => {
                    store.dispatch('liveMedia/audio/dismissDisplayCallStatus')
                  },
                ],
                on: {
                  toggle_mute_partner: {
                    target: 'SpeakerMuted',
                  },
                },
              },
              SpeakerMuted: {
                on: {
                  toggle_mute_partner: {
                    target: 'SpeakerUnmuted',
                  },
                },
              },
              SpeakerPermissionsDenied: {
                description: 'Failed to get speaker permissions',
                on: {
                  toggle_mute_partner: {
                    target: 'RequestSpeakerAccess',
                  },
                },
              },
            },
          },
          MediaRouter: {
            initial: 'Idle',
            states: {
              Idle: {
                on: {
                  fetch_media_room: {
                    target: 'FetchingChimeMeeting',
                    guard: 'hasNotJoinedMediaRoom',
                  },
                },
              },
              FetchingChimeMeeting: {
                initial: 'Loading',
                states: {
                  Loading: {
                    invoke: {
                      id: 'FetchingChimeMeeting.Loading:fetchChimeMeeting',
                      src: 'fetchChimeMeeting',
                      input: ({ context }) => ({
                        sessionId: context.sessionId,
                      }),
                      onDone: {
                        target:
                          '#MeetingMachine.Active.MediaRouter.CreatingMeetingSession',
                        actions: assign({
                          meeting: ({ event }) => event.output.meeting,
                          attendee: ({ event }) => event.output.attendee,
                          partnerAttendeeId: ({ event }) =>
                            event.output.partnerAttendee?.AttendeeId ?? null,
                          retryCount: 0,
                        }),
                      },
                      onError: {
                        target: 'RetryFetchingChimeMeeting',
                        actions: [
                          ({ event }) => {
                            LoggerService.noticeError(
                              `Error fetching chime meeting`,
                              event.error
                            )
                          },
                          () =>
                            AnalyticsService.captureEvent(
                              EVENTS.CHIME_CONNECTION_ERROR
                            ),
                        ],
                      },
                    },
                  },
                  RetryFetchingChimeMeeting: {
                    after: {
                      timeout: [
                        {
                          target: '#MeetingMachine.FailedToConnect',
                          guard: {
                            type: 'maxRetriesReached',
                          },
                        },
                        {
                          target: 'Loading',
                          actions: {
                            type: 'incrementRetryCount',
                          },
                        },
                      ],
                    },
                  },
                },
              },
              CreatingMeetingSession: {
                invoke: {
                  id: 'CreatingMeetingSession:createMeetingSession',
                  src: 'createMeetingSession',
                  input: ({ context }) => ({ context }),
                  onDone: {
                    target: 'JoiningMeeting',
                    actions: assign({
                      meetingSession: ({ event }) =>
                        event.output.meetingSession,
                    }),
                  },
                  onError: {
                    target: '#MeetingMachine.FailedToConnect',
                    actions: ({ event }) => {
                      LoggerService.noticeError(
                        `Error creating meeting session`,
                        event.error
                      )
                    },
                  },
                },
              },
              JoiningMeeting: {
                invoke: {
                  id: 'JoiningMeeting:joinMeeting',
                  src: 'joinMeeting',
                  input: ({ context, self }) => ({
                    context,
                    parent: self,
                  }),
                },
                on: {
                  meeting_started: {
                    actions: ['setMeetingJoined', 'notifyMediaRoomReady'],
                    target: 'Ready',
                  },
                },
                description: `This is where we add the chime observers and call audioVideo.start()
        TODO: add retry for when we get an unhandled exception, and 'sendBack'
        to retry when we get an error from AWS`,
              },
              Ready: {},
            },
            on: {
              active_speakers_changed: {
                actions: [
                  assign({
                    isPartnerSpeaking: (input) =>
                      input.event.speakerIds.includes(
                        input.context.partnerAttendeeId ?? ''
                      ),
                    activeSpeakerIds: (input) => input.event.speakerIds,
                    isPartnerMicMuted: (input) =>
                      // If the partner is speaking, they can't be muted.
                      input.context.partnerAttendeeId &&
                      input.event.speakerIds.includes(
                        input.context.partnerAttendeeId
                      )
                        ? false
                        : input.context.isPartnerMicMuted,
                  }),
                ],
              },
              partner_mute_change: {
                actions: [
                  assign({
                    isPartnerMicMuted: (input) => input.event.muted,
                  }),
                ],
              },
              received_partner_audio_info: {
                actions: [
                  assign({
                    hasReceivedPartnerAudio: () => true,
                  }),
                ],
              },
            },
          },
        },
      },
      ViewOnly: {
        invoke: {
          id: 'ViewOnly:stopShareMyScreenAndMic',
          src: 'stopShareMyScreenAndMic',
          input: ({ context }) => ({ context }),
          onDone: {
            target: '#MeetingMachine.Active.MediaRouter.Ready',
          },
        },
      },
      FailedToConnect: { type: 'final', tags: ['unableToJoinMediaRoom'] },
      Ended: { type: 'final' },
    },
  })
}
