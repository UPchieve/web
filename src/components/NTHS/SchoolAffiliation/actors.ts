import { fromCallback, fromPromise } from 'xstate'
import type {
  AdvisorInfo,
  AffiliationStatus,
  SchoolAffiliationEvent,
  SchoolAffiliationEventType,
} from './school-affiliation-machine'
import type { NTHSSchoolAffiliationActionName } from '@/services/NTHSGroupService'
import NetworkService from '@/services/NetworkService'
import store from '@/store'

// UNAFFILIATED just means we already have school information for the chapter
// from the application process. The president hasn't opted in or out of
// seeking affiliation yet, so show the same starting panel as a chapter
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

// The machine tracks the chapter correctly while its component is alive, but
// the props come from the group fetched on page load. Switching tabs remounts
// from that copy and rewinds the card, so refetch the group once the server
// has actually changed to keep the two in sync.
export function refetchGroup() {
  store.dispatch('nths/fetchNthsData')
}
