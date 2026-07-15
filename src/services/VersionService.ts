import NetworkService from './NetworkService'
import LoggerService from './LoggerService'

export default {
  async getCurrentServerVersion() {
    try {
      const checkHealthResponse = await NetworkService.checkHealth()
      return checkHealthResponse.data.version
    } catch (err) {
      LoggerService.noticeError(err)
    }
  },
}
