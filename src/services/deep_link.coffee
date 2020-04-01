clone = require 'lodash/clone'
filter = require 'lodash/filter'
map = require 'lodash/map'

config = require '../config'

class DeepLinkService
  constructor: ->
    @urlParts = null
    @onRouteFns = []
    # /_portal/methodName/urlEncodedJsonData
    @onPortalFns = {}

    # custom-url-scheme plugin, needs to be defined ASAP
    window.handleOpenURL = (url) =>
      urlRegex = ///#{config.APP_KEY}:\/\/([^\?]*)///
      matches = urlRegex?.exec url
      unless matches
        return
      path = "/#{matches[1]}"

      # http://stackoverflow.com/a/2880929
      queryString = url.split('?')[1]
      pl = /\+/g
      search = /([^&=]+)=?([^&]*)/g
      decode = (s) ->
        decodeURIComponent s.replace pl, ' '
      query = {}
      while match = search.exec queryString
        query[decode(match[1])] = decode(match[2])

      @urlParts = {path, query}
      pathParts = path.split('/')

      # this doesn't work if new instance of app is opened. not sure if that
      # happens anywhere (breaks portal-gun chain)
      if pathParts[1] is '_portal'
        method = pathParts[2]
        # note that custom URL cordova plugin decodes before sending here. So
        # a url like kittencards://_portal/kik.login/{"url": "http://..."}
        # can happen.
        # get pathParts[3..]
        portalData = clone(pathParts)
        portalData.splice(0, 3)
        portalData.join '/'
        data =
          try
            JSON.parse decodeURIComponent portalData
          catch err
            {}
        @onPortalFns[method] =
          filter map @onPortalFns[method], ({once, fn}) ->
            fn data
            unless once
              {fn}
      else
        @onRouteFns = filter map @onRouteFns, ({once, fn}) =>
          fn @urlParts
          unless once
            {fn}

  onPortal: (method, {once, fn}) ->
    @onPortalFns[method] ?= []
    @onPortalFns[method].push {once, fn}

  onRoute: ({once, fn}) =>
    @onRouteFns.push {once, fn}

  getUrlParts: =>
    return @urlParts

  clearUrlParts: =>
    @path = null

  clearEventListeners: =>
    @onRouteFns = []

module.exports = new DeepLinkService()
