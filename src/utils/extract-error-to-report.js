/**
 * Helper to extract error information to report,
 * whether it is from the server or client,
 * and set the breaking property appropriately
 */

const errorFromServer = require("@/utils/error-from-server");

module.exports = function(err, breakingIfServer, breakingIfClient) {
  let errToReport;
  if ((err.data && err.data.err) || (err.body && err.body.err) || err.status) {
    errToReport = errorFromServer(err);
    errToReport.breaking = breakingIfServer;
  } else {
    errToReport = err;
    errToReport.breaking = breakingIfClient;
  }
  return errToReport;
};
