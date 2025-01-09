import NetworkService from './NetworkService'
import AnalyticsService from './AnalyticsService'
import { EVENTS } from '../consts'
import type { Store } from 'vuex'
import type { AxiosError } from 'axios'

// TODO: Fix `store` type
export async function enrollStudentToIncentiveProgram(
  store: Store<any>,
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

// TODO: Add analytic events and get an enrollment date for the study and push to PostHog
// TODO: We should be handling the error status within the NetworkService instead of here
export async function impactStudyEnrollment(surveyId: number) {
  try {
    return await NetworkService.impactStudyEnrollment(surveyId)
  } catch (err) {
    const error =
      ((err as AxiosError).response?.data as { err?: string })?.err ??
      'Unknown error'
    throw new Error(error)
  }
}
