import { fromCallback, fromPromise, type EventObject } from 'xstate'
import type {
  AdvisorInfo,
  AffiliationStatus,
} from './school-affiliation-machine'
import type { NTHSSchoolAffiliationActionName } from '@/services/NTHSGroupService'
import NetworkService from '@/services/NetworkService'

export const stateToEventMap: Record<AffiliationStatus, string> = {
  PENDING_SCHOOL_AFFILIATION: 'OPT_IN',
  PENDING_UPCHIEVE_VERIFICATION: 'SUBMITTED_ADVISOR_INFO',
  AFFILIATED: 'APPROVE',
  DENIED: 'DENY',
  OPTED_OUT: 'OPT_OUT',
}
export const setInitialState = fromCallback<
  EventObject,
  { schoolAffiliationStatus: AffiliationStatus | null }
>(({ input, sendBack }) => {
  const type =
    input.schoolAffiliationStatus === null
      ? 'INERT'
      : stateToEventMap[input.schoolAffiliationStatus]
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
