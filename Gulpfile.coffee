Promise = require 'bluebird'
fs = Promise.promisifyAll(require 'fs')
gulp = require 'gulp'
rename = require 'gulp-rename'
batchReplace = require 'gulp-batch-replace'
clean = require 'gulp-clean'
runSequence = require 'gulp-run-sequence'
coffeelint = require 'gulp-coffeelint'
webpack = require 'gulp-webpack'
zip = require 'gulp-zip'
webpackSource = require 'webpack'
splashiconGenerator = require 'splashicon-generator'
exec = require('child_process').exec

_ = require 'lodash'
config = require './src/config'
npmConfig = require './package.json'

KEY = config.APP_KEY
PACKAGE_KEY = config.PACKAGE_KEY
CLASS_NAME = config.CLASS_NAME
bgColor = config.SPLASH_COLOR_BG or '#000000'
COLOR_BG = bgColor.replace '#', '0xff'
ADDITIONAL_PERMISSIONS = _.map config.ADDITIONAL_PERMISSIONS, (permission) ->
  "<uses-permission android:name=\"android.permission.#{permission}\"/>"
.join('')

# TODO: cleanup a lot of the redundancy in this file (with iOS and Android)

replacements = [
  ['___PACKAGE_KEY_PLACEHOLDER___', config.PACKAGE_KEY]
  ['___CLASS_NAME_PLACEHOLDER___', config.CLASS_NAME]
  ['___WINDOW_COLOR_BG_PLACEHOLDER___', config.WINDOW_COLOR_BG]
  ['___COLOR_PRIMARY_PLACEHOLDER___', config.COLOR_PRIMARY]
  ['___COLOR_PRIMARY_DARK_PLACEHOLDER___', config.COLOR_PRIMARY_DARK]
  ['___THEME_PLACEHOLDER___', config.THEME]
  ['___ADDITIONAL_PERMISSIONS_PLACEHOLDER___', ADDITIONAL_PERMISSIONS]
  ['___NAME_PLACEHOLDER___', config.APP_NAME]
  ['___DESCRIPTION_PLACEHOLDER___', config.APP_DESCRIPTION]
  ['___COLOR_BG_PLACEHOLDER___', COLOR_BG]
  ['___SPLASH_COLOR_BG_PLACEHOLDER___', bgColor]
  ['___ORIENTATION_PLACEHOLDER___', config.ORIENTATION]
  ['___FB_APP_ID_PLACEHOLDER___', config.FB_APP_ID]
  ['___FB_APP_NAME_PLACEHOLDER___', config.FB_APP_NAME]
  ['___VERSION_PLACEHOLDER___', npmConfig.version]
  ['___URL_PLACEHOLDER___', config.APP_URL]
  ['___GOOGLE_PROJECT_NUMBER_PLACEHOLDER___', config.GOOGLE_PROJECT_NUMBER]
  ['___GOOGLE_BILLING_KEY_PLACEHOLDER___', config.GOOGLE_BILLING_KEY]
  [
    '___IOS_ORIENTATION_PLACEHOLDER___'
    if config.ORIENTATION is 'default' then 'all' else 'portrait'
  ]
]

outFiles =
  scripts: 'bundle.js'
  config: 'config.xml'
  buildFile: 'build.json'
  apk:
    arm:
      debug: 'debug_arm.apk'
      release32: 'unsigned_arm_32.apk'
      release64: 'unsigned_arm_64.apk'
    x86:
      release32: 'unsigned_x86_32.apk'
      release64: 'unsigned_x86_64.apk'

