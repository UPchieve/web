import { LATEST_APP_VERSION } from '../consts'
import getUserMobileAppVersion from './get-user-mobile-app-version'

const isOutdatedMobileAppVersion = () => {
  return getUserMobileAppVersion() < LATEST_APP_VERSION
}

export default isOutdatedMobileAppVersion
