/* eslint-disable no-tabs */
import moment from 'moment'

import NetworkService from './NetworkService'
import AuthService from './AuthService'
import OnboardingService from './OnboardingService'

import router from '@/router'

export default {
  getAuth () {
    return AuthService.user
  },
  getUser () {
    const auth = this.getAuth()
    if (auth.authenticated) {
      return auth.data
    }
    return {}
  },
  validateBirthdate (birthdate) {
    const m = moment(birthdate, 'MM/DD/YYYY')
    if (!m.isValid()) {
      return 'Birthdate is invalid'
    }

    return true // No validation errors
  },
  getOnboardingServiceInterest () {
    const user = this.getUser()
    return (user && user.onboardingServiceInterest) || []
  },
  getOnboarding () {
    return OnboardingService.status
  },

  setProfile (context, data, redirect) {
    return NetworkService.setProfile(context, data).then(
      res => {
        if (res.data) {
          AuthService.storeUser(res.data.user)
          context.msg = 'Set!'
        } else {
          throw new Error()
        }
        if (redirect) {
          router.push(redirect)
        }
        return Promise.resolve(res)
      },
      res => {
        context.msg = 'Error occurred'
        console.log(res)
        return Promise.reject(res)
      }
    )
  },

  getVolunteers(context){
    return NetworkService.getVolunteers(context).then(res =>{
      return res.data.volunteers
  })
  },
  getVolunteersAvailability (context, subject) {
    return NetworkService.getVolunteersAvailability(context, subject).then(res =>{
      return res.data.userAvailabilityMap 
  })
},
}
