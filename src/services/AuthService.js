import Validator from 'validator'
import errorFromHttpResponse from '../utils/error-from-http-response'
import AnalyticsService from './AnalyticsService'
import LoggerService from './LoggerService'
import NetworkService from './NetworkService'
import ProductDiscoveryService from './ProductDiscoveryService'
import { socket } from '@/socket'

export async function logout(context, logoutRoute) {
  try {
    await NetworkService.logout()
  } finally {
    await handleLogout(context, logoutRoute)
  }
}

export async function handleLogout(context, logoutRoute) {
  await context.$router.push(logoutRoute ?? '/logout')
  await context.$store.dispatch('user/clear')
  resetServices()
  socket.disconnect()
}

function resetServices() {
  AnalyticsService.reset()
  LoggerService.reset()
  ProductDiscoveryService.reset()
}

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
    return loginResponse.data
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

  logout,

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
