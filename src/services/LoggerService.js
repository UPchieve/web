import * as Sentry from '@sentry/browser'

export default {
  noticeError(err) {
    if (window && window.newrelic) window.newrelic.noticeError(err)
    Sentry.captureException(err)
  },
}
