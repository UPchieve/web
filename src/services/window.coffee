config = require '../config'

isiOS = cordova?.platformId is 'ios'

class WindowService
  constructor: ->
    @bottomPadding = 0
    window.addEventListener 'resize', =>
      @resize()
      # ios sometimes doesn't resize faster enough
      if isiOS
        setTimeout =>
          @resize()
        , 100

  setIframe: (@$iframe) => null

  setBottomPadding: (@bottomPadding) => null

  resize: =>
    @$iframe?.style.height = "#{window?.innerHeight - @bottomPadding}px"



module.exports = new WindowService()
