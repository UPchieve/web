config = require '../config'

TYPES =
  offline: "#{config.APP_NAME} requires an internet connection"
  timeout: 'This is taking longer than normal to load. If you continue having issues,
            please email support@upchieve.org'

$warnUser = (type) ->
  $networkDiv = document.createElement 'div'
  $networkDiv.id = 'network-message'
  $networkDiv.className = 'network-message'
  networkMessage = """
    <h3 class='title'>Whoops!</h3>
    #{TYPES[type]}
    <div class='buttons'>
      <a href='javascript: window.location.reload();' class='retry'>Retry</a>
      <a href="#" onclick="document.getElementById('network-message').style.display = 'none'; return false;" class='hide'>Hide</a>
    </div>
  """
  $networkDiv.innerHTML = networkMessage
  return $networkDiv

class WarningService
  isOffline: ->
    # navigator.onLine doesn't work inside cordova / android
    if config.PLATFORM is 'native'
      return navigator.connection.type is Connection.NONE
    else
      false

  warnUser: (type) ->
    return $warnUser type

module.exports = new WarningService()
