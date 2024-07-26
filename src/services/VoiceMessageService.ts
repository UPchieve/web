import NetworkService from './NetworkService'
import LoggerService from './LoggerService'

export default {
  async saveVoiceMessage(formData) {
    try {
      const { data } = await NetworkService.saveVoiceMessage(
        formData.get('sessionId'),
        formData
      )
      return data?.voiceMessageId
    } catch (err) {
      LoggerService.noticeError(err)
    }
  },
}
