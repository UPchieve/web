import NetworkService from './NetworkService'
import LoggerService from './LoggerService'

export default {
  async getCurrentServerVersion() {
    // default this to 'unknown' so if another request
    // succeeds, the user will be prompted to refresh
    let version
    try {
      const checkHealthResponse = await NetworkService.checkHealth()
      version = checkHealthResponse.data.version
    } catch (err) {
      version = 'unknown'
      LoggerService.noticeError(err)
    }
    return version
  },
}
