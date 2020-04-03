# Broad view
The app uses Cordova which serves up a basic index.html that iframes app.upchieve.org. The app has some Cordova plugins installed that can be called directly using Portal Gun.

Code here:
https://github.com/austinhallock/upchieve-native I can move this over to UPchieve's GitHub whenever.

# Portal Gun
Portal Gun (https://github.com/claydotio/portal-gun) is the communication layer between web and native (and eventually service workers whenever you add them)

A basic call looks something like `PortalService.call("statusBar.setBackgroundColor", {color: "#000000"})`

Portal Gun also accepts callbacks as the second param for certain methods like `app.onBack` if you want to do anything special when the native back button (Android) is tapped.

# Native iOS

# Native Android

# Web
## Detecting when web app is being run through native app
The native app's user agent has upchieve/v0.1.1/... so you can use that (also to get app version #)

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
