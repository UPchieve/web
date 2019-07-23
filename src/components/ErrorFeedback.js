import * as sentry from '@sentry/browser'

import feedbackHandler from '@/utils/error-feedback-handling'

export default {
  mounted () {
    this.$on('async-error', function (err) {
      this.captureError(err)
    })
  },
  data () {
    return {
      error: null,
      eventId: null
    }
  },
  methods: {
    captureError (err) {
      this.error = err
      feedbackHandler.captureExceptionWithFeedback(this, err)
    }
  },
  errorCaptured (err, vm, info) {
    this.captureError(err)
    return false
  },
  render () {
    return this.$scopedSlots.default({
      error: this.error,
      eventId: this.eventId
    })
  }
}
