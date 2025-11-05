import store from '@/store'
import router from '@/router'
import SessionService, { type Session } from '@/services/SessionService'
import Case from 'case'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const THREE_MINUTES = 1000 * 60 * 3
export const MINIMUM_TIME_BETWEEN_SESSIONS = THREE_MINUTES

export const AMERICA_COUNTS_SUBTOPICS = [
  '6thGradeMath',
  '7thGradeMath',
  '8thGradeMath',
  'prealgebra',
  'algebraOne',
]

export const AMERICA_COUNTS_GRADE_LEVELS = ['6th', '7th', '8th', '9th']

export function isEligibleSession({
  volunteer,
  session,
}: {
  volunteer: { subjects: string[] }
  session: {
    student: { currentGradeName: string }
    subTopic: string
  }
}) {
  return (
    volunteer.subjects.includes(session.subTopic) &&
    AMERICA_COUNTS_SUBTOPICS.includes(session.subTopic) &&
    AMERICA_COUNTS_GRADE_LEVELS.includes(session.student.currentGradeName)
  )
}

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
  const path = `/session/${Case.kebab(type)}/${Case.kebab(subTopic)}/${id}`

  if (type && subTopic && id) {
    router.push(path)
  }
}

/*
  America Counts sessions are sessions that are automatically
  joined by the volunteer when they are accepted into the session.

  We need to check if the volunteer is...
    1. an America Counts volunteer
    2. not currently in a session
    3. they are outside of their cooldown period
    4. student is NOT a test user or shadow banned
    5. student is in one of the approved AMERICA_COUNTS_GRADE_LEVELS above
        AND is one of the whitelisted subjects - AMERICA_COUNTS_SUBTOPICS above
        NOTE: this check is `isEligibleSession` fn above which is called
        in volunteer/handleIncomingSessions method since we also don't want
        to display them on the dashboard

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
        'americaCountsVolunteer/startCooldown',
        MINIMUM_TIME_BETWEEN_SESSIONS - timeSinceLatestSession
      )
      return false
    }
  }

  return (
    !isOnAutoJoinDisabledPage() &&
    store.getters['volunteer/isReadyToTutor'] &&
    store.getters['americaCountsVolunteer/isAmericaCountsVolunteer'] &&
    store.state.americaCountsVolunteer.cooldownId === null
  )
}

const NO_AUTO_JOIN_URL_FRAGMENTS = [
  'feedback',
  'sessions',
  'session',
  'training',
]
function isOnAutoJoinDisabledPage() {
  const path = router.currentRoute.value.path
  const pathParts = path.split('/')
  const doesIntersect = pathParts.some((part) =>
    NO_AUTO_JOIN_URL_FRAGMENTS.includes(part)
  )
  return doesIntersect
}
