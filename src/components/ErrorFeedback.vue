<template>
  <div>
    <slot></slot>
  </div>
</template>

<script>
import * as sentry from '@sentry/browser'

export default {
  data () {
    return {
      error: false,
      eventId: null,
    }
  },
  errorCaptured (err, vm, info) {
    var self = this
    this.error = err

    sentry.withScope(function (scope) {
      scope.addEventProcessor(function (event) {
        self.eventId = event.event_id
        sentry.showReportDialog({ eventId: self.eventId })

        return event
      })
      sentry.captureException(err)
    })

    return false
  }
}
</script>
