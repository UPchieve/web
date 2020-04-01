COOKIE_DURATION_MS = 10 * 365 * 24 * 3600 * 1000 # 10 years

secondLevelDomain = window.location.hostname.split('.').slice(-2).join('.')
# The '.' prefix allows subdomains access
domain = '.' + secondLevelDomain

class Cookies
  get: (key) ->
    match = document.cookie.match('(^|;)\\s*' + key + '\\s*=\\s*([^;]+)')
    return if match then match.pop() else null

  set: (key, value) ->
    expireTimestampMs = Date.now() + COOKIE_DURATION_MS
    expireDate = (new Date(expireTimestampMs)).toUTCString()

    # The '.' prefix allows subdomains access
    document.cookie = "#{key}=#{value};path=/;domain=#{domain};" +
                      "expires=#{expireDate}"

  delete: (key) ->
    document.cookie = "#{key}=;path=/;domain=#{domain};" +
                      'expires=Thu, 01 Jan 1970 00:00:01 GMT'

module.exports = new Cookies()
