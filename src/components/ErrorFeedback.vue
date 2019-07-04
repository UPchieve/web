<template>
  <div>
    <slot></slot>
  </div>
</template>

<script>
import * as sentry from '@sentry/browser'

export default {
  mounted () {
    this.$on('async-error', function (err) {
      this.captureError(err)
    })
  },
  data () {
    return {
      error: false,
      eventId: null,
    }
  },
  methods: {
    captureError (err) {
      var self = this
      this.error = err

      sentry.withScope(function (scope) {
        scope.addEventProcessor(function (event) {
          self.eventId = event.event_id
          console.log(self.eventId)
          sentry.showReportDialog({ eventId: self.eventId })

          return event
        })
        sentry.captureException(err)
      })
    }
  },
  errorCaptured (err, vm, info) {
    captureError (err)
    return false
  }
}
</script>
