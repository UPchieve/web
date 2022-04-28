import moment from 'moment'
import AuthService from './AuthService'
import NetworkService from './NetworkService'

export default {
  getAuth(context) {
    return AuthService.getAuth(context)
  },
  getUser(context) {
    return this.getAuth(context).then(auth => {
      if (auth.authenticated) {
        return auth.user
      }

      if (auth.err) {
        throw auth.err
      }

      return Promise.resolve({})
    })
  },
  validateBirthdate(birthdate) {
    const m = moment(birthdate, 'MM/DD/YYYY')
    if (!m.isValid()) {
      return 'Birthdate is invalid'
    }

    return true // No validation errors
  },
  setProfile(data) {
    return NetworkService.setProfile(data)
  },

  getVolunteers(context) {
    return NetworkService.getVolunteers(context).then(res => {
      if (res.data.err) {
        return res.data.err
      } else if (res.data.volunteers) {
        return res.data.volunteers
      } else {
        throw new Error()
      }
    })
  },
  getVolunteersAvailability(context, certifiedSubject) {
    return NetworkService.getVolunteersAvailability(
      context,
      certifiedSubject
    ).then(res => {
      if (res.data.err) {
        return res.data.err
      } else if (res.data.aggAvailabilities) {
        return res.data.aggAvailabilities
      } else {
        throw new Error()
      }
    })
  }
}
