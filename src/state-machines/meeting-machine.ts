import { DefaultMeetingSession } from 'amazon-chime-sdk-js'
import { assign, setup } from 'xstate'
import {
  fetchChimeMeeting,
  createMeetingSession,
  joinMeeting,
  isBannedFromLiveMedia,
  startingShareMyScreen,
  stopShareMyScreen,
  requestMicAccess,
  requestSpeakerAccess,
} from './actors'
import store from '@/store'
import LoggerService from '@/services/LoggerService'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'

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
  isAudioEligible: boolean
  isScreenshareEligible: boolean
  showPartnerScreenShare: boolean
  isBanned: boolean
  contentShareStream: MediaStream | null
  endScreenShareModeration: () => void
  isPartnerMicMuted: boolean
  activeSpeakerIds: string[]
  hasReceivedPartnerAudio: boolean // We use this to determine if we know the partner's mic status or not.
}

export type Events =
  | { type: 'audio_ui_loaded'; audioOutputElement: HTMLAudioElement }
  | { type: 'video_ui_loaded'; videoOutputElement: HTMLVideoElement }
  | { type: 'meeting_started' }
  | { type: 'new_partner_attendee'; attendeeId: string }
  | { type: 'set_unsubscribe_all'; unsubscribeAll: () => Promise<void> }
  | { type: 'set_session_id'; sessionId: string }
  | { type: 'partner_shared_screen' }
  | { type: 'partner_stopped_sharing_screen' }
  | { type: 'meeting_ended' }
  | { type: 'share_screen' }
  | { type: 'stop_share_screen' }
  | { type: 'session_started' }
  | { type: 'toggle_mute_self' }
  | { type: 'toggle_mute_partner' }
  | { type: 'active_speakers_changed'; speakerIds: string[] }
  | { type: 'partner_mute_change'; muted: boolean }
  | { type: 'received_partner_audio_info' }
  | {
      type: 'session_started'
      isAudioEligible: boolean
      isScreenshareEligible: boolean
    }
  | { type: 'ban_user_from_live_media' }

