// https://stackoverflow.com/a/38241481
const getOperatingSystem = () => {
  var userAgent = window.navigator.userAgent
  var platform = window.navigator.platform
  var macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K']
  var windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE']
  var iosPlatforms = ['iPhone', 'iPad', 'iPod']
  var os = null

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = 'Mac OS'
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = 'iOS'
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = 'Windows'
  } else if (/Android/.test(userAgent)) {
    os = 'Android'
  } else if (!os && /Linux/.test(platform)) {
    os = 'Linux'
  }

  return os
}

export default getOperatingSystem
