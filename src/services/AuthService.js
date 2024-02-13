import Validator from 'validator'
import errorFromHttpResponse from '../utils/error-from-http-response'
import AnalyticsService from './AnalyticsService'
import LoggerService from './LoggerService'
import NetworkService from './NetworkService'
import ProductDiscoveryService from './ProductDiscoveryService'

export const INVALID_CSRF_ERROR = 'invalid csrf token'

export default {
  login(creds) {
    const { email, password } = creds
    if (
      !email ||
      !password ||
      !Validator.isEmail(email) ||
      password.length < 1
    ) {
      return Promise.reject('Invalid login form submission')
    }

    return NetworkService.login(creds).then((res) => {
      const data = { ...res.data }
      if (!data) {
        throw new Error('No user returned from auth service')
      }

      return data
    })
  },

  registerOpenVolunteer(signupData) {
    return NetworkService.registerOpenVolunteer(signupData)
      .then((res) => {
        const data = { ...res.data }
        if (!data) {
          throw new Error('No user returned from auth service')
        }
        AnalyticsService.registerVolunteer(data.user)
      })
      .catch((res) => {
        throw errorFromHttpResponse(res)
      })
  },

  registerPartnerVolunteer(signupData) {
    return NetworkService.registerPartnerVolunteer(signupData)
      .then((res) => {
        const data = { ...res.data }
        if (!data) {
          throw new Error('No user returned from auth service')
        }
        AnalyticsService.registerVolunteer(data.user)
      })
      .catch((res) => {
        throw errorFromHttpResponse(res)
      })
  },

  async registerStudent(signupData) {
    try {
      await NetworkService.registerStudent(signupData)
    } catch (e) {
      throw errorFromHttpResponse(e)
    }
  },

  registerOpenStudent(signupData) {
    return NetworkService.registerOpenStudent(signupData)
      .then((res) => {
        const data = { ...res.data }
        if (!data) {
          throw new Error('No user returned from auth service')
        }
      })
      .catch((res) => {
        throw errorFromHttpResponse(res)
      })
  },

  registerPartnerStudent(signupData) {
    return NetworkService.registerPartnerStudent(signupData)
      .then((res) => {
        const data = { ...res.data }
        if (!data) {
          throw new Error('No user returned from auth service')
        }
      })
      .catch((res) => {
        throw errorFromHttpResponse(res)
      })
  },

  checkRegister(creds) {
    return NetworkService.checkRegister(creds).catch((res) => {
      throw errorFromHttpResponse(res)
    })
  },

  sendReset(context, email, redirect) {
    return NetworkService.sendReset({ email })
      .then((res) => {
        const data = { ...res.data }
        if (res.status !== 200) {
          throw new Error(data.err)
        }

        context.msg = data.msg

        if (redirect) {
          setTimeout(() => {
            context.$router.push(redirect)
          }, 2000)
        }
      })
      .catch((res) => {
        throw errorFromHttpResponse(res)
      })
  },

  confirmReset(context, credentials, redirect) {
    return NetworkService.confirmReset(credentials)
      .then((res) => {
        const data = { ...res.data }
        if (!data) {
          throw new Error('No user returned from auth service')
        }

        context.msg = 'Password has been reset!'

        if (redirect) {
          setTimeout(() => {
            context.$router.push(redirect)
          }, 2000)
        }
      })
      .catch((res) => {
        throw errorFromHttpResponse(res)
      })
  },

  initiateVerification(data) {
    return NetworkService.sendVerification(data).catch((err) => {
      throw errorFromHttpResponse(err)
    })
  },

  confirmVerification(data) {
    return NetworkService.confirmVerification(data).catch((err) => {
      throw errorFromHttpResponse(err)
    })
  },

  logout(context) {
    if (context) {
      NetworkService.logout()
        .then(() => {
          context.$router.push('/logout')
          context.$store.dispatch('user/clear')
        })
        .catch(() => {
          context.$router.push('/logout')
          context.$store.dispatch('user/clear')
        })
        .finally(() => {
          AnalyticsService.reset()
          LoggerService.reset()
          ProductDiscoveryService.reset()

          // disconnect socket
          context.$socket.disconnect()
        })
    }
  },

  getAuth() {
    return NetworkService.user()
      .then((res) => {
        const data = { ...res.data }
        if (!data) {
          throw new Error('No user returned from auth service')
        }

        if (data.user) {
          const auth = {
            authenticated: true,
            user: data.user,
          }
          auth.user.date = new Date(res.headers.get('Date'))
          return auth
        } else {
          return {
            authenticated: false,
            user: null,
          }
        }
      })
      .catch((err) => {
        return {
          authenticated: false,
          user: null,
          err: err,
        }
      })
  },
}
