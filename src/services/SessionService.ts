import { EVENTS } from '../consts'
import errorFromHttpResponse from '../utils/error-from-http-response.js'
import AnalyticsService from './AnalyticsService'
import NetworkService from './NetworkService'

export default {
  async endSession(sessionId: string, subTopic: string) {
    await NetworkService.endSession({ sessionId })
    AnalyticsService.captureEvent(EVENTS.SESSION_ENDED, {
      event: EVENTS.SESSION_ENDED,
      sessionId: sessionId,
      subject: subTopic,
    })
  },

  async newSession(context, sessionType, sessionSubTopic, options) {
    const onRetry = options && options.onRetry
    const docEditorVersion = options?.docEditorVersion
    const assignmentId = options?.assignmentId
    const data = {
      sessionType,
      sessionSubTopic,
      docEditorVersion,
      assignmentId,
    }

    const {
      data: { sessionId },
    } = await NetworkService.newSession(data, onRetry)
    if (sessionId) {
      const sessionData = {
        type: sessionType,
        subTopic: sessionSubTopic,
        _id: sessionId,
        id: sessionId,
      }
      await context.$store.dispatch('user/updateSession', sessionData)
      context.$router.replace(context.$store.getters['user/sessionPath'])
    } else {
      context.$router.replace('/')
    }

    return sessionId
  },

  useExistingSession(context, sessionId, options) {
    const onRetry = options && options.onRetry

    return NetworkService.checkSession({ sessionId }, onRetry)
      .then((res) => {
        const data = res.data || {}
        const { sessionId } = data

        return sessionId
      })
      .catch((res) => {
        if (res.status === 404) {
          context.$router.replace('/')
        } else {
          throw res
        }
      })
  },

  getCurrentSession() {
    return NetworkService.currentSession()
      .then((res) => {
        if (!res.data || !res.data.sessionId) {
          return Promise.resolve({ sessionData: {} })
        }

        const { sessionId, data } = res.data
        const { type, subTopic } = data

        if (type && subTopic && sessionId) {
          return Promise.resolve({ sessionData: data })
        }
      })
      .catch((resp) => {
        throw errorFromHttpResponse(resp)
      })
  },

  getRecapSessionForDms(sessionId) {
    return NetworkService.getRecapSessionForDms({
      sessionId,
    })
      .then((resp) => {
        const { sessionId, data } = resp.data || {}
        const { type, subTopic } = data

        if (type && subTopic && sessionId) {
          return Promise.resolve({ sessionData: data })
        }
      })
      .catch((resp) => {
        throw errorFromHttpResponse(resp)
      })
  },

  getLatestSession() {
    return NetworkService.latestSession()
      .then((res) => {
        const { data } = res.data || {}
        return Promise.resolve({ sessionData: data })
      })
      .catch((resp) => {
        throw errorFromHttpResponse(resp)
      })
  },
}
