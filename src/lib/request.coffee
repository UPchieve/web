isObject = require 'lodash/isObject'
isArray = require 'lodash/isArray'
defaults = require 'lodash/defaults'

serializeQueryString = (obj, prefix) ->
  str = []
  for p of obj
    if obj.hasOwnProperty(p)
      k = (if prefix then prefix + '[' + p + ']' else p)
      v = obj[p]
      str.push (if typeof v is 'object' then serializeQueryString(v, k) \
                else encodeURIComponent(k) + '=' + encodeURIComponent(v))
  str.join '&'

statusCheck = (response) ->
  if response.status >= 200 and response.status < 300
    Promise.resolve response
  else
    toJson(response).then (responseJson) ->
      Promise.reject responseJson

toJson = (response) ->
  response.json()

module.exports = (url, options) ->
  if isObject options?.body or isArray options?.body
    options.headers = defaults (options.headers or {}),
      'Accept': 'application/json'
      'Content-Type': 'application/json'
    options.body = JSON.stringify options.body

  if isObject options?.qs
    url += '?' + serializeQueryString options.qs

  window.fetch url, options
  .then statusCheck
  .then toJson
