import NetworkService from './NetworkService'

function _errHandler(/* err */) {
  // console.error(new Error("Unable to check if message is clean"));
  // console.log(err);
  return true
}

export default {
  async checkIfMessageIsClean({ message, sessionId, source }) {
    return NetworkService.checkIfMessageIsClean({
      message,
      sessionId,
      source,
    }).then(
      (res) => {
        if ('err' in res.data) {
          return _errHandler(res.data)
        } else {
          return res.data.isClean
        }
      },
      (err) => {
        return _errHandler(err)
      }
    )
  },
  async checkIfImageIsClean(formData) {
    const res = await NetworkService.checkIfImageIsClean(formData)
    return res.data
  },

  async checkIfVideoFrameIsClean(formData) {
    const res = await NetworkService.checkIfVideoFrameIsClean(formData)
    return res.data
  },
}