export function create() {
  return setup({
    types: {
      tags: {} as 'loadingScreenShare' | 'error',
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
      requestMicAccess,
      requestSpeakerAccess,
    },
    actions: {
      entry: ({ self }) => {
        store.commit('liveMedia/setScreenShareActor', self)
      },
      incrementRetryCount: assign({
        retryCount: ({ context }) => context.retryCount + 1,
      }),
      setupOnStop: ({ self }, params: { unsubscribeAll: () => void }) => {
        // this is the only way to clean up when a machine is stopped
        const sub = self.subscribe({
          complete: async () => {
            await params.unsubscribeAll()
            sub.unsubscribe()
          },
        })
      },
    },
    guards: {
      maxRetriesReached: ({ context }) => {
        return context.retryCount > context.maxRetries
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
      isBanned: false,
      isAudioEligible: false,
      isScreenshareEligible: false,
      contentShareStream: null,
      endScreenShareModeration: () => {},
      isPartnerMicMuted: true,
      activeSpeakerIds: [],
      hasReceivedPartnerAudio: false,
    }),
    initial: 'FetchingState',
    entry: { type: 'entry' },
    on: {
      meeting_ended: {
        target: '#MeetingMachine.Ended',
      },
      ban_user_from_live_media: {
        target: '#MeetingMachine.Banned',
        actions: assign({
          isBanned: () => true,
        }),
      },
      new_partner_attendee: {
        actions: assign({
          partnerAttendeeId: ({ event }) => event.attendeeId,
        }),
      },
      set_unsubscribe_all: {
        actions: {
          type: 'setupOnStop',
          params: ({ event }) => ({
            unsubscribeAll: event.unsubscribeAll,
          }),
        },
      },
    },
    states: {
      // Parallel machine that exits when all the UI and data we need are loaded
      FetchingState: {
        tags: ['loadingScreenShare'],
        type: 'parallel',
        onDone: {
          target: 'CheckingLiveMediaEligibility',
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
                    actions: assign({
                      isAudioEligible: ({ event }) => event.isAudioEligible,
                      isScreenshareEligible: ({ event }) =>
                        event.isScreenshareEligible,
                    }),
                  },
                },
              },
              Loaded: { type: 'final' },
            },
          },
        },
      },
      CheckingLiveMediaEligibility: {
        always: [
          {
            target: 'FetchingChimeMeeting',
            guard: ({ context }) =>
              context.isAudioEligible || context.isScreenshareEligible,
          },
          {
            target: 'IneligibleForLiveMedia',
          },
        ],
      },
      IneligibleForLiveMedia: {
        type: 'final',
      },
      FetchingChimeMeeting: {
        initial: 'Loading',
        tags: ['loadingScreenShare'],
        states: {
          Loading: {
            invoke: {
              id: 'FetchingChimeMeeting.Loading:fetchChimeMeeting',
              src: 'fetchChimeMeeting',
              input: ({ context }) => ({ sessionId: context.sessionId }),
              onDone: {
                target: '#MeetingMachine.CreatingMeetingSession',
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
                actions: ({ event }) => {
                  LoggerService.noticeError(
                    `Error fetching chime meeting`,
                    event.error
                  )
                },
              },
            },
          },
          RetryFetchingChimeMeeting: {
            after: {
              timeout: [
                {
                  target: '#MeetingMachine.UnableToJoinMeeting',
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
        tags: ['loadingScreenShare'],
        invoke: {
          id: 'CreatingMeetingSession:createMeetingSession',
          src: 'createMeetingSession',
          input: ({ context }) => ({ context }),
          onDone: {
            target: 'JoiningMeeting',
            actions: assign({
              meetingSession: ({ event }) => event.output.meetingSession,
            }),
          },
          onError: {
            target: 'UnableToJoinMeeting',
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
        tags: ['loadingScreenShare'],
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
            target: 'JoinedMeeting',
          },
        },
        description: `This is where we add the chime observers and call audioVideo.start()
        TODO: add retry for when we get an unhandled exception, and 'sendBack'
        to retry when we get an error from AWS`,
      },
      JoinedMeeting: {
        type: 'parallel',
        states: {
          ScreenShareControl: {
            initial: 'CheckingEligibility',
            states: {
              Idle: {
                on: {
                  share_screen: {
                    target: 'StartingShareMyScreen',
                    guard: ({ context }) =>
                      !context.isBanned && context.isScreenshareEligible,
                  },
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
                },
              },
              CheckingEligibility: {
                tags: ['loadingScreenShare'],
                invoke: {
                  id: 'ScreenShareControl.CheckingEligibility:checkEligibility',
                  src: 'isBannedFromLiveMedia',
                  onDone: {
                    target: 'Idle',
                    actions: assign({
                      isBanned: ({ event }) => event.output.isBanned,
                    }),
                  },
                },
              },
              StartingShareMyScreen: {
                invoke: {
                  id: 'ScreenShareControl.StartingShareMyScreen:startingShareMyScreen',
                  src: 'startingShareMyScreen',
                  input: ({ context }) => ({ context }),
                  onDone: {
                    target: 'SharingMyScreen',
                    actions: [
                      assign({
                        contentShareStream: ({ event }) =>
                          event.output.contentShareStream,
                        endScreenShareModeration: ({ event }) =>
                          event.output.endScreenShareModeration,
                      }),
                      () =>
                        AnalyticsService.captureEvent(
                          EVENTS.SCREENSHARE_USER_SHARED_SCREEN
                        ),
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
                  partner_stopped_sharing_screen: {
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
                },
              },
            },
          },
          MicControl: {
            description: `State machine that manages the user's microphone`,
            initial: 'Waiting',
            states: {
              Waiting: {
                description: 'Waiting for the user to request to use their mic',
                on: {
                  toggle_mute_self: {
                    target: 'CheckingEligibility',
                  },
                },
              },
              CheckingEligibility: {
                description: `Request mic permissions and start the user's audio input, or move them to an ineligible
                state if no audio input device is available or they deny permissions.`,
                invoke: {
                  id: 'MicControl.CheckingEligibility:checkMicEligibility',
                  src: 'requestMicAccess',
                  input: ({ context }) => ({
                    meetingSession: context.meetingSession!,
                  }),
                  onDone: {
                    target: 'MicUnmuted',
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
                    target: 'MicUnmuted',
                  },
                },
              },
              MicPermissionsDenied: {
                description: 'Failed to get mic permissions',
                on: {
                  toggle_mute_self: {
                    target: 'CheckingEligibility',
                  },
                },
              },
            },
          },
          SpeakerControl: {
            description: `State machine that manages the user's speaker controls (muting/unmuting the other person)`,
            initial: 'Waiting',
            states: {
              Waiting: {
                description: `Waiting for the user to attempt to interact with the speaker.`,
                on: {
                  toggle_mute_partner: {
                    target: 'RequestSpeakerAccess',
                  },
                },
              },
              RequestSpeakerAccess: {
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
        },
        on: {
          active_speakers_changed: {
            actions: [
              assign({
                activeSpeakerIds: (input) => input.event.speakerIds,
                isPartnerMicMuted: (input) =>
                  // If the partner is speaking, they can't be muted.
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
      Banned: {
        invoke: {
          id: 'Banned:stopShareMyScreen',
          src: 'stopShareMyScreen',
          input: ({ context }) => ({ context }),
          onDone: {
            target: 'JoinedMeeting',
          },
        },
      },
      UnableToJoinMeeting: { type: 'final' },
      Ended: { type: 'final' },
    },
  })
}
