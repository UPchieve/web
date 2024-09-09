import NetworkService from './NetworkService'
import AnalyticsService from './AnalyticsService'
import { EVENTS } from '../consts'
import type { Store } from 'vuex'

// TODO: Fix `store` type
export async function enrollStudentToIncentiveProgram(store: Store<any>) {
  const {
    data: { fallIncentiveEnrollmentAt },
  } = await NetworkService.enrollStudentInIncentiveProgram()

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
