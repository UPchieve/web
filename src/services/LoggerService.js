import config from '../config'
import VueRouter from 'vue-router'
import { isSocketDisconnectError } from '../utils/custom-error-handlers'

const newrelic = window.newrelic
const { isNavigationFailure, NavigationFailureType } = VueRouter

class LoggerService {
  static init() {
    if (!newrelic) return
    newrelic.setErrorHandler(function (err) {
      if (isNavigationFailure(err, NavigationFailureType.redirected)) {
        return {
          group: 'NavigationGuardError: Redirected via a navigation guard.',
        }
      } else if (isNavigationFailure(err, NavigationFailureType.cancelled)) {
        return {
          group:
            'NavigationFailure: Navigation cancelled with a new navigation.',
        }
      } else if (isNavigationFailure(err, NavigationFailureType.duplicated)) {
        return {
          group:
            'NavigationDuplicated: Avoided redundant navigation to current location.',
        }
      } else if (isSocketDisconnectError(err)) {
        return { group: 'SocketError: Socket.io connection for user disconnected.' }
      } else {
        return false
      }
    })
  }

  static identify(userId) {
    if (newrelic) newrelic.setUserId(userId)
  }

  static noticeError(err, customData) {
    if (window && window.newrelic) {
      window.newrelic.noticeError(err, customData)
    }
  }

  static reset() {
    if (newrelic) newrelic.setUserId(null)
  }
}

class DevLoggerService {
  static init() {
    // eslint-disable-next-line no-console
    console.info('LoggerService.init')
  }
  static identify(userId) {
    // eslint-disable-next-line no-console
    console.info('LoggerService.identify', userId)
  }

  static noticeError(err, customData) {
    // eslint-disable-next-line no-console
    console.error('LoggerService.noticeError', err, customData)
  }

  static reset() {
    // eslint-disable-next-line no-console
    console.info('LoggerService.reset')
  }
}

function getLoggerService() {
  switch (config.nodeEnv) {
    case 'test_e2e':
    case 'development':
      return DevLoggerService
    default:
      return LoggerService
  }
}

const service = getLoggerService()
export default service
