import NetworkService from './NetworkService'
import AnalyticsService from './AnalyticsService'
import { EVENTS } from '@/consts'
import { useProductFlagsStore } from '@/stores/product-flags'
import type { ImpactStudyCampaign } from '@/types'

export async function enrollStudentToIncentiveProgram(proxyEmail?: string) {
  const {
    data: { fallIncentiveEnrollmentAt },
  } = await NetworkService.enrollStudentInIncentiveProgram(proxyEmail)

  AnalyticsService.captureEvent(
    EVENTS.STUDENT_FALL_INCENTIVE_ENROLLMENT_ENROLLED,
    {
      $set: { fallIncentiveEnrollmentAt },
    }
  )
  useProductFlagsStore().addToProductFlags({ fallIncentiveEnrollmentAt })
}

export async function processImpactStudySurveySubmission(
  campaign: ImpactStudyCampaign
) {
  const {
    data: { impactStudyEnrollmentAt },
  } = await NetworkService.upsertImpactStudyCampaign(campaign)

  if (impactStudyEnrollmentAt) {
    AnalyticsService.captureEvent(EVENTS.STUDENT_IMPACT_STUDY_ENROLLED, {
      $set: { impactStudyEnrollmentAt },
    })
    useProductFlagsStore().addToProductFlags({ impactStudyEnrollmentAt })
  }
}
