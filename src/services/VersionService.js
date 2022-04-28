import NetworkService from './NetworkService'
import * as Sentry from '@sentry/browser'

export default {
  async getCurrentServerVersion() {
    // default this to 'unknown' so if another request
    // succeeds, the user will be prompted to refresh
    let version
    try {
      const checkHealthResponse = await NetworkService.checkHealth()
      version = checkHealthResponse.body.version
    } catch (err) {
      version = 'unknown'
      Sentry.captureException(err)
    }
    return version
  }
}
