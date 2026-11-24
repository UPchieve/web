import config from '@/config'
import { httpPost } from '@/services/NetworkService'

const API_ROOT = `${config.serverRoot}/api`

type WhiteboardTokenResponse = {
  expiresAt: string
}

export default {
  requestWhiteboardToken(sessionId: string) {
    return httpPost<WhiteboardTokenResponse>(
      `${API_ROOT}/session/${sessionId}/whiteboard-token`,
      {}
    )
  },
}