paths =
  html: ['./index.html']
  config: './cordova_config.xml'
  buildFile: './cordova_build.json'
  android:
    manifest: './resources/android/AndroidManifest.xml'
    pluginBuildGradle: './resources/android/plugin-build.gradle'

  scripts: ['./*.coffee', './src/*.coffee']
  tests: './tests/*/*.coffee'
  root: './src/root.coffee'
  rootTests: './tests/index.coffee'
  cordova:
    build: './cordova/platforms/android/app/build/outputs/apk'
  dist:
    base: './dist'
    native: './dist/native'
  resources:
    android:
      build:
        path: "./resources/android/#{KEY}/build/**/*"
        base: "./resources/android/#{KEY}/build"
        destination: './cordova/platforms/android/app/src/main/res'
      cordova:
        path: "./resources/android/#{KEY}/cordova/**/*"
        base: "./resources/android/#{KEY}/cordova"
        destination: './cordova/res/android'
    ios:
      path: "./resources/ios/#{KEY}/build/**/*"
      base: "./resources/ios/#{KEY}/build"
      destination: './cordova/res/ios'
  firebase:
    android: "./resources/android/#{KEY}/google-services.json"
    ios: "./resources/ios/#{KEY}/GoogleService-Info.plist"
  build:
    client: './build/client'
    cordovaWww: './cordova/www'
    cordova: './cordova'
    android:
      manifest: './cordova/platforms/android/app/src/main'
      resources: './cordova/platforms/android/app/src/main/res'
      drawable: './cordova/platforms/android/app/src/main/res'
    tests: './build/tests'

#
# Production compilation
#





gulp.task 'release:android:arm', (cb) ->
  runSequence(
    'cordova:setup:android'
    'config:android'
    'buildfile'
    'cordova:resources:android'
    'cordova:closeicon'
    'cordova:notificationicon'
    'cordova:firebase:android'
    # 'android:static'
    'android:drawables'
    'client:build'
    'cordova:move:client'
    # 'cordova:build:release:android:64'
    'cordova:build:release:android:32'
    # TODO swap for crosswalk
    'cordova:copy:android'
    # 'cordova:copy:android:arm-32'
    # 'cordova:copy:android:arm-64'
    cb
  )


gulp.task 'cordova:build:release:android:32', (cb) ->
  exec(
    # TODO: swap crosswalk
    'cd cordova &&
      cordova build android --release -- --packageType=bundle --versionCode=' +
      ("#{npmConfig.version.replace(/\./g, '0')}6 -- --minSdkVersion=21")
    # 'cd cordova &&
    #   cordova build android --release -- --maxSdkVersion=20 --versionCode=' +
    #   ("#{npmConfig.version.replace(/\./g, '0')}")
  , cb)


gulp.task 'release:android', (cb) ->
  runSequence 'release:android:arm'#, 'release:android:x86'



















gulp.task 'run:android', (cb) ->
  runSequence(
    'cordova:setup:android'
    'config:android'
    'cordova:resources:android'
    'cordova:firebase:android'
    'client:build'
    # 'android:static'
    'android:drawables'
    'cordova:move:client'
    'cordova:run:android'
    cb
  )

gulp.task 'run:ios', (cb) ->
  runSequence(
    'cordova:setup:ios'
    'config:ios'
    'buildfile'
    'cordova:resources:ios'
    'cordova:firebase:ios'
    'client:build'
    'cordova:move:client'
    'cordova:run:ios'
    cb
  )

gulp.task 'build:android', (cb) ->
  runSequence(
    'cordova:setup:android'
    'config:android'
    'buildfile'
    'cordova:resources:android'
    'cordova:firebase:android'
    # 'android:static'
    'android:drawables'
    'client:build'
    'cordova:move:client'
    'cordova:build:android'
    'cordova:copy:debug:android'
    cb
  )

gulp.task 'build:ios', (cb) ->
  runSequence(
    'cordova:setup:ios'
    'config:ios'
    'buildfile'
    'cordova:resources:ios'
    'cordova:firebase:ios'
    'client:build'
    'cordova:move:client'
    'cordova:build:ios'
    cb
  )

gulp.task 'release:android:x86', (cb) ->
  runSequence(
    'cordova:setup:android'
    'config:android'
    'cordova:resources:android'
    'cordova:firebase:android'
    # 'android:static'
    'android:drawables'
    'client:build'
    'cordova:move:client'
    # 'cordova:build:release:android:64'
    'cordova:build:release:android:32'
    'cordova:copy:android:x86-32'
    # 'cordova:copy:android:x86-64'
    cb
  )

