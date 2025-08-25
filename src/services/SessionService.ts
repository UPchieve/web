import { EVENTS } from '../consts'
import router from '@/router'
import store from '@/store'
import AnalyticsService from './AnalyticsService'
import NetworkService from './NetworkService'
import { SessionErrorType } from '@/views/SessionView/SessionErrorModal.vue'
import errorFromHttpResponse from '../utils/error-from-http-response.js'

export type Session = any

function isAbsentUser(session: Session) {
  const { student, volunteer } = session
  if (!volunteer) return true

  let isAbsentStudent = true
  let isAbsentVolunteer = true

  for (const message of session.messages) {
    if (
      new Date(message.createdAt).getTime() <
      new Date(session.volunteerJoinedAt).getTime()
    ) {
      // Skip messages that were sent before the volunteer joined.
      continue
    }
    if (message.user === student.id) isAbsentStudent = false
    if (message.user === volunteer.id) isAbsentVolunteer = false
    if (!isAbsentStudent && !isAbsentVolunteer) return false
  }

  return isAbsentStudent || isAbsentVolunteer
}

export default {
  async createOrJoinSession(
    topic: string,
    subTopic: string,
    sessionId?: string,
    assignmentId?: string,
    joinedFrom?: string,
    isSettingGoalsSession?: boolean
  ) {
    const {
      data: { isValid },
    } = await NetworkService.getIsSubjectValid(subTopic, topic)
    if (!isValid) {
      throw new Error(SessionErrorType.INVALID_SUBJECT_TOPIC)
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
      isSettingGoalsSession,
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

  // TODO: Make all paths use `endAndExitSession` instead.
  async endSession(sessionId: string, subTopic: string) {
    try {
      const currentSession = store.state.user.session
      const endSessionResponse = await NetworkService.endSession({ sessionId })
      const updatedSession = {
        ...currentSession,
        ...endSessionResponse.data.session,
      }
      store.commit('session/setLatestSession', updatedSession) // @TODO - Eventually remove duplicate state in latestSession
      store.commit('user/setSession', updatedSession)
      const isSessionStudent =
        store.state.user.user.id === currentSession.student.id
      if (isSessionStudent) {
        store.dispatch('session/startCooldownInterval')
      }
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

  async endAndExitSession() {
    const endedSession = { ...store.state.user.session }

    await this.endSession(
      store.state.user.session.id,
      store.state.user.session.subTopic
    )

    const isSessionRecapDmsActive =
      store.getters['featureFlags/isSessionRecapDmsActive']
    const isStudent = store.getters['user/isStudent']
    if (!isSessionRecapDmsActive || isStudent) {
      // Do not send the coach directly to the feedback page if
      // they can leave DMs.
      this.postSessionRedirect(endedSession)
    }

    store.commit('user/setSessionIsEnding', false)
  },

  postSessionRedirect(session: Session) {
    // Redirect to the home page if there is an absent user
    // or if the student was not paired with a tutor.
    if (isAbsentUser(session)) return router.push('/')
    router.push(`/feedback/${session.id}`)
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
