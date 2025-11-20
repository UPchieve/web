import { isNavigationFailure, NavigationFailureType } from 'vue-router'
import { isSocketDisconnectError } from '../utils/custom-error-handlers'

const newrelic = window.newrelic

export default class LoggerService {
  static init() {
    if (!newrelic) return

    newrelic.setErrorHandler(function (err: any) {
      if (isNavigationFailure(err, NavigationFailureType.cancelled)) {
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
        return {
          group: 'SocketError: Socket.io connection for user disconnected.',
        }
      } else {
        return false
      }
    })
  }

  static identify(userId: string) {
    if (newrelic) {
      newrelic.setUserId(userId)
    }
  }

  static log(message: string, customData?: object) {
    if (newrelic) {
      newrelic.log(message, { customAttributes: customData, level: 'info' })
    } else {
      // eslint-disable-next-line no-console
      console.log(message, customData)
    }
  }

  static info(message: string, customData?: object) {
    if (newrelic) {
      newrelic.log(message, { customAttributes: customData, level: 'info' })
    } else {
      // eslint-disable-next-line no-console
      console.info(message, customData)
    }
  }

  static noticeError(err: unknown, customData?: unknown) {
    if (newrelic) {
      newrelic.noticeError(err, customData)
      newrelic.log(err, { customAttributes: customData, level: 'error' })
    } else {
      // eslint-disable-next-line no-console
      console.error(err, customData)
    }
  }

  static reset() {
    if (newrelic) {
      newrelic.setUserId(null)
    }
  }
}
