import NetworkService from './NetworkService'

function _errHandler(/* err */) {
  // console.error(new Error("Unable to check if message is clean"));
  // console.log(err);
  return true
}

export default {
  checkIfMessageIsClean(context, data) {
    return NetworkService.checkIfMessageIsClean(context, {
      content: data
    }).then(
      res => {
        if ('err' in res.body) {
          return _errHandler(res.body)
        } else {
          return res.body.isClean
        }
      },
      err => {
        return _errHandler(err)
      }
    )
  }
}
