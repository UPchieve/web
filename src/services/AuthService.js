import Validator from 'validator'

import router from '../router'

import NetworkService from './NetworkService'
import AnalyticsService from './AnalyticsService'

const USER_FETCH_LIMIT_SECONDS = 5

export default {
  user: {
    authenticated: false,
    data: null,
    lastFetch: 0
  },

  login (context, creds, redirect) {
    const { email, password } = creds
    if (
      !email ||
      !password ||
      !Validator.isEmail(email) ||
      password.length < 1
    ) {
      return undefined
    }

    return NetworkService.login(context, creds).then(
      res => {
        const data = { ...res.data }
        if (!data) {
          throw new Error('No user returned from auth service')
        }

        this.storeUser(data.user)

        //analytics: tracking when a user has logged in
        AnalyticsService.identify(this.user.data, this.user.data.fakeUser)
        AnalyticsService.trackNoProperties('logged in', this.user.data, this.user.data.fakeUser)

        if (redirect) {
          router.push(redirect)
        }
      },
      res => {
        context.error = 'Could not login'
        console.log(res)
      }
    )
  },

  register (context, creds, profile, redirect) {
    return NetworkService.register(context, { ...creds, ...profile }).then(
      res => {
        const data = { ...res.data }
        console.log(data)
        if (!data) {
          throw new Error('No user returned from auth service')
        } else if (data.err) {
          throw new Error(data.err)
        }

        this.storeUser(data.user)

        context.msg = 'You have been signed up!'

        if (redirect) {
          setTimeout(() => {
            router.push(redirect)
          }, 2000)
        }
      }
    )
  },

  checkRegister (context, creds) {
    return NetworkService.checkRegister(context, creds).then(res => {
      if (res.data.err) {
        throw new Error(res.data.err)
      }
    })
  },

  sendReset (context, email, redirect) {
    return NetworkService.sendReset(context, { email }).then(res => {
      const data = { ...res.data }
      console.log(data)
      if (!data) {
        throw new Error('No user returned from auth service')
      }
      if (data.err) {
        throw new Error(data.err)
      }

      context.msg = 'Password reset email has been sent!'

      if (redirect) {
        setTimeout(() => {
          router.push(redirect)
        }, 2000)
      }
    })
  },

  confirmReset (context, credentials, redirect) {
    return NetworkService.confirmReset(context, credentials).then(res => {
      const data = { ...res.data }
      console.log(data)
      if (!data) {
        throw new Error('No user returned from auth service')
      } else if (data.err) {
        console.log(data.err.message)
        throw new Error(data.err)
      }

      context.msg = 'Password has been reset!'

      if (redirect) {
        setTimeout(() => {
          router.push(redirect)
        }, 2000)
      }
    })
  },

  logout (context) {
    if (context) {
      NetworkService.logout(context)
        .then(() => {
          this.removeUser()
          router.push('/logout')
        })
        .catch(() => {
          this.removeUser()
          router.push('/logout')
        })
    } else {
      this.removeUser()
    }
  },

  checkAuth (context) {
    const user = localStorage.getItem('user')
    if (user) {
      try {
        this.user.data = JSON.parse(user)
        this.user.authenticated = true
      } catch (e) {
        this.logout() // Error in LocalStorage, so logout
      }
    } else {
      this.user.authenticated = false
      this.user.data = null
    }

    if (context && this.shouldFetch()) {
      this.fetchUser(context)
    }
  },

  shouldFetch () {
    return Date.now() - this.user.lastFetch > USER_FETCH_LIMIT_SECONDS * 1000
  },

  storeUser (userObj) {
    this.user.authenticated = true
    this.user.data = userObj
    localStorage.setItem('user', JSON.stringify(userObj))
  },

  removeUser () {
    localStorage.removeItem('user')
    this.user.authenticated = false
    this.user.data = null
  },

  fetchUser (context) {
    this.user.lastFetch = Date.now()

    NetworkService.user(context)
      .then(res => {
        const data = { ...res.data }
        if (!data) {
          throw new Error('No user returned from auth service')
        }

        if (data.user) {
          this.user.authenticated = true
          this.user.data = data.user
          localStorage.setItem('user', JSON.stringify(data.user))
        } else {
          this.user.authenticated = false
          this.user.data = null
        }
      })
      .catch(err => {
        console.log(err)
      })
  }
}
