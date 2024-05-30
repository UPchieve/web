import Validator from 'validator'
import errorFromHttpResponse from '../utils/error-from-http-response'
import AnalyticsService from './AnalyticsService'
import LoggerService from './LoggerService'
import NetworkService, { axiosInstance } from './NetworkService'
import ProductDiscoveryService from './ProductDiscoveryService'
import { socket } from '@/socket'

export const INVALID_CSRF_ERROR = 'invalid csrf token'

export default {
  async login(creds) {
    const { email, password } = creds
    if (
      !email ||
      !password ||
      !Validator.isEmail(email) ||
      password.length < 1
    ) {
      return Promise.reject('Invalid login form submission')
    }

    const loginResponse = await NetworkService.login(creds)
    if (!('data' in loginResponse)) {
      throw new Error('No user returned from auth service')
    }
    await this.fetchAndSetCsrfHeader(loginResponse.data.user.id)
    return loginResponse.data
  },

  async fetchAndSetCsrfHeader(userId = undefined) {
    const csrfResponse = await NetworkService.getCsrfToken()
    if (!csrfResponse?.data?.csrfToken) {
      LoggerService.noticeError(
        `Failed to fetch CSRF token for userId=${userId}`
      )
      throw new Error(
        'Something went wrong. Please refresh the page and try again.'
      )
    }
    axiosInstance.defaults.headers.common['X-CSRF-TOKEN'] =
      csrfResponse.data.csrfToken
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
          socket.disconnect()
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
