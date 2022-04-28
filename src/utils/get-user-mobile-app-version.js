const getUserMobileAppVersion = () => {
  const versionNumberRegex = /(?:upchieve)\/(?:[a-zA-Z0-9]+\/)?([0-9.]+)/
  return navigator.userAgent.match(versionNumberRegex)[1]
}

export default getUserMobileAppVersion
