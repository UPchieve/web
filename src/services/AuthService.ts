import isEmail from 'validator/lib/isEmail'
import errorFromHttpResponse from '../utils/error-from-http-response'
import AnalyticsService from './AnalyticsService'
import LoggerService from './LoggerService'
import NetworkService from './NetworkService'
import { socket } from '@/socket'
import type { AuthPayload } from '@/contracts/auth'

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
  async login(creds: AuthPayload) {
    const { email, password } = creds
    if (!email || !password || !isEmail(email) || password.length < 1) {
      return Promise.reject('Invalid login form submission')
    }

    const { user } = await NetworkService.login(creds)
    if (!user) {
      throw new Error('No user returned from auth service')
    }
    return user
  },

  async registerStudent(signupData: any) {
    try {
      await NetworkService.registerStudent(signupData)
    } catch (e) {
      throw errorFromHttpResponse(e)
    }
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
