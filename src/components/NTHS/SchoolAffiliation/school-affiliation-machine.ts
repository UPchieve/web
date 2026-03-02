import { assign, setup } from 'xstate'
import { updateStatus, setInitialState, submitAdvisorInfo } from './actors'
import axios from 'axios'

export type AdvisorInfo = {
  schoolId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  phoneExtension?: string
  title: string
}

export type AffiliationStatus =
  | 'PENDING_SCHOOL_AFFILIATION'
  | 'PENDING_UPCHIEVE_VERIFICATION'
  | 'AFFILIATED'
  | 'DENIED'
  | 'OPTED_OUT'

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
    events: {} as
      | { type: 'OPT_OUT' }
      | { type: 'OPT_IN' }
      | { type: 'SUBMIT_ADVISOR_INFO'; advisorInfo: AdvisorInfo }
      | { type: 'SUBMITTED_ADVISOR_INFO' }
      | { type: 'PENDING_UPCHIEVE_VERIFICATION' }
      | { type: 'APPROVE' }
      | { type: 'DENY' }
      | { type: 'WITHDRAW' }
      | { type: 'INERT' },
  },
  actors: {
    updateStatus,
    setInitialState,
    submitAdvisorInfo,
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
      invoke: {
        src: 'setInitialState',
        input: ({ context }) => ({
          schoolAffiliationStatus: context.schoolAffiliationStatus,
        }),
      },
      on: {
        OPT_IN: { target: 'SeekingAffiliation' },
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
      invoke: {
        src: 'updateStatus',
        input: ({ context }) => ({
          groupId: context.groupId,
          action: 'MARKED SCHOOL AFFILIATION IN PROGRESS',
        }),
        onDone: {
          target: 'SeekingAffiliation',
          actions: assign({
            schoolAffiliationStatus: ({ event }) => event.output,
          }),
        },
      },
    },
    OptingOut: {
      tags: ['loading'],
      invoke: {
        src: 'updateStatus',
        input: ({ context }) => ({
          groupId: context.groupId,
          action: 'OPTED OUT',
        }),
        onDone: {
          target: 'OptedOut',
          actions: assign({
            schoolAffiliationStatus: ({ event }) => event.output,
          }),
        },
      },
    },

    SeekingAffiliation: {
      on: {
        SUBMIT_ADVISOR_INFO: {
          target: 'SubmittingAdvisorInfo',
          actions: assign({
            advisorInfo: ({ event }) => event.advisorInfo,
            submitError: null,
          }),
        },
        WITHDRAW: {
          target: 'OptingOut',
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
          actions: assign({
            advisorInfo: ({ event }) => event.output,
          }),
        },
        onError: {
          target: 'SeekingAffiliation',
          actions: assign({
            submitError: ({ event }) => {
              let message = 'An unknown error has occured'
              if (axios.isAxiosError(event.error)) {
                message =
                  event.error.response?.data?.err ??
                  'An unknown error has occured'
              }
              return message
            },
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
        WITHDRAW: {
          target: 'OptingOut',
        },
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
