import Vue from 'vue'
import * as Sentry from '@sentry/browser'
import { Vue as IVue } from '@sentry/integrations'
import config from '../config'

const newrelic = window.newrelic

class LoggerService {
  static init() {
    if (config.sentryDsn) {
      // Set up Sentry error tracking
      Sentry.init({
        // Our Sentry project is configured to only accept calls from app.upchieve.org
        dsn: config.sentryDsn,
        integrations: [
          new IVue({ Vue, attachProps: true, logErrors: true }),
        ],
        environment: config.sentryEnv,
        release: `uc-web@${config.version}`,
        // This error gets sent to Sentry when a session with a document editor
        // that has text in it has ended. This error is usually sent continuously
        // to Sentry until the browser is refreshed. This quickly eats up all of
        // our monthly ingest quota.
        // TODO: Figure out why this error is thrown when redirected to the dashboard
        //       or feedback page for sessions with a filled document editor
        ignoreErrors: ['ResizeObserver'],
      })
    }
  }

  static identify(userId) {
    if (newrelic) newrelic.setUserId(userId)
    Sentry.setUser({ id: userId })
  }

  static noticeError(err, customData) {
    if (window && window.newrelic) window.newrelic.noticeError(err, customData)
    Sentry.captureException(err, customData)
  }

  static reset() {
    if (newrelic) newrelic.setUserId(null)
    Sentry.setUser(null)
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
    case 'development':
      return DevLoggerService
    default:
      return LoggerService
  }
}

const service = getLoggerService()
export default service
