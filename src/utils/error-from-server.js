/**
 * Get an Error object from a JSON error response,
 * and add the Sentry event ID if it exists
 */

module.exports = function(res) {
  var err = Object.assign(new Error(), res.data.err);
  err.sentryEventId = res.data.sentryEventId;
  return err;
};
