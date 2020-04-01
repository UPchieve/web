clone = require 'lodash/clone'
forEach = require 'lodash/forEach'

config = require '../config'

PUSH_REGISTER_TIMEOUT_MS = 30000

class PushNotificationService
  constructor: ->
    @token = null
    @pushData = null
    @onPushDataFns = []
    @push = null

  getHasPermission: ->
    new Promise (resolve, reject) ->
      timeout = setTimeout reject, PUSH_REGISTER_TIMEOUT_MS
      window.PushNotification.hasPermission (data) ->
        clearTimeout timeout
        resolve data.isEnabled

  getBadgeNumber: =>
    new Promise (resolve, reject) =>
      unless @push
        reject 'not registered'
      @push.getApplicationIconBadgeNumber resolve, reject

  setBadgeNumber: (number) =>
    new Promise (resolve, reject) =>
      unless @push
        reject 'not registered'
      @push.setApplicationIconBadgeNumber resolve, reject, number

  setContextId: (contextId) =>
    new Promise (resolve, reject) =>
      unless @push
        reject 'not registered'
      @push.setContextId resolve, reject, contextId

  onPushData: (callback) =>
    @onPushDataFns.push callback

  getPushData: =>
    return @pushData

  clearPushData: =>
    @pushData = null

  clearEventListeners: =>
    @onPushDataFns = []

  subscribeToTopic: (topic) =>
    new Promise (resolve, reject) =>
      @push.subscribe topic, resolve, reject

  register: ({iosCategories} = {}) =>
    iosCategories ?= {
      privateMessage:
        # keys MUST be yes, no, or maybe
        yes:
          callback: 'app.pushActions.reply'
          title: 'Reply'
          foreground: false
          destructive: false
          inline: true
    }
    new Promise (resolve, reject) =>
      @push = window.PushNotification.init {
        android:
          senderID: config.GOOGLE_PROJECT_NUMBER
          forceShow: true
          iconColor: config.COLOR_PRIMARY
        ios:
          alert: true
          badge: true
          sound: true
          clearBadge: true
      }
      forEach window.app.pushActions, (callback, action) =>
        @push.on "app.pushActions.#{action}", callback

      timeout = setTimeout reject, PUSH_REGISTER_TIMEOUT_MS
      @push.on 'registration', ({registrationId}) =>
        @token = registrationId
        clearTimeout timeout
        resolve {token: registrationId}

      @push.on 'notification', (notification) =>
        @pushData = clone(notification?.additionalData?.data or
          notification?.additionalData?.payload) or {}
        @pushData._original = notification
        forEach @onPushDataFns, (fn) =>
          fn @pushData

        @push.finish()

  registerAction: ({action}, callback) =>
    fn = =>
      callback?.apply this, arguments
      @push?.finish?()
    @push?.off "app.pushActions.#{action}", window.app.pushActions[action]
    @push?.on "app.pushActions.#{action}", fn
    window.app.pushActions[action] = fn

module.exports = new PushNotificationService()
