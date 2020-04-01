# UPchieve Native

### Getting Started
```
npm install
```

### Getting Started (Android)
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


### Getting Started (iOS)
```
npm run local-ios
cd cordova
cordova plugin add cordova-plugin-wkwebview-engine
npm run local-ios
```

### Generating assets
#### iOS icons, Android splash
```
splashicon-generator --imagespath="resources"
```

Copy relevant assets to resources/android|ios/build/... then delete the res folder that command creates

#### Android adaptive icons
https://easyappicon.com/

#### iOS storyboards
https://pgicons.abiro.com/

### Commands

  - `npm run local-android` - Build and run debug APK on local device (plug in via USB)
  - `npm run build-android` - Build unaligned debug APK
  - `npm run release-android` - Build unaligned release APK

Be sure to bump the version number in package.json before running deploy

### Dependencies

  - `npm install -g cordova`
  - iOS
    - [XCode](https://developer.apple.com/xcode/)
    - `npm install -g ios-sim ios-deploy`
  - Android:
    [Android SDK](https://developer.android.com/sdk/installing/index.html)


### MISC
when releasing, using autosigning may break fcm?

Add provisioning profile for the app you added https://developer.apple.com/account/ios/profile/
  - wildcard -> app
Add app to FCM https://console.firebase.google.com/ grow -> in-app messaging -> add app
  - set app id prefix from provision prefix

mach-o-link (googletoolbox) add libpodupchieve to frameworks (general tab)

if you need to run pod install, close xcode before doing it


if signing error, manually sign with
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/dev/padlock/upload_keystore.jks ./app.aab upload -storepass passwordinpadlock
