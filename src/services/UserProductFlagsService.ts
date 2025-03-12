import NetworkService from './NetworkService'
import AnalyticsService from './AnalyticsService'
import { EVENTS } from '../consts'
import type { Store } from 'vuex'
import type { AxiosError } from 'axios'
import type { RootState } from '@/store'
import LoggerService from './LoggerService'

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

// TODO: We should be handling the error status within the NetworkService instead of here
// TODO: Fix store type
export async function impactStudyEnrollment(
  store: Store<any>,
  surveyId: number
) {
  try {
    const {
      data: { impactStudyEnrollmentAt },
    } = await NetworkService.impactStudyEnrollment(surveyId)

    if (impactStudyEnrollmentAt) {
      AnalyticsService.captureEvent(EVENTS.STUDENT_IMPACT_STUDY_ENROLLED, {
        $set: { impactStudyEnrollmentAt },
      })
      store.dispatch('productFlags/addToProductFlags', {
        impactStudyEnrollmentAt,
      })
    }
  } catch (err) {
    const error =
      ((err as AxiosError).response?.data as { err?: string })?.err ??
      'Unknown error'
    throw new Error(error)
  }
}

export async function setTellThemCollegePrepModalSeenAt(
  store: Store<RootState>
) {
  try {
    store.dispatch('productFlags/addToProductFlags', {
      tellThemCollegePrepModalSeenAt: new Date().toISOString(),
    })
    await NetworkService.setTellThemCollegePrepModalSeenAt()
  } catch (err: unknown) {
    LoggerService.noticeError(err)
  }
}
