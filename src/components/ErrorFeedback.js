import * as sentry from "@sentry/browser";

export default {
  mounted() {
    // the async-error event is used to capture exceptions that occur
    // in promises, which are not by default handled by errorCaptured
    this.$on("async-error", function(err) {
      this.captureError(err);
    });
  },
  data() {
    return {
      error: null,
      eventId: null
    };
  },
  methods: {
    captureError(err) {
      this.error = err;

      let self = this;
      sentry.withScope(function(scope) {
        scope.addEventProcessor(function(event) {
          self.eventId = err.sentryEventId || event.event_id;
          // the err.breaking property is added by our app to distinguish errors
          // that break usability
          if (err.breaking) {
            sentry.showReportDialog({ eventId: self.eventId });
          }
          return event;
        });
        sentry.captureException(err);
      });
    }
  },
  errorCaptured(err) {
    this.captureError(err);
    return false;
  },
  render() {
    return this.$scopedSlots.default({
      error: this.error,
      eventId: this.eventId
    });
  }
};
