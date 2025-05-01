import { EVENTS } from '../consts'
import errorFromHttpResponse from '../utils/error-from-http-response.js'
import AnalyticsService from './AnalyticsService'
import NetworkService from './NetworkService'

function isAbsentUser(session: Record<string, any>) {
  const { student, volunteer } = session
  if (!volunteer) return true

  const messages = getMessagesAfterVolunteerJoined(session)
  let isAbsentStudent = true
  let isAbsentVolunteer = true
  for (const message of messages) {
    if (message.user === student.id) isAbsentStudent = false
    if (message.user === volunteer.id) isAbsentVolunteer = false
    if (!isAbsentStudent && !isAbsentVolunteer) break
  }
  return isAbsentStudent || isAbsentVolunteer
}

function getMessagesAfterVolunteerJoined(session) {
  return session.messages.filter(
    (message: Record<string, any> & { createdAt: string }) =>
      new Date(message.createdAt).getTime() >=
      new Date(session.volunteerJoinedAt).getTime()
  )
}

export default {
  async endSession(sessionId: string, subTopic: string, store) {
    try {
      await NetworkService.endSession({ sessionId })
      // TODO: Just return the mutated session in `NetworkService.endSession`.
      store?.dispatch('session/fetchLatestSession')
      store?.dispatch('federalWorkStudyVolunteer/startCooldown')
    } catch (err) {
      if (err?.response?.data?.err !== 'Session has already ended') {
        throw err
      }
    }
    AnalyticsService.captureEvent(EVENTS.SESSION_ENDED, {
      event: EVENTS.SESSION_ENDED,
      sessionId: sessionId,
      subject: subTopic,
    })
  },

  postSessionRedirect(router, session) {
    // redirect to the home page if there is an absent user
    // or if the student was not paired with a tutor
    if (isAbsentUser(session)) return router.push('/')
    router.push(`/feedback/${session.id}`)
  },

  async endAndExitSession({ store, router }) {
    const isSessionRecapDmsActive =
      store.getters['featureFlags/isSessionRecapDmsActive']
    const isStudent = store.getters['user/isStudent']
    await this.endSession(
      store.state.user.session.id,
      store.state.user.session.subTopic,
      store
    )
    store.dispatch('user/sessionDisconnected')
    // Do not send the user directly to the feedback page if they can leave DMs
    if (!isSessionRecapDmsActive)
      this.postSessionRedirect(router, store.state.user.session)
    // Send students directly to feedback page whether or not volunteers can send DMs.
    if (isStudent) this.postSessionRedirect(router, store.state.user.session)
    store.commit('user/setSessionIsEnding', false)
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

  getTotalSessionsForPair({
    volunteerId,
    studentId,
  }: {
    volunteerId: string
    studentId: string
  }) {
    return NetworkService.getTotalSessionHistory({ volunteerId, studentId })
      .then((res) => {
        return res.data.total
      })
      .catch((error) => {
        throw errorFromHttpResponse(error)
      })
  },
}
