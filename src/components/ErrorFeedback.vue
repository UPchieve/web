<template>
  <div class="error-boundary-div">
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
    return this.$slots.default[0]
  }
}
</script>

<style lang="scss" scoped>
.error-boundary-div {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;

  > * {
    flex-grow: 1;
  }
}
</style>
