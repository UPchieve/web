import { EVENTS } from '../consts'
import router from '@/router'
import store from '@/store'
import AnalyticsService from './AnalyticsService'
import NetworkService from './NetworkService'
import errorFromHttpResponse from '../utils/error-from-http-response.js'

type Session = any

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

function getMessagesAfterVolunteerJoined(session: Session) {
  return session.messages.filter(
    (message: Record<string, any> & { createdAt: string }) =>
      new Date(message.createdAt).getTime() >=
      new Date(session.volunteerJoinedAt).getTime()
  )
}

export default {
  async createOrJoinSession(
    topic: string,
    subTopic: string,
    sessionId?: string,
    assignmentId?: string,
    joinedFrom?: string
  ) {
    const {
      data: { isValid },
    } = await NetworkService.getIsSubjectValid(subTopic, topic)
    if (!isValid) {
      throw new Error('Invalid subject and topic.')
    }

    if (sessionId) {
      const {
        data: { session },
      } = await NetworkService.joinSession({ sessionId, joinedFrom })
      await store.dispatch('user/updateSession', {
        ...session,
        type: topic,
        subTopic,
        _id: session.id,
      })
      return session
    }

    const presessionSurvey = Object.keys(store.state.user.presessionSurvey)
      .length
      ? store.state.user.presessionSurvey
      : undefined
    const {
      data: { session },
    } = await NetworkService.newSession({
      sessionType: topic,
      sessionSubTopic: subTopic,
      docEditorVersion: 2,
      assignmentId,
      presessionSurvey,
    })
    await Promise.all([
      store.dispatch('user/updateSession', {
        ...session,
        type: topic,
        subTopic,
        _id: session.id,
      }),
      store.dispatch('user/clearPresessionSurvey'),
    ])
    await router.replace(store.getters['user/sessionPath'])
    return session
  },

  async endSession(sessionId: string, subTopic: string) {
    try {
      await NetworkService.endSession({ sessionId })
      // TODO: Just return the mutated session in `NetworkService.endSession`.
      store.dispatch('user/clearSession')
      store.dispatch('session/fetchLatestSession')
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
    // Do not send the user directly to the feedback page if they can leave DMs
    if (!isSessionRecapDmsActive)
      this.postSessionRedirect(router, store.state.user.session)
    // Send students directly to feedback page whether or not volunteers can send DMs.
    if (isStudent) this.postSessionRedirect(router, store.state.user.session)
    store.commit('user/setSessionIsEnding', false)
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
