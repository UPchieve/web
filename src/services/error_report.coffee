map = require 'lodash/map'

config = require '../config'

stringifyError = (error) ->
  errorString = try
    JSON.stringify error
  catch
    ''

  try
    JSON.stringify
      message: error.message or errorString or String error
      stack: error.stack or error.error?.stack or '' # ErrorEvent
  catch
    String error

class ErrorReportService
  report: (errors...) ->
    # Remove the circular dependency within error objects
    errors = map errors, stringifyError

    errorStr = JSON.stringify errors.join ' '
    # window.analytics.trackEvent 'error', 'js', errorStr

module.exports = new ErrorReportService()
