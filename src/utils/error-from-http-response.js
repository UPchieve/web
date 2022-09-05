/**
 * Create an error object from an HTTP response
 */

export default function(resp) {
  if (resp.data && resp.data.err) {
    const err = new Error(resp.data.err)
    err.status = resp.status
    return err
  } else {
    return resp
  }
}
