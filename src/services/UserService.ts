import NetworkService from './NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import Gleap from 'gleap'
import LoggerService from './LoggerService'

export default {
  getUser() {
    return NetworkService.user()
      .then((res) => {
        const { data } = res

        return data.user ?? {}
      })
      .catch((err) => {
        LoggerService.noticeError(err, "Couldn't retrieve user")
        return {}
      })
  },
  async setProfile(data, store) {
    await NetworkService.setProfile(data)
    await store.dispatch('user/addToUser', data)
    AnalyticsService.captureEvent(EVENTS.PROFILE_UPDATED)
  },

  getVolunteers() {
    return NetworkService.getVolunteers().then((res) => {
      if (res.data.err) {
        return res.data.err
      } else if (res.data.volunteers) {
        return res.data.volunteers
      } else {
        throw new Error()
      }
    })
  },
  getVolunteersAvailability(certifiedSubject: string) {
    return NetworkService.getVolunteersAvailability(certifiedSubject).then(
      (res) => {
        if (res.data.err) {
          return res.data.err
        } else if (res.data.aggAvailabilities) {
          return res.data.aggAvailabilities
        } else {
          throw new Error()
        }
      }
    )
  },

  async switchActiveRole(
    context: { $store: any },
    activeRole: 'student' | 'volunteer'
  ) {
    const response = await NetworkService.switchActiveRole(activeRole)
    const newActiveRole = response.data.activeRole
    const newUser = response.data.user
    await context.$store.dispatch('user/addToUser', {
      userType: newActiveRole,
      ...newUser,
    })
    AnalyticsService.captureEvent(
      newActiveRole === 'volunteer'
        ? EVENTS.ROLE_SWITCHING_USER_SWITCHED_TO_VOLUNTEER_MODE
        : EVENTS.ROLE_SWITCHING_USER_SWITCHED_TO_STUDENT_MODE
    )
    Gleap.getInstance().softReInitialize()
    return newActiveRole
  },

  async completeGoogleSsoVolunteerSignup(data) {
    return NetworkService.completeGoogleSsoVolunteerSignup(data)
  },

  /**
   * Add the volunteer role to the user's account and show them the "Building your coach experience"
   * screen
   */
  async firstTransitionToVolunteerMode(router) {
    await NetworkService.addVolunteerRoleForStudent()
    await router.push('/building-your-coach-experience')
  },
}
