import { fromCallback, fromPromise } from 'xstate'
import type {
  AdvisorInfo,
  SchoolAffiliationEvent,
  SchoolAffiliationEventType,
} from './school-affiliation-machine'
import type {
  AffiliationStatus,
  NTHSSchoolAffiliationActionName,
} from '@/services/NTHSGroupService'
import NetworkService from '@/services/NetworkService'
import store from '@/store'

// UNAFFILIATED is not a decision, so it starts on the same panel as a chapter
// with no affiliation row at all.
export const stateToEventMap: Record<
  AffiliationStatus,
  SchoolAffiliationEventType
> = {
  PENDING_SCHOOL_AFFILIATION: 'OPT_IN',
  PENDING_UPCHIEVE_VERIFICATION: 'SUBMITTED_ADVISOR_INFO',
  AFFILIATED: 'APPROVE',
  DENIED: 'DENY',
  OPTED_OUT: 'OPT_OUT',
  UNAFFILIATED: 'INERT',
}
export const setInitialState = fromCallback<
  SchoolAffiliationEvent,
  { schoolAffiliationStatus: AffiliationStatus | null }
>(({ input, sendBack }) => {
  // Falling back keeps a status this bundle predates from sending an undefined
  // event, which xstate turns into an uncaught throw and a blank card.
  const type =
    input.schoolAffiliationStatus === null
      ? 'INERT'
      : (stateToEventMap[input.schoolAffiliationStatus] ?? 'INERT')
  sendBack({ type })
})

export const updateStatus = fromPromise(
  async ({
    input,
  }: {
    input: {
      groupId: string
      action: NTHSSchoolAffiliationActionName
    }
  }) => {
    const results = await NetworkService.createActionForNTHSGroup(
      input.groupId,
      input.action
    )

    const { schoolAffiliationStatus } = results.data
    return schoolAffiliationStatus
  }
)
export const submitAdvisorInfo = fromPromise(
  async ({
    input,
  }: {
    input: {
      groupId: string
      advisorInfo: AdvisorInfo
    }
  }) => {
    const { groupId, advisorInfo } = input
    const result = await NetworkService.submitSchoolAffiliation(
      groupId,
      advisorInfo
    )
    return result.data
  }
)

// The props come from the group fetched on page load, so switching tabs remounts
// from that copy and rewinds the card. Write the server's new answer back onto it.
export function recordAffiliationStatus(
  _: unknown,
  params: { groupId: string; schoolAffiliationStatus: AffiliationStatus }
) {
  store.commit('nths/setNTHSGroupSchoolAffiliationStatus', params)
}

// Same staleness, but this response nests the new status under `action` rather
// than returning it as the actor's output, so refetch instead.
export function refetchGroup() {
  store.dispatch('nths/fetchNthsData')
}
