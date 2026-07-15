import { EVENTS } from '../consts'
import router from '@/router'
import store from '@/store'
import AnalyticsService from './AnalyticsService'
import NetworkService, { isNetworkError } from './NetworkService'
import { SessionErrorType } from '@/views/SessionView/SessionErrorModal.vue'
import errorFromHttpResponse from '../utils/error-from-http-response.js'
import ModalService from './ModalService'
import axios from 'axios'
import LoggerService from './LoggerService'

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
    requestedVolunteerId?: string
  ) {
    const {
      data: { isValid },
    } = await NetworkService.getIsSubjectValid(subTopic, topic)
    if (!isValid) {
      throw new Error(SessionErrorType.INVALID_SUBJECT_TOPIC)
    }

    if (sessionId) {
      const {
        data: { session, isZwibserveSession, exclusiveVolunteerId },
      } = await NetworkService.joinSession({ sessionId, joinedFrom })
      await store.dispatch('user/updateSession', {
        ...session,
        type: topic,
        subTopic,
        _id: session.id,
      })
      return { session, isZwibserveSession, exclusiveVolunteerId }
    }

    const presessionSurvey = Object.keys(store.state.user.presessionSurvey)
      .length
      ? store.state.user.presessionSurvey
      : undefined
    const {
      data: { session, isZwibserveSession },
    } = await NetworkService.newSession({
      sessionType: topic,
      sessionSubTopic: subTopic,
      docEditorVersion: 2,
      assignmentId,
      requestedVolunteerId,
      presessionSurvey,
    })

    // Only attach exclusive metadata when this is actually an exclusive
    // request — regular SESSION_REQUESTED events stay byte-identical to
    // their pre-experiment shape so PostHog doesn't accumulate experiment-
    // specific property definitions on the broader event when we don't
    // need them.
    AnalyticsService.captureEvent(EVENTS.SESSION_REQUESTED, {
      event: EVENTS.SESSION_REQUESTED,
      sessionId: session.id,
      subject: subTopic,
      ...(requestedVolunteerId
        ? { isExclusiveRequest: true, requestedVolunteerId }
        : {}),
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
    return {
      session,
      isZwibserveSession,
      exclusiveVolunteerId: requestedVolunteerId,
    }
  },

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
      store.dispatch('americaCountsVolunteer/startCooldown')
      AnalyticsService.captureEvent(EVENTS.SESSION_ENDED, {
        event: EVENTS.SESSION_ENDED,
        sessionId: sessionId,
        subject: subTopic,
      })
    } catch (err) {
      if (!isNetworkError(err) || err.message !== 'Session has already ended') {
        throw err
      }
      LoggerService.noticeError(err)
    }
  },

  async endAndExitSession() {
    if (store.state.user.sessionIsEnding) return
    store.commit('user/setSessionIsEnding', true)

    const endedSession = { ...store.state.user.session }
    try {
      await this.endSession(endedSession.id, endedSession.subTopic)

      // Students always go directly to the post-session feedback flow on End.
      // Volunteers stay in the session to leave DMs (existing behavior).
      const canInitiateDms = store.getters['user/isVolunteer']
      if (!canInitiateDms) {
        this.postSessionRedirect(endedSession)
      }
    } catch {
      ModalService.showAlert('Error', 'Could not end session')
    } finally {
      store.commit('user/setSessionIsEnding', false)
      store.dispatch('app/modal/hide')
    }
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

  getRecapSessionForDms(sessionId: string) {
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

  async uploadSessionImage(sessionId: string, file: File) {
    const {
      data: { uploadUrl, imageUrl },
    } = await NetworkService.getSessionPhotoUploadUrl(sessionId)

    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
        // Required header for Azure
        'x-ms-blob-type': 'BlockBlob',
      },
    })
    return imageUrl
  },
}
