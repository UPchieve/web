import NetworkService from './NetworkService'

function _errHandler(/* err */) {
  // console.error(new Error("Unable to check if message is clean"));
  // console.log(err);
  return true
}

export default {
  checkIfMessageIsClean(data) {
    return NetworkService.checkIfMessageIsClean({
      content: data,
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
}
