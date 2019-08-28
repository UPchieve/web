/**
 * Get an Error object from a JSON error response,
 * and add the Sentry event ID if it exists
 */

module.exports = function(res) {
  let err;
  if (res.data && res.data.err) {
    err = Object.assign(new Error(), res.data.err);
    err.sentryEventId = res.data.sentryEventId;
  } else if (res.body && res.body.err) {
    err = Object.assign(new Error(), res.body.err);
    err.sentryEventId = res.body.sentryEventId;
  } else {
    err = new Error(`Unknown server error: ${res.status}`);
    err.status = res.status;
  }
  return err;
};
