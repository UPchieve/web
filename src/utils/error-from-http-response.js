/**
 * Create an error object from an HTTP response
 */

// TODO: Utilize this method for all HTTP error responses.
// Not all response errors are wrapped in this method.
// With the switch to axios, `data` is no longer a field of the error response object.
// Returning just the response is okay - downstream has been updated to capture the
// error message/status appropriately.
export default function(resp) {
  if (resp.data && resp.data.err) {
    const err = new Error(resp.data.err)
    err.status = resp.status
    return err
  }

  return resp
}
