import { assign, setup } from 'xstate'
import {
  updateStatus,
  setInitialState,
  submitAdvisorInfo,
  refetchGroup,
  recordAffiliationStatus,
} from './actors'
import axios from 'axios'
import {
  OPTED_OUT_ACTION,
  SCHOOL_AFFILIATION_ACTION,
  type AffiliationStatus,
} from '@/services/NTHSGroupService'

export type AdvisorInfo = {
  // Null whenever the chapter's school is already on record, which is the
  // common case: the form drops the picker rather than re-asking.
  schoolId?: string | null
  firstName: string
  lastName: string
  email: string
  phone?: string
  phoneExtension?: string
  title: string
}

export type SchoolAffiliationEvent =
  | { type: 'OPT_OUT' }
  | { type: 'OPT_IN' }
  | { type: 'ADD_ADVISOR' }
  | { type: 'SUBMIT_ADVISOR_INFO'; advisorInfo: AdvisorInfo }
  | { type: 'SUBMITTED_ADVISOR_INFO' }
  | { type: 'APPROVE' }
  | { type: 'DENY' }
  | { type: 'WITHDRAW' }
  | { type: 'INERT' }

export type SchoolAffiliationEventType = SchoolAffiliationEvent['type']

const STATUS_UPDATE_ERROR = 'We could not save your choice. Please try again.'

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.err ?? fallback
  }
  return fallback
}

const config = setup({
  types: {
    context: {} as {
      groupId: string
      schoolAffiliationStatus: AffiliationStatus | null
      advisorInfo: AdvisorInfo | null
      submitError: string | null
    },
    input: {} as {
      groupId: string
      schoolAffiliationStatus: AffiliationStatus | null
    },
    events: {} as SchoolAffiliationEvent,
  },
  actors: {
    updateStatus,
    setInitialState,
    submitAdvisorInfo,
  },
  actions: {
    refetchGroup,
    recordAffiliationStatus,
  },
})

export const SchoolAffiliationMachine = config.createMachine({
  context: ({ input }) => ({
    groupId: input.groupId,
    schoolAffiliationStatus: input.schoolAffiliationStatus,
    advisorInfo: null,
    submitError: null,
  }),
  id: 'SchoolAffiliation',
  initial: 'Initial',
  states: {
    Initial: {
      tags: ['loading'],
      invoke: {
        src: 'setInitialState',
        input: ({ context }) => ({
          schoolAffiliationStatus: context.schoolAffiliationStatus,
        }),
      },
      on: {
        OPT_IN: { target: 'AwaitingAdvisorDetails' },
        INERT: { target: 'Undecided' },
        OPT_OUT: { target: 'OptedOut' },
        SUBMITTED_ADVISOR_INFO: {
          target: 'AwaitingUPchieveVerification',
        },
        DENY: { target: 'Denied' },
        APPROVE: { target: 'Approved' },
      },
    },
    Undecided: {
      on: {
        OPT_IN: {
          target: 'OptingIn',
        },
        OPT_OUT: {
          target: 'OptingOut',
        },
      },
    },
    OptingIn: {
      tags: ['loading'],
      entry: assign({ submitError: null }),
      invoke: {
        src: 'updateStatus',
        input: ({ context }) => ({
          groupId: context.groupId,
          action: SCHOOL_AFFILIATION_ACTION,
        }),
        onDone: {
          target: 'AddingAdvisorInfo',
          actions: [
            assign({
              schoolAffiliationStatus: ({ event }) => event.output,
            }),
            {
              type: 'recordAffiliationStatus',
              params: ({ context, event }) => ({
                groupId: context.groupId,
                schoolAffiliationStatus: event.output,
              }),
            },
          ],
        },
        onError: {
          target: 'Initial',
          actions: assign({
            submitError: ({ event }) =>
              errorMessage(event.error, STATUS_UPDATE_ERROR),
          }),
        },
      },
    },
    OptingOut: {
      tags: ['loading'],
      entry: assign({ submitError: null }),
      invoke: {
        src: 'updateStatus',
        input: ({ context }) => ({
          groupId: context.groupId,
          action: OPTED_OUT_ACTION,
        }),
        onDone: {
          target: 'OptedOut',
          actions: [
            assign({
              schoolAffiliationStatus: ({ event }) => event.output,
            }),
            {
              type: 'recordAffiliationStatus',
              params: ({ context, event }) => ({
                groupId: context.groupId,
                schoolAffiliationStatus: event.output,
              }),
            },
          ],
        },
        onError: {
          target: 'Initial',
          actions: assign({
            submitError: ({ event }) =>
              errorMessage(event.error, STATUS_UPDATE_ERROR),
          }),
        },
      },
    },

    // The chapter is already marked PENDING_SCHOOL_AFFILIATION here; the
    // president has only the advisor form left to fill in.
    AwaitingAdvisorDetails: {
      on: {
        ADD_ADVISOR: {
          target: 'AddingAdvisorInfo',
          // A failed opt-out's error would otherwise follow the president into
          // the form and read as the form's own.
          actions: assign({ submitError: null }),
        },
        OPT_OUT: {
          target: 'OptingOut',
        },
      },
    },
    AddingAdvisorInfo: {
      on: {
        SUBMIT_ADVISOR_INFO: {
          target: 'SubmittingAdvisorInfo',
          actions: assign({
            advisorInfo: ({ event }) => event.advisorInfo,
            submitError: null,
          }),
        },
        // Backing out of the form records nothing. Only the community panel
        // opts a chapter out.
        WITHDRAW: {
          target: 'AwaitingAdvisorDetails',
          actions: assign({ submitError: null }),
        },
      },
    },
    SubmittingAdvisorInfo: {
      invoke: {
        src: 'submitAdvisorInfo',
        input: ({ context }) => {
          return {
            groupId: context.groupId,
            advisorInfo: context.advisorInfo!,
          }
        },
        onDone: {
          target: 'AwaitingUPchieveVerification',
          actions: ['refetchGroup'],
        },
        onError: {
          target: 'AddingAdvisorInfo',
          actions: assign({
            submitError: ({ event }) =>
              errorMessage(event.error, 'An unknown error has occured'),
          }),
        },
      },
    },
    OptedOut: {
      on: {
        OPT_IN: {
          target: 'OptingIn',
        },
      },
    },
    AwaitingUPchieveVerification: {
      on: {
        APPROVE: {
          target: 'Approved',
        },
        DENY: {
          target: 'Denied',
        },
      },
    },
    Approved: {
      type: 'final',
    },
    Denied: {
      on: {
        OPT_IN: {
          target: 'OptingIn',
        },
      },
    },
  },
})
