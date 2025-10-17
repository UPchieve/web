import NetworkService from './NetworkService'
import AnalyticsService from './AnalyticsService'
import { EVENTS } from '../consts'
import type { Store } from 'vuex'
import type { RootState } from '@/store'
import type { ImpactStudyCampaign } from '@/types'

export async function enrollStudentToIncentiveProgram(
  store: Store<RootState>,
  proxyEmail?: string
) {
  const {
    data: { fallIncentiveEnrollmentAt },
  } = await NetworkService.enrollStudentInIncentiveProgram(proxyEmail)

  AnalyticsService.captureEvent(
    EVENTS.STUDENT_FALL_INCENTIVE_ENROLLMENT_ENROLLED,
    {
      $set: { fallIncentiveEnrollmentAt },
    }
  )
  store.dispatch('productFlags/addToProductFlags', {
    fallIncentiveEnrollmentAt,
  })
}

export async function processImpactStudySurveySubmission(
  store: Store<RootState>,
  campaign: ImpactStudyCampaign
) {
  const {
    data: { impactStudyEnrollmentAt },
  } = await NetworkService.upsertImpactStudyCampaign(campaign)

  if (impactStudyEnrollmentAt) {
    AnalyticsService.captureEvent(EVENTS.STUDENT_IMPACT_STUDY_ENROLLED, {
      $set: { impactStudyEnrollmentAt },
    })
    store.dispatch('productFlags/addToProductFlags', {
      impactStudyEnrollmentAt,
    })
  }
}
