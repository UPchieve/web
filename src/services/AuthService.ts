import isEmail from 'validator/lib/isEmail'
import errorFromHttpResponse from '../utils/error-from-http-response'
import AnalyticsService from './AnalyticsService'
import LoggerService from './LoggerService'
import NetworkService from './NetworkService'
import { socket } from '@/socket'

export async function logout(
  context: { $store: any; $router: any },
  logoutRoute: string
) {
  try {
    await NetworkService.logout()
  } finally {
    await handleLogout(context, logoutRoute)
  }
}

export async function handleLogout(
  context: { $store: any; $router: any },
  logoutRoute: string
) {
  await context.$store.dispatch('user/clear')
  resetServices()
  socket.disconnect()
  await context.$router.push(logoutRoute ?? '/logout')
}

export function getStatus() {
  return NetworkService.authStatus()
}

function resetServices() {
  AnalyticsService.reset()
  LoggerService.reset()
}

export default {
  async login(creds: { email: string; password: string }) {
    const { email, password } = creds
    if (!email || !password || !isEmail(email) || password.length < 1) {
      return Promise.reject('Invalid login form submission')
    }

    const loginResponse = await NetworkService.login(creds)
    if (!('data' in loginResponse)) {
      throw new Error('No user returned from auth service')
    }
    return loginResponse.data
  },

  async registerOpenVolunteer(signupData: any) {
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

  async registerPartnerVolunteer(signupData: any) {
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

  async registerStudent(signupData: any) {
    try {
      await NetworkService.registerStudent(signupData)
    } catch (e) {
      throw errorFromHttpResponse(e)
    }
  },

  async checkRegister(creds: any) {
    return NetworkService.checkRegister(creds).catch((res) => {
      throw errorFromHttpResponse(res)
    })
  },

  async sendReset(
    context: { msg: any; $router: any },
    email: string,
    redirect: string
  ) {
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

  async confirmReset(
    context: { $router: any },
    credentials: any,
    redirect: string
  ) {
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

  async initiateVerification(data: any) {
    return NetworkService.sendVerification(data).catch((err) => {
      throw errorFromHttpResponse(err)
    })
  },

  async confirmVerification(data: any) {
    return NetworkService.confirmVerification(data).catch((err) => {
      throw errorFromHttpResponse(err)
    })
  },

  logout,
}