gulp.task 'release:ios', (cb) ->
  runSequence(
    'cordova:setup:ios'
    'config:ios'
    'buildfile'
    'cordova:resources:ios'
    'cordova:firebase:ios'
    'client:build'
    'cordova:move:client'
    'cordova:build:release:ios'
    cb
  )

#
# Cordova
#

gulp.task 'cordova:closeicon', (done) ->
  # Generate all the default assets
  splashiconGenerator.generate().then ->
    # Configure the custom assets with their sizes
    options =
      ICON_FILE: "./resources/android/#{KEY}/close.png"
      SPLASH_FILE: ''
      ICON_PLATFORMS: [ {
        name: 'android-close-icon'
        iconsPath: 'cordova/res/icons/android/'
        isAdded: true
        icons: [
          {
            name: 'close-icon-36-ldpi.png'
            size: 36
            density: 'ldpi'
          }
          {
            name: 'close-icon-48-mdpi.png'
            size: 48
            density: 'mdpi'
          }
          {
            name: 'close-icon-72-hdpi.png'
            size: 72
            density: 'hdpi'
          }
          {
            name: 'close-icon-96-xhdpi.png'
            size: 96
            density: 'xhdpi'
          }
          {
            name: 'close-icon-144-xxhdpi.png'
            size: 144
            density: 'xxhdpi'
          }
          {
            name: 'close-icon-192-xxxhdpi.png'
            size: 192
            density: 'xxxhdpi'
          }
        ]
      } ]
    # Generate only the custom assets specified in the `options` parameter
    splashiconGenerator.generate(options).then ->
      console.log 'done'
      # done()

gulp.task 'cordova:notificationicon', (done) ->
  # Generate all the default assets
  splashiconGenerator.generate().then ->
    # Configure the custom assets with their sizes
    options =
      ICON_FILE: "./resources/android/#{KEY}/notification_icon.png"
      SPLASH_FILE: ''
      ICON_PLATFORMS: [ {
        name: 'android-push-icon'
        iconsPath: 'cordova/res/icons/android/'
        isAdded: true
        icons: [
          {
            name: 'push-icon-36-ldpi.png'
            size: 36
            density: 'ldpi'
          }
          {
            name: 'push-icon-48-mdpi.png'
            size: 48
            density: 'mdpi'
          }
          {
            name: 'push-icon-72-hdpi.png'
            size: 72
            density: 'hdpi'
          }
          {
            name: 'push-icon-96-xhdpi.png'
            size: 96
            density: 'xhdpi'
          }
          {
            name: 'push-icon-144-xxhdpi.png'
            size: 144
            density: 'xxhdpi'
          }
          {
            name: 'push-icon-192-xxxhdpi.png'
            size: 192
            density: 'xxxhdpi'
          }
        ]
      } ]
    # Generate only the custom assets specified in the `options` parameter
    splashiconGenerator.generate(options).then ->
      console.log 'done'
      # done()

# ---
# generated by js2coffee 2.2.0

gulp.task 'cordova:move:client', (cb) ->
  runSequence(
    'cordova:clean:cordovaWww'
    'codova:move:client:cordovaWww'
    cb
  )

gulp.task 'cordova:clean:cordovaWww', ->
  gulp.src paths.build.cordovaWww, read: false
    .pipe clean()

gulp.task 'codova:move:client:cordovaWww',  ->
  gulp.src paths.build.client + '/**/*'
    .pipe gulp.dest paths.build.cordovaWww

gulp.task 'cordova:setup:android', (cb) ->
  Promise.all [
    fs.readFileAsync './current_app', {encoding: 'utf-8'}
    .catch -> null
    new Promise (resolve, reject) ->
      fs.exists './cordova', resolve
  ]
  .then ([currentApp, cordovaExists]) ->
    # check if previously built app was the same as specified app
    if not cordovaExists
      runSequence(
        'cordova:create:android'
        'cordova:platform:android'
        ->
          fs.writeFile './current_app', config.APP_KEY, -> null
          cb()
      )
    else if currentApp isnt config.APP_KEY
      runSequence(
        'cordova:clean'
        'cordova:create:android'
        'cordova:platform:android'
        ->
          fs.writeFile './current_app', config.APP_KEY, -> null
          cb()
      )
    else
      cb()
  return null

