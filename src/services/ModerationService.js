import NetworkService from "./NetworkService";

function _errHandler(context, err) {
  if (
    (!err.body || !err.body.sentryEventId) &&
    err.status !== 0 &&
    err.status !== 401
  ) {
    context.$parent.$emit("async-error", err.body ? err.body.err : err);
  }

  throw err;
}

export default {
  checkIfMessageIsClean(context, data) {
    return NetworkService.checkIfMessageIsClean(context, {
      content: data
    })
      .then(res => {
        if ("err" in res.body) {
          return _errHandler(context, res);
        } else {
          return res.body.isClean;
        }
      })
      .catch(err => {
        return _errHandler(context, err);
      });
  }
};
