require './polyfill'

config = require './config'
ErrorReportService = require './services/error_report'
WarningService = require './services/warning'
PortalService = require './services/portal'
CookieService = require './services/cookie'
PushNotificationService = require './services/push_notification'
WindowService = require './services/window'
request = require './lib/request'

HIDE_SPLASH_SCREEN_DELAY_MS = 6000
LOAD_TIMEOUT_MS = 30000
MAX_SPINNER_TIME_MS = 3000
EXTERNAL_URL = config.APP_URL

isiOS = cordova?.platformId is 'ios'
iOSVersion = parseInt(navigator.userAgent.match(/OS ((\d+_?){2,3})\s/)?[1])


# HACK to get orientation changing to work properly on iOS
# without this, rotating to landscape gives portrait viewport, rotating back
# to portrait gives landscape viewport. WKWebview bug? Or cordova WKWebview bug
if isiOS and iOSVersion <= 8
  window.addEventListener 'orientationchange', ->
    viewport = document.querySelector("meta[name=viewport]")
    viewport.setAttribute('content', 'initial-scale=1.01, width=device-width, minimum-scale=1.01, maximum-scale=1.0, user-scalable=1, minimal-ui')
    setTimeout ->
      viewport.setAttribute('content', 'initial-scale=1.0, width=device-width, minimum-scale=1.0, maximum-scale=1.0, user-scalable=0, minimal-ui')
    , 250

onDeviceReady = ->
  # if WarningService.isOffline()
  #   document.body.appendChild WarningService.warnUser 'offline'
  # else
  loadApp EXTERNAL_URL

  # if config.PLATFORM is 'native'
  #   window.analytics.startTrackerWithId config.GA_ID
  #   window.analytics.trackView 'home'

loadApp = (url) ->
  console.log 'load', url
  $iframe = document.createElement 'iframe'
  WindowService.setIframe $iframe
  $iframe.src = url
  $iframe.className = 'iframe'
  $iframe.id = 'iframe'
  $iframe.setAttribute 'allow', 'geolocation; autoplay; picture-in-picture; vertical-scroll; animations; sync-xhr; sync-script; image-compression; legacy-image-formats; max-downscaling-image; unsized-media; accelerometer; camera; encrypted-media; fullscreen; gyroscope; magnetometer; microphone; midi; payment; speaker; usb; vr'
  $iframe.setAttribute 'allowfullscreen', ''

  loadTimeout = setTimeout ->
    document.body.appendChild WarningService.warnUser 'timeout'
  , LOAD_TIMEOUT_MS

  $iframe.addEventListener 'load', ->
    setTimeout -> # fix occasional black screen splash?
      window.navigator.splashscreen.hide()
    , 0
    if cordova.platformId is 'android'
      window.SpinnerPlugin.activityStart null, {dimBackground: false}
      # should hide in app.isLoaded, but just in case...
      setTimeout ->
        window.SpinnerPlugin.activityStop()
      , MAX_SPINNER_TIME_MS

      # window.plugins.spinnerDialog.show null, null, ->
      #   window.plugins.spinnerDialog.hide()
    clearTimeout loadTimeout
    $$warning = document.getElementById('network-message')
    $$warning.parentNode.removeChild($$warning)

  document.body.appendChild $iframe

  # give it some time to load before hiding splash. we also
  # try to hide it via portal-gun. this is a fallback in-case that fails

  # setTimeout ->
  #   PortalService.appIsLoaded()
  # , HIDE_SPLASH_SCREEN_DELAY_MS

  PortalService.registerMethods()

setTimeout ->
  document.body.className += ' is-loaded'

window.addEventListener 'error', ErrorReportService.report

# push notification action fns are stored here from portal.coffee
window.app = {pushActions: {}}

# iOS doesn't allow 3rd party cookies. This means cookies in iframes don't work.
# The solution is to redirect to the iframe url and set a cookie, then
# redirect back here
if window.location.href.indexOf('?redirected') isnt -1
  CookieService.set 'iframe_cookie_set', '1'

iOSVersion = parseInt(navigator.userAgent.match(/OS ((\d+_?){2,3})\s/)?[1])
if isiOS and iOSVersion >= 8 and not CookieService.get 'iframe_cookie_set'
  getCookiePerms = ->
    matches = EXTERNAL_URL.match /^https?\:\/\/([^\/?#]+)/i
    base = matches?[0]
    if base
      window.location.href = "#{base}/setcookie?redirect_url=" +
                   encodeURIComponent("#{window.location.href}?redirected")
  document.addEventListener 'deviceready', getCookiePerms, false
else if config.PLATFORM is 'native'
  document.addEventListener 'deviceready', onDeviceReady, false
else
  onDeviceReady()

# prevent drag-down to scroll
window.addEventListener 'touchmove', (e) ->
  e.preventDefault()

if cordova?.platformId is 'android'
  # android webview doesn't flush/save cookies super often
  document.addEventListener 'pause', ->
    cookieManager.flush()
