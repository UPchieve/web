import NetworkService from './NetworkService'
import LoggerService from '@/services/LoggerService'

export default {
  async checkIfMessageIsClean(data: {
    message: string
    sessionId: string
    source: string
  }) {
    function errHandler(err: any) {
      LoggerService.noticeError('Failed to moderate message', { error: err })
      throw new Error('Failed to moderate message')
    }

    return NetworkService.checkIfMessageIsClean({
      message: data.message,
      sessionId: data.sessionId,
      source: data.source,
    }).then(
      (res) => {
        if ('err' in res.data) {
          return errHandler(res.data.err)
        } else {
          return res.data.isClean
        }
      },
      (err) => {
        return errHandler(err)
      }
    )
  },
  async checkIfImageIsClean(formData: any) {
    const res = await NetworkService.checkIfImageIsClean(formData)
    return res.data
  },

  async checkIfVideoFrameIsClean(formData: any) {
    const res = await NetworkService.checkIfVideoFrameIsClean(formData)
    return res.data
  },
}
