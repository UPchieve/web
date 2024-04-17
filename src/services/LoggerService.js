import config from '../config'

const newrelic = window.newrelic

class LoggerService {
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
    case 'development':
      return DevLoggerService
    default:
      return LoggerService
  }
}

const service = getLoggerService()
export default service
