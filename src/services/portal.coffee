_debounce = require 'lodash/debounce'
PortalGun = require 'portal-gun'
md5 = require 'blueimp-md5'

config = require '../config'
PushNotificationService = require './push_notification'
DeepLinkService = require './deep_link'
WindowService = require './window'

# Native calls need to be done async since some of them block js. If js is
# blocked, portal-gun times out
promiseTimeout = (promise) ->
  new Promise (resolve, reject) ->
    window.requestAnimationFrame ->
      promise.then resolve
      .catch (err) ->
        # window.analytics.trackEvent('portal', 'error', JSON.stringify(err))
        reject err

portal = new PortalGun {useSw: false}

class PortalService
  constructor: ->
    portal.listen()

    @offlineHandler = null
    @onlineHandler = null

    @appPauseHandler = null
    @appResumeHandler = null

    @orientationHandler = null
    @backButtonHandler = null

    @keyboardShowHandler = null
    @keyboardHideHandler = null

  registerMethods: =>
    portal.on 'app.exit', @appExit
    portal.on 'app.exitWithoutAnimation', @appExitWithoutAnimation
    portal.on 'app.isLoaded', @appIsLoaded
    portal.on 'app.triggerRepaint', @appTriggerRepaint
    portal.on 'app.getDeviceId', @appGetDeviceId
    portal.on 'app.onPause', @appOnPause
    portal.on 'app.onResume', @appOnResume
    portal.on 'app.onBack', @appOnBack
    portal.on 'app.rate', @appRate

    portal.on 'share.any', @shareAny
    portal.on 'share.multi', @shareAny

    portal.on 'keyboard.show', @keyboardShow
    portal.on 'keyboard.close', @keyboardClose
    portal.on 'keyboard.onShow', @keyboardOnShow
    portal.on 'keyboard.onHide', @keyboardOnHide
    portal.on 'keyboard.disableScroll', @keyboardDisableScroll
    portal.on 'keyboard.hideAccessoryBar', @keyboardHideAccessoryBar
    portal.on 'keyboard.showAccessoryBar', @keyboardShowAccessoryBar

    portal.on 'launcher.check', @launcherCheck
    portal.on 'launcher.launch', @launcherLaunch

    portal.on 'intents.start', @intentsStart

    portal.on 'orientation.lock', @orientationLock
    portal.on 'orientation.unlock', @orientationUnlock
    portal.on 'orientation.get', @orientationGet
    portal.on 'orientation.onChange', @orientationOnChange

    portal.on 'networkInformation.onOnline', @networkInformationOnOnline
    portal.on 'networkInformation.onOffline', @networkInformationOnOffline
    portal.on 'networkInformation.getType', @networkInformationGetType

    portal.on 'push.register', @pushRegister
    portal.on 'push.subscribeToTopic', @pushSubscribeToTopic
    portal.on 'push.getBadgeNumber', @pushGetBadgeNumber
    portal.on 'push.setBadgeNumber', @pushSetBadgeNumber
    portal.on 'push.getHasPermission', @pushGetHasPermission
    portal.on 'push.onData', @pushOnData
    portal.on 'push.registerAction', @pushRegisterAction

    portal.on 'top.getData', @topGetData
    portal.on 'top.onData', @topOnData
    portal.on 'top.clearEventListeners', @topClearEventListeners

    portal.on 'browser.openWindow', @browserOpenWindow
    portal.on 'browser.closeWindow', @browserCloseWindow
    portal.on 'browser.show', @browserShow
    portal.on 'browser.reply', @browserReply

    portal.on 'deepLink.getPath', @deepLinkGetPath
    portal.on 'deepLink.onRoute', @deepLinkOnRoute

    portal.on 'geolocation.getCurrentPosition', @geolocationGetCurrentPosition

    portal.on 'permissions.check', @permissionsCheck
    portal.on 'permissions.request', @permissionsRequest

    portal.on 'statusBar.setOverlaysWebview', @statusBarSetOverlaysWebview
    portal.on 'statusBar.setBackgroundColor', @statusBarSetBackgroundColor
    portal.on 'statusBar.hide', @statusBarHide
    portal.on 'statusBar.show', @statusBarShow
    portal.on 'statusBar.getIsVisible', @statusBarGetIsVisible

  appExit: ->
    setTimeout ->
      navigator.app.exitApp()
    , 0
    return null

  appExitWithoutAnimation: ->
    setTimeout ->
      window.plugins.exit.exitWithoutAnimation()
    , 0
    return null

  appIsLoaded: ->
    setTimeout ->
      window.navigator.splashscreen.hide()
      # document.body.style.background = '#171a1c'
      if cordova.platformId is 'android'
        window.SpinnerPlugin.activityStop()
        # window.plugins.spinnerDialog.hide()
    , 0
    return null

  appTriggerRepaint: ->
    # trigger repaint
    document.body.style.display = 'none'
    document.body.offsetHeight
    document.body.style.display = 'block'

  appGetDeviceId: ->
    promiseTimeout new Promise (resolve, reject) ->
      onSuccess = ({adId, idfa, limitAd}) ->
        adId ?= idfa # seems to be idfa for iOS, adId for android
        if limitAd or not adId
          resolve device.uuid
        else
          resolve adId
      onFail = (err) ->
        resolve device.uuid
      window.androidIDFA.getAdInfo onSuccess, onFail

  appOnPause: (callback) =>
    # only allow 1 handler, otherwise if child page refreshes, it could fire
    # many times for pause/resume events
    if @appPauseHandler
      document.removeEventListener 'pause', @appPauseHandler

    @appPauseHandler = ->
      callback() # passing listener params leads to circular structure

    document.addEventListener 'pause', @appPauseHandler

    return null

  appOnResume: (callback) =>
    # only allow 1 handler, otherwise if child page refreshes, it could fire
    # many times for pause/resume events
    if @appResumeHandler
      document.removeEventListener 'resume', @appResumeHandler

    @appResumeHandler = ->
      callback() # passing listener params leads to circular structure

    document.addEventListener 'resume', @appResumeHandler

    return null

  appOnBack: (callback) =>
    # only allow 1 handler, otherwise if child page refreshes, it could fire
    # many times for pause/resume events
    if @backButtonHandler
      document.removeEventListener 'backbutton', @backButtonHandler

    @backButtonHandler = ->
      callback() # passing listener params leads to circular structure

    document.addEventListener 'backbutton', @backButtonHandler

    return null

  appRate: ->
    # if cordova.platformId is 'ios'
    #   window.appId = config.IOS_APP_ID
    # else
    #   window.appId = config.PACKAGE_KEY
    promiseTimeout(
      new Promise (resolve, reject) ->
        if LaunchReview.isRatingSupported()
          timeout = setTimeout ->
            reject()
          , 5000
          onRate = (status) ->
            if status is 'shown'
              clearTimeout timeout
              resolve()
          LaunchReview.rating onRate, reject
        else
          LaunchReview.launch resolve, reject
    )

  # combines push, message, deeplink data
  topGetData: ->
    start = Date.now()
    promiseTimeout(
      Promise.all [
        Promise.resolve DeepLinkService.getUrlParts()
        Promise.resolve PushNotificationService.getPushData()
      ]
      .then ([deepLinkUrlParts, pushData]) ->
        # FIXME: we need some sort of cleanup when the page is refreshed, but it
        # needs to be onbeforeunload. with what we're doing below, subsequent
        # getData and getMessage calls are null, when it should remain for the
        # session. if we do it onpageload, it clears the current message, which
        # breaks everything
        #
        # clear, so if child frame is refreshed, it doesn't re-grab same data
        # window.plugins.messenger.clearMessage()
        DeepLinkService.clearUrlParts()
        PushNotificationService.clearPushData()

        pushData or= {}

        # priority is pushData > message > path
        data = pushData
        data.path or= deepLinkUrlParts?.path
        data.query = deepLinkUrlParts?.query

        return data
      .catch (err) ->
        console.log err
    )

  # if child frame is reloaded, we should kill all the native listeners we have
  topClearEventListeners: ->
    window.plugins.messenger.clearEventListeners()
    DeepLinkService.clearEventListeners()
    PushNotificationService.clearEventListeners()
    _document.removeEventListener 'pause', onPause

  topOnData: (callback) =>
    # @messengerOnMessage (messageData) ->
    #   messageData?._isMessage = true
    #   callback messageData
    @deepLinkOnRoute ({path, query}) ->
      callback {path, query, _isDeepLink: true}
    @pushOnData (messageData) ->
      messageData?._isPush = true
      callback messageData

  permissionsCheck: ({permissions}) ->
    promiseTimeout new Promise (resolve, reject) ->
      window.plugins.Permission.has permissions, resolve, reject

  permissionsRequest: ({permissions}) ->
    promiseTimeout new Promise (resolve, reject) ->
      window.plugins.Permission.request permissions, resolve, reject

  geolocationGetCurrentPosition: ({options}) ->
    promiseTimeout new Promise (resolve, reject) ->
      navigator.geolocation.getCurrentPosition resolve, reject, options
  #
  # NATIVE SHARE
  #

  shareAny: ({url, text, imageUrl}) ->
    if url
      if text then text += ' '
      text += url
    window.plugins.socialsharing.share text, config.APP_NAME, imageUrl

  #
  # BROWSER
  #

  browserOpenWindow: (options, callback) =>
    {url, target, options, executeJs, closeAfterExecute} = options
    target ?= '_blank'
    resolveTimeout = 10000 # 10s
    promiseTimeout new Promise (resolve, reject) =>
      # max 1 open
      @iabWindow?.close()
      @iabWindow = cordova.ThemeableBrowser.open url, target, options
      # @iabWindow.addEventListener 'exit', =>
      #   @iabWindow = null
      if executeJs
        timeout = setTimeout resolve, resolveTimeout
        @iabWindow.addEventListener 'loadstop', _debounce =>
          @iabWindow.executeScript {code: executeJs}, (response) =>
            clearTimeout timeout
            resolve response
            if closeAfterExecute
              @iabWindow?.close()
        , {wait: 500, maxWait: 8000}
      else
        resolve()

      portal.setInAppBrowserWindow @iabWindow, callback
    , 0

  browserCloseWindow: =>
    @iabWindow?.close()

  browserShow: =>
    @iabWindow?.show()

  browserReply: ({data}) ->
    setTimeout ->
      portal.replyInAppBrowserWindow data
    , 0
    return null

  #
  # KEYBOARD
  #

  keyboardShow: ->
    setTimeout ->
      cordova.plugins.Keyboard.show()
    , 0
    return null

  keyboardClose: ->
    setTimeout ->
      cordova.plugins.Keyboard.close()
    , 0
    return null

  keyboardDisableScroll: ->
    setTimeout ->
      cordova.plugins.Keyboard.disableScroll()
    , 0
    return null

  keyboardHideAccessoryBar: ->
    setTimeout ->
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar true
    , 0
    return null

  keyboardShowAccessoryBar: ->
    setTimeout ->
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar false
    , 0
    return null

  keyboardOnShow: (callback) ->
    # only allow 1 handler, otherwise if child page refreshes, it could fire
    # many times for keyboard events
    if @keyboardShowHandler
      window.removeEventListener 'native.keyboardshow', @keyboardShowHandler

    @keyboardShowHandler = (e) ->
      # passing listener params leads to circular structure
      callback {keyboardHeight: e.keyboardHeight}

    window.addEventListener 'native.keyboardshow', @keyboardShowHandler

    return null

  keyboardOnHide: (callback) ->
    # only allow 1 handler, otherwise if child page refreshes, it could fire
    # many times for keyboard events
    if @keyboardHideHandler
      document.removeEventListener 'native.keyboardshow', @keyboardHideHandler

    @keyboardHideHandler = ->
      # passing listener params leads to circular structure
      callback()

    document.addEventListener 'native.keyboardhide', @keyboardHideHandler

    return null

  #
  # NETWORK
  #

  networkInformationOnOnline: (callback) =>
    # only allow 1 handler, otherwise if child page refreshes, it could fire
    # many times for offline/offline events
    if @onlineHandler
      document.removeEventListener 'online', @onlineHandler

    @onlineHandler = ->
      callback() # passing listener params leads to circular structure

    document.addEventListener 'online', @onlineHandler

    return null

  networkInformationOnOffline: (callback) =>
    # only allow 1 handler, otherwise if child page refreshes, it could fire
    # many times for online/offline events
    if @offlineHandler
      document.removeEventListener 'offline', @offlineHandler

    @offlineHandler = ->
      callback() # passing listener params leads to circular structure

    document.addEventListener 'offline', @offlineHandler
    return null

  networkInformationGetType: ->
    return navigator.connection.type

  #
  # LAUNCHER
  #

  launcherCheck: ({options}) ->
    promiseTimeout new Promise (resolve, reject) ->
      window.plugins.launcher.canLaunch options, resolve, reject

  launcherLaunch: ({options}) ->
    promiseTimeout new Promise (resolve, reject) ->
      window.plugins.launcher.launch options, resolve, reject

  #
  # INTENTS
  #

  intentsStart: ({action, url, type, extras, packageName}) ->
    setTimeout ->
      window.plugins.webintent.startActivity {
        action: window.plugins.webintent[action]
        url: url
        type: type
        packageName: packageName
        extras: extras
      }, (-> null), ((err) -> throw new Error err)
    , 0
    return null

  #
  # ORIENTATION
  #
  orientationLock: ({orientation}) ->
    screen.lockOrientation(orientation)
    null

  orientationUnlock: ->
    screen.unlockOrientation()
    null

  orientationGet: ->
    screen.orientation

  orientationOnChange: (callback) =>
    # only allow 1 handler, otherwise if child page refreshes, it could fire
    # many times for offline/offline events
    if @orientationHandler
      document.removeEventListener 'orientationchange', @orientationHandler

    @orientationHandler = ->
      callback? screen.orientation

    document.addEventListener 'orientationchange', @orientationHandler

    return null

  #
  # PUSH NOTIFICATIONS
  #

  pushRegister: ->
    isTokenStored = Boolean PushNotificationService.token
    if isTokenStored
      Promise.resolve {token: PushNotificationService.token}
    else
      promiseTimeout PushNotificationService.register().catch (err) ->
        console.log 'push error', err
        null

  pushSubscribeToTopic: ({topic}) ->
    promiseTimeout PushNotificationService.subscribeToTopic topic

  pushGetHasPermission: ->
    promiseTimeout PushNotificationService.getHasPermission()

  pushSetBadgeNumber: ({number}) ->
    promiseTimeout PushNotificationService.setBadgeNumber number

  pushGetBadgeNumber: ->
    promiseTimeout PushNotificationService.getBadgeNumber()

  pushOnData: (callback) ->
    PushNotificationService.onPushData callback
    return null

  pushRegisterAction: ({action}, callback) ->
    PushNotificationService.registerAction {action}, callback
    return null

  #
  # DEEP LINK
  #

  deepLinkGetPath: ->
    promiseTimeout DeepLinkService.getUrlParts()?.path

  deepLinkOnRoute: (fn) ->
    DeepLinkService.onRoute {fn}
    return null

  #
  # STATUS BAR
  #

  statusBarSetOverlaysWebview: ({overlaysWebview}) ->
    StatusBar.overlaysWebView overlaysWebview # iOS only
    null

  statusBarSetBackgroundColor: ({color}) ->
    StatusBar.backgroundColorByHexString color
    null

  statusBarHide: ->
    StatusBar.hide()
    null

  statusBarShow: ->
    StatusBar.show()
    null

  statusBarGetIsVisible: ->
    StatusBar.isVisible



module.exports = new PortalService()
