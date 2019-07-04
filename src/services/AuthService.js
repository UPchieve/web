import Validator from 'validator'

import router from '../router'

import NetworkService from './NetworkService'

import * as sentry from '@sentry/browser'

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

        if (redirect) {
          router.push(redirect)
        }
      },
      res => {
        context.error = 'Could not login'
        console.log(res)

        if (res.status !== 401 && res.status !== 0 && res.data) {
          throw res.data.err
        }
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
          throw data.err
        }

        this.storeUser(data.user)

        context.msg = 'You have been signed up!'

        if (redirect) {
          setTimeout(() => {
            router.push(redirect)
          }, 2000)
        }
      }
    ).catch(
      err => {
        if (err.data) {
          throw err.data.err
        }
      }
    )
  },

  checkRegister (context, creds) {
    return NetworkService.checkRegister(context, creds).then(res => {
      if (res.data.err) {
        throw new Error(res.data.err)
      }
    }).catch(err => {
      if (err.data) {
        throw err.data.err
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
    }).catch(err => {
      if (err.data) {
        throw err.data.err
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
    }).catch(err => {
      if (err.data) {
        throw err.data.err
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
        sentry.captureException(e)
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
        if (err.status === 401) {
          this.user.authenticated = false
          this.user.data = null
        } else {
          if (err.status && err.status !== 0) {
            throw err.data.err
          }
          console.log(err)
        }
      })
  }
}