gulp.task 'cordova:setup:ios', (cb) ->
  Promise.all [
    fs.readFileAsync './current_app', {encoding: 'utf-8'}
    new Promise (resolve, reject) ->
      fs.exists './cordova', resolve
  ]
  .then ([currentApp, cordovaExists]) ->
    # check if previously built app was the same as specified app
    if not cordovaExists
      runSequence(
        'cordova:create:ios'
        'cordova:platform:ios'
        ->
          fs.writeFile './current_app', config.APP_KEY, -> null
          cb()
      )
    else if currentApp isnt config.APP_KEY
      runSequence(
        'cordova:clean'
        'cordova:create:ios'
        'cordova:platform:ios'
        ->
          fs.writeFile './current_app', config.APP_KEY, -> null
          cb()
      )
    else
      cb()
  return null

gulp.task 'cordova:clean', (cb) ->
  exec 'rm -r cordova', cb


gulp.task 'cordova:create:android', (cb) ->
  console.log 'create android'
  exec """
  cordova create cordova #{PACKAGE_KEY} '#{CLASS_NAME}'
  """, cb


gulp.task 'cordova:platform:android', (cb) ->
  exec 'cd cordova && cordova platform add android@8.1.0 --no-fetch', (err, stdout, stderr) ->
    console.log stdout, stderr
    cb err

gulp.task 'cordova:create:ios', (cb) ->
  exec """
  cordova create cordova #{PACKAGE_KEY} '#{CLASS_NAME}'
  """, cb


gulp.task 'cordova:platform:ios', (cb) ->
  exec 'cd cordova && cordova platform add ios@5.0.1', cb

gulp.task 'cordova:run:android', (cb) ->
  ls = exec 'cd cordova && cordova run android'
  ls.stdout.on 'data', (data) ->
    console.log data.toString()

  ls.stderr.on 'data', (data) ->
    console.log('stderr: ' + data.toString())

  ls.on 'exit', ->
    cb()


gulp.task 'cordova:run:ios', (cb) ->
  exec 'cd cordova && cordova run ios', cb


gulp.task 'cordova:build:android', (cb) ->
  ls = exec 'cd cordova && cordova build android'
  ls.stdout.on 'data', (data) ->
    console.log('stdout: ' + data.toString())

  ls.stderr.on 'data', (data) ->
    console.log('stderr: ' + data.toString())

  ls.on 'exit', ->
    cb()


gulp.task 'cordova:build:ios', (cb) ->
  exec 'cd cordova && cordova build ios', cb


gulp.task 'cordova:build:release:android:64', (cb) ->
  exec 'cd cordova &&
    cordova build android --release --xwalk64bit'
  , cb

gulp.task 'cordova:build:release:ios', (cb) ->
  exec 'cd cordova; cordova build ios --release', cb

gulp.task 'cordova:copy:debug:android', ->
  gulp.src "#{paths.cordova.build}/release/android-armv7-debug-unaligned.apk"
    .pipe rename outFiles.apk.arm.debug
    .pipe gulp.dest paths.dist.native

# non-crosswalk
gulp.task 'cordova:copy:android', ->
  gulp.src "#{paths.cordova.build}/release/app-release-unsigned.apk"
    .pipe rename outFiles.apk.arm.release32
    .pipe gulp.dest paths.dist.native

gulp.task 'cordova:copy:android:arm-32', ->
  gulp.src "#{paths.cordova.build}/armv7/release/app-armv7-release-unsigned.apk"
    .pipe rename outFiles.apk.arm.release32
    .pipe gulp.dest paths.dist.native

gulp.task 'cordova:copy:android:arm-64', ->
  gulp.src "#{paths.cordova.build}/arm64/release/app-arm64-release-unsigned.apk"
    .pipe rename outFiles.apk.arm.release64
    .pipe gulp.dest paths.dist.native

