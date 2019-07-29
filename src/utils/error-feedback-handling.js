import * as sentry from "@sentry/browser";

export default {
  // Handling for errors where it is desired to show the feedback form
  captureExceptionWithFeedback: function(context, err) {
    sentry.withScope(function(scope) {
      scope.addEventProcessor(function(event) {
        if (context) {
          context.eventId = err.sentryEventId || event.event_id;
        }
        sentry.showReportDialog({ eventId: self.eventId });

        return event;
      });
      sentry.captureException(err);
    });
  }
};
