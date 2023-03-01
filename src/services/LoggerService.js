import * as Sentry from '@sentry/browser'

export default {
  noticeError(err, customData) {
    if (window && window.newrelic) window.newrelic.noticeError(err, customData)
    Sentry.captureException(err, customData)
  },
}
