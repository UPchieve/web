# IMPORTANT
Make sure to fix the `FIXME`s in the code before using (or just use my branches as a guide to do however you want to organize things)

# Broad view
The app uses Cordova which serves up a basic index.html that iframes app.upchieve.org. The app has some Cordova plugins installed that can be called directly using Portal Gun.

Code here:
https://github.com/austinhallock/upchieve-native I can move this over to UPchieve's GitHub whenever.

# Portal Gun
Portal Gun (https://github.com/claydotio/portal-gun) is the communication layer between web and native (and eventually service workers whenever you add them)

A basic call looks something like `PortalService.call("statusBar.setBackgroundColor", {color: "#000000"})`

Portal Gun also accepts callbacks as the second param for certain methods like `app.onBack` if you want to do anything special when the native back button (Android) is tapped.

# Native iOS
Follow instructions in upchieve-native readme

# Native Android
Follow instructions in upchieve-native readme

# Web
## Detecting when web app is being run through native app
The native app's user agent has upchieve/v0.1.1/... so you can use that (also to get app version #)

## Routing from push notifications
Portal's `top.getData` has routing data when app is opened from cold start w/ notification. `top.onData` (callback) is called whenever app is opened from warm start (and also if app is open when push is received). If app is open, `_original.additionalData.foreground` will be true, and you can use some internal UI to show the notification

Those portal calls are also made when the user is routed into the app w/ a deep link if you guys do that (`_isDeepLink` will be true in that case)

This is roughly how I handle data from push notifications in FreeRoam (coffeescript, sorry).

```coffee
routeHandler = (data) ->
  data ?= {}
  {path, _isPush, _original, _isDeepLink} = data

  if _isPush and _original?.additionalData?.foreground
    if Environment.isIos() and Environment.isNativeApp()
      model.portal.call 'push.setBadgeNumber', {number: 0}

    currentNotification.next {
      title: _original?.additionalData?.title or _original.title
      message: _original?.additionalData?.message or _original.message
      type: _original?.additionalData?.type
      data: {path}
    }
  else if path?
    router.goPath path
```

## iOS-specific
Overall: iOS sucks. It's the new IE 6. Learn to hate Apple.

iOS scrolling on < iOS 13 is janky w/o `-webkit-overflow-scrolling: touch`, so it needs to be anywhere `overflow: auto` is

iOS tries to auto-expand iframes to their full-height, which makes scrolling generally suck. So we need to wrap all content in a div that's 100% wh & has overflow: auto. this is the only overflow: auto that shouldn't have `-webkit-overflow-scrolling: touch`. I don't remember the exact bug, but my code comment linked to `http://stackoverflow.com/questions/9807620/ipad-safari-scrolling-causes-html-elements-to-disappear-and-reappear-with-a-dela`


iOS is annoying and doesn't blur focus from element when you tap on other stuff. Something like this will take care of that:
```coffee
onclick: if Environment.isIos()
  (e) ->
    focusTag = document.activeElement.tagName
    if focusTag in focusTags and not (e.target.tagName in focusTags)
      document.activeElement.blur()
```

# Server
https://github.com/UPchieve/server/compare/cordova-link for example of using FCM. That'll work for iOS, Android and web push.

You'll need to store push tokens for users. Should store in a way where users can have multiple push tokens. 
