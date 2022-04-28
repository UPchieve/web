import { EVENTS } from '../consts'
import errorFromHttpResponse from '../utils/error-from-http-response.js'
import AnalyticsService from './AnalyticsService'
import NetworkService from './NetworkService'

export default {
  loading: false,

  endSession(context, sessionId) {
    return NetworkService.endSession(context, { sessionId }).then(() => {
      const currentSessionData = context.$store.state.user.session

      AnalyticsService.captureEvent(EVENTS.SESSION_ENDED, {
        event: EVENTS.SESSION_ENDED,
        sessionId: sessionId,
        subject: currentSessionData.subTopic
      })
    })
  },

  newSession(context, sessionType, sessionSubTopic, options) {
    const onRetry = options && options.onRetry
    const data = {
      sessionType,
      sessionSubTopic
    }

    if (localStorage.getItem('assignmentId')) {
      data.assignmentId = localStorage.getItem('assignmentId')
      data.problemId = localStorage.getItem('problemId')
      data.studentId = localStorage.getItem('studentId')
    }

    return NetworkService.newSession(context, data, onRetry).then(res => {
      const data = res.data || {}
      const { sessionId } = data

      // const currentSession = {
      //   sessionId,
      //   data: context.$store.state.user.session
      // };

      if (sessionId) {
        const sessionData = {
          type: sessionType,
          subTopic: sessionSubTopic,
          _id: sessionId
        }
        localStorage.removeItem('assignmentId')
        localStorage.removeItem('problemId')
        localStorage.removeItem('studentId')
        context.$store.dispatch('user/updateSession', sessionData)
        context.$router.replace(context.$store.getters['user/sessionPath'])
      } else {
        context.$router.replace('/')
      }
      // analytics: track when a session has started
      // AnalyticsService.trackSessionStarted(
      //   context,
      //   currentSession,
      //   sessionType,
      //   sessionSubTopic,
      //   context.$store.state.user.isFakeUser
      // );

      return sessionId
    })
  },

  useExistingSession(context, sessionId, options) {
    const onRetry = options && options.onRetry

    return NetworkService.checkSession(context, { sessionId }, onRetry)
      .then(res => {
        const data = res.data || {}
        const { sessionId } = data

        return sessionId
      })
      .catch(res => {
        if (res.status === 404) {
          context.$router.replace('/')
        } else {
          throw res
        }
      })
  },

  getCurrentSession(context, user) {
    return NetworkService.currentSession(context, {
      user_id: user._id,
      is_volunteer: user.isVolunteer
    })
      .then(resp => {
        const { sessionId, data } = resp.data || {}
        const { type, subTopic } = data

        if (type && subTopic && sessionId) {
          return Promise.resolve({ sessionData: data })
        }
      })
      .catch(resp => {
        throw errorFromHttpResponse(resp)
      })
  },

  getLatestSession(context, user) {
    return NetworkService.latestSession(context, { userId: user._id })
      .then(resp => {
        const { data } = resp.data || {}
        return Promise.resolve({ sessionData: data })
      })
      .catch(resp => {
        throw errorFromHttpResponse(resp)
      })
  }
}
