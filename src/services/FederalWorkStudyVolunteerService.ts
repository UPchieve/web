import store from '@/store'
import router from '@/router'
import SessionService from '@/services/SessionService'
import { kebabCase } from 'lodash-es'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const THREE_MINUTES = 1000 * 60 * 3
export const MINIMUM_TIME_BETWEEN_SESSIONS = THREE_MINUTES

function getOldestSession(sessions: Session[]) {
  return sessions.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  )[0]
}

export function joinOldestSession(sessions: Session[]) {
  joinSession(getOldestSession(sessions))
}

function joinSession(session: Session) {
  /* Copied from src/views/DashboardView/VolunteerDashboard/ListSessions.vue:79 */
  const { type, subTopic, id } = session
  const path = `/session/${kebabCase(type)}/${kebabCase(subTopic)}/${id}`

  if (type && subTopic && id) {
    router.push(path)
  }
}

/*
  Federal Work Study (FWS) sessions are sessions that are automatically
  joined by the volunteer when they are accepted into the session.

  We need to check if the volunteer is...
    1. a FWS volunteer
    2. not currently in a session
    3. they are outside of their cooldown period
    4. student is NOT a test user or shadow banned

    If all of these conditions are met, we can automatically join the session.

  ADDITIONALLY, after cool down, we need to check if there are any sessions waiting for pickup.
  if there are, we should join the one that has been waiting the longest.
*/
export async function maybeAutoJoinOldestSession(sessions: Session[]) {
  const currentSession = await SessionService.getCurrentSession()
  const isInASession = currentSession.sessionData.id
  const isReady = await shouldAutoJoin()

  if (sessions.length > 0 && !isInASession && isReady) {
    AnalyticsService.captureEvent(EVENTS.AUTO_JOINED_SESSION)
    joinOldestSession(sessions)
  }
}

async function shouldAutoJoin() {
  const latestSession = await SessionService.getLatestSession()

  if (latestSession.sessionData?.id) {
    const latestSessionCreatedAt = new Date(latestSession.sessionData.createdAt)
    const now = new Date()
    const timeSinceLatestSession =
      now.getTime() - latestSessionCreatedAt.getTime()

    if (timeSinceLatestSession < MINIMUM_TIME_BETWEEN_SESSIONS) {
      store.dispatch(
        'federalWorkStudyVolunteer/startCooldown',
        MINIMUM_TIME_BETWEEN_SESSIONS - timeSinceLatestSession
      )
      return false
    }
  }

  return (
    isNotTrainingPage() &&
    store.getters['volunteer/isReadyToTutor'] &&
    store.getters['federalWorkStudyVolunteer/isFederalWorkStudyVolunteer'] &&
    store.state.federalWorkStudyVolunteer.cooldownId === null
  )
}

function isNotTrainingPage() {
  const path = router.currentRoute.value.path
  const pathParts = path.split('/')
  return !pathParts.includes('training')
}
