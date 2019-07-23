import * as sentry from '@sentry/browser'

export default {
  mounted () {
    this.$on('async-error', function (err) {
      this.captureError(err)
    })
  },
  data () {
    return {
      error: null,
      eventId: null,
    }
  },
  methods: {
    captureError (err) {
      var self = this
      this.error = err

      sentry.withScope(function (scope) {
        scope.addEventProcessor(function (event) {
          self.eventId = err.sentryEventId || event.event_id
          sentry.showReportDialog({ eventId: self.eventId })

          return event
        })
        sentry.captureException(err)
      })
    }
  },
  errorCaptured (err, vm, info) {
    this.captureError (err)
    return false
  },
  render () {
    return this.$scopedSlots.default({
      error: this.error,
      eventId: this.eventId
    })
  }
}