gulp.task 'cordova:copy:android:x86-32', ->
  gulp.src "#{paths.cordova.build}/x86/release/app-x86-release-unsigned.apk"
    .pipe rename outFiles.apk.x86.release32
    .pipe gulp.dest paths.dist.native

gulp.task 'cordova:copy:android:x86-64', ->
  gulp.src "#{paths.cordova.build}/x86_64/release/app-x86_64-release-unsigned.apk"
    .pipe rename outFiles.apk.x86.release64
    .pipe gulp.dest paths.dist.native

gulp.task 'cordova:resources:android', ->
  gulp.src paths.resources.android.cordova.path, base: paths.resources.android.cordova.base
  .pipe gulp.dest paths.resources.android.cordova.destination

gulp.task 'cordova:resources:ios', ->
  gulp.src paths.resources.ios.path, base: paths.resources.ios.base
  .pipe gulp.dest paths.resources.ios.destination

gulp.task 'cordova:firebase:android', ->
  gulp.src paths.firebase.android
  .pipe gulp.dest paths.build.cordova

gulp.task 'cordova:firebase:ios', ->
  gulp.src paths.firebase.ios
  .pipe gulp.dest paths.build.cordova

#
# Android
#

gulp.task 'android:static', [
  # 'android:static:manifest'
  # 'android:styles'
]

gulp.task 'android:static:manifest', ->
  gulp.src paths.android.manifest
    .pipe batchReplace replacements
    .pipe gulp.dest paths.build.android.manifest

#
# Config
#

gulp.task 'config:android', ->
  gulp.src paths.config
    .pipe batchReplace replacements
    .pipe rename outFiles.config
    .pipe gulp.dest paths.build.cordova

gulp.task 'config:ios', ->
  gulp.src paths.config
    .pipe batchReplace replacements
    .pipe rename outFiles.config
    .pipe gulp.dest paths.build.cordova

gulp.task 'buildfile', ->
  gulp.src paths.buildFile
    .pipe batchReplace replacements
    .pipe rename outFiles.buildFile
    .pipe gulp.dest paths.build.cordova
#
# Client
#

gulp.task 'client:build', (cb) ->
  runSequence 'clean:build', 'assets', 'lint:scripts', 'scripts', cb

# rm -r build
gulp.task 'clean:build', ->
  gulp.src paths.build.client, read: false
    .pipe clean()

gulp.task 'assets', [
  'assets:html'
]

gulp.task 'assets:html', ->
  gulp.src paths.html
    .pipe batchReplace replacements
    .pipe gulp.dest paths.build.client

# gulp.task 'android:styles', ->
#   gulp.src paths.android.styles.path, base: paths.android.styles.base
#     .pipe batchReplace replacements
#     .pipe gulp.dest paths.build.android.resources

# FIXME: is this needed? it's pulling way to much into app res
gulp.task 'android:drawables', ->
  gulp.src paths.resources.android.build.path, base: paths.resources.android.build.base
  .pipe gulp.dest paths.resources.android.build.destination


gulp.task 'lint:scripts', ->
  gulp.src paths.scripts
    .pipe coffeelint()
    .pipe coffeelint.reporter()

# root.coffee --> dist/js/bundle.js
gulp.task 'scripts', ->
  gulp.src paths.root
  .pipe webpack
    module:
      loaders: [
        { test: /\.coffee$/, loader: 'coffee' }
      ]
      postLoaders: [
        {test: /\.coffee$/, loader: 'transform/cacheable?envify'}
      ]
    plugins: [
      new webpackSource.optimize.UglifyJsPlugin
        mangle:
          except: ['process']
      # new webpackSource.DefinePlugin
      #   'process.env': _.mapValues process.env, (val) -> JSON.stringify val
    ]
    resolve:
      extensions: ['.coffee', '.js', '.json', '']
  .pipe rename outFiles.scripts
  .pipe gulp.dest paths.build.client + '/js'
