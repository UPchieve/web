# UPchieve Native

## Installation
### Dependencies
- `npm install -g cordova`
- `npm install -g gulp`

### Code
```
git clone git@github.com:austinhallock/upchieve-native.git
cd upchieve-native
npm install
```

### iOS
#### iOS Dependencies
- Install [xcode](https://apps.apple.com/us/app/xcode/id497799835?mt=12) if you don't have it
- `npm install -g ios-sim ios-deploy`
- install [cocoapods](https://guides.cocoapods.org/using/getting-started)
- `pod setup`

#### Building app

```
npm run local-ios
cd cordova
cordova plugin add cordova-plugin-ionic-webview@2.5.3
cd ..
npm run local-ios
```

- open xcode
- find and open upchieve-native/platforms/ios/UPchieve.xworkspace
- xcode->preferences -> accounts tab. add/plus icon (bottom left). on your upchieve account, verify that under teams is "Upchieve, Inc". close. (if it's not there, you need to be added as dev)
- Click on "UPchieve" in folder view on left, then "Signing" tab. select team -> "Upchieve" (for both dev and release sections?)
- Build settings -> search "signing", "basic" blue tab to "all", change to "release" to "iOS developer"

#### TestFlight
*Similar to the steps for [releasing](#releasing)
- Bump version in package.json
- Ensure `APP_URL` in config.coffee is pointing to staging
- `npm run local-ios`
- Open the UPchieve.workspace folder in Xcode
- Bump the `build` value up for subsequent builds
- In the menu bar click Window -> Organizer (opens the Organizer window) -> Archives
- If no archives are present
    - Click Product in the menu bar -> Archive (This must be done in the UPchieve.workspace window and not the Organizer window)
    - Ensure that you are using the correct team `UPchieve Inc` and have proper credentials
- Open up the Organizer window, Archives -> Validate App -> see [Validate app](#releasing) in Releasing
- If there are issues validating the app make sure that `UPchieve Inc` is the team selected and that the provisioning profile and signing certificate are both correct
    - In the UPchieve.workspace window visit Targets -> Upchieve -> Signing & Capabilities -> Signing drop-down to verify
    - Try to validate the app again. If the same issue occurs contact team developers, your user permissions may need to be changed to allow for uploading a build
- After validating the app, click “Distribute App”, see [Distribute App](#releasing) in Releasing
- Visit https://appstoreconnect.apple.com/ 
- Click on my apps -> UPchieve -> TestFlight

#### Releasing
- Bump version in package.json
- `npm run release-ios`
- Xcode:
  - Product -> Archive
    - Validate app
      - Check upload symbols to Apple (or don't, doesn't matter a ton)
      - Automatically manage signing
      - Next until Validate
    - Distribute app
      - iOS app store
      - Upload
      - Check upload symbols to Apple (or don't, doesn't matter a ton)
      - Automatically manage signing
      - Upload

#### Problem solving
If `npm run local-ios` errors about `'xcodebuild' requires xcode`, run:
```
xcode-select --install
sudo xcode-select --switch /Library/Developer/CommandLineTools
```
---
`Module 'FirebaseInstanceID' not found`
```
cd platforms/ios
pod install
```


### Android
#### Android dependencies
- [Android SDK](https://developer.android.com/sdk/installing/index.html)

#### Building app
```
npm run local-android
```

It'll fail (that's fine)

```
cd cordova
gulp cordova:closeicon
gulp cordova:notificationicon
```

Comment out `/cordova` in `.gitignore`

ctrl+f (regex on): `play-services-(.*?):\+`
replace with: `play-services-$1:11.6.2`

Re-comment `/cordova` in `.gitignore`

Remove following from `MainActivity` in `cordova/platforms/android/app/src/main/AndroidManifest.xml`
```
<intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
</intent-filter>
```

```
cd ..
npm run local-android
```

If emulator fails, https://stackoverflow.com/a/51693703

#### Releasing
- bump version in package.json
- `npm run release-android`
- Upload app bundle to Google Play (`cordova/platforms/android/app/build/outputs/bundle/release/app.aab`)

## Generating assets
### iOS icons, Android splash
```
splashicon-generator --imagespath="resources"
```

Copy relevant assets to resources/android|ios/build/... then delete the res folder that command creates

### Android adaptive icons
https://easyappicon.com/

### iOS storyboards
Rachel made

## Commands

  - `npm run local-android` - Build and run debug APK on local device (plug in via USB)
  - `npm run build-android` - Build unaligned debug APK
  - `npm run release-android` - Build unaligned release APK

  - `npm run local-ios`
  - `npm run release-ios`

Be sure to bump the version number in package.json before running deploy

## Available portal calls
 `app.exit`
 `app.exitWithoutAnimation`
 `app.isLoaded`
 `app.triggerRepaint`
 `app.getDeviceId`
 `app.onPause`
 `app.onResume`
 `app.onBack`
 `app.rate`

 `share.any`
 `share.multi`

 `keyboard.show`
 `keyboard.close`
 `keyboard.onShow`
 `keyboard.onHide`
 `keyboard.disableScroll`
 `keyboard.hideAccessoryBar`
 `keyboard.showAccessoryBar`

 `intents.start`

 `orientation.lock`
 `orientation.unlock`
 `orientation.get`
 `orientation.onChange`

 `networkInformation.onOnline`
 `networkInformation.onOffline`
 `networkInformation.getType`

 `push.register`
 `push.subscribeToTopic`
 `push.getBadgeNumber`
 `push.setBadgeNumber`
 `push.getHasPermission`
 `push.setContextId`
 `push.onData`
 `push.registerAction`

 `top.getData`
 `top.onData`
 `top.clearEventListeners`

 `browser.openWindow`
 `browser.closeWindow`
 `browser.show`
 `browser.reply`

 `deepLink.getPath`
 `deepLink.onRoute`

 `geolocation.getCurrentPosition`

 `permissions.check`
 `permissions.request`

 `statusBar.setOverlaysWebview`
 `statusBar.setBackgroundColor`
 `statusBar.hide`
 `statusBar.show`
 `statusBar.getIsVisible`

## MISC notes
when releasing, using autosigning may break fcm?

Add provisioning profile for the app you added https://developer.apple.com/account/ios/profile/
  - wildcard -> app
Add app to FCM https://console.firebase.google.com/ grow -> in-app messaging -> add app
  - set app id prefix from provision prefix

mach-o-link (googletoolbox) add libpodupchieve to frameworks (general tab)

if you need to run pod install, close xcode before doing it


if signing error, manually sign with
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/dev/padlock/upload_keystore.jks ./app.aab upload -storepass passwordinpadlock
