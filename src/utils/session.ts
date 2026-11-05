import Case from 'case'
import UserService from '@/services/UserService'
import { dayjs } from '@/utils/time-utils'

/**
 * Starts a new session for the specified topic and subtopic.
 * @param {VueRouter} router
 * @param {string} topic e.g. "math"
 * @param {string} subtopic e.g. "algebra"
 * @param queryParams {object}
 */
export const startSession = (router, topic, subtopic, queryParams) => {
  const query = queryParams
    ? `?${new URLSearchParams(queryParams).toString()}`
    : ''
  router.push(`/session/${Case.kebab(topic)}/${Case.kebab(subtopic)}${query}`)
}

/**
 * Rejoins an existing session.
 * @param {VueRouter} router
 * @param {string} sessionPath
 */
export const rejoinSession = async (
  context,
  sessionPath,
  userType,
  roleInCurrentSession
) => {
  if (sessionPath) {
    if (roleInCurrentSession !== userType)
      await UserService.switchActiveRole(context, roleInCurrentSession)
    context.$router.push(sessionPath)
  }
}

function getScreenShareDisclaimerLocalStorageKey() {
  return `ACCEPTED_SCREENSHARE_TERMS`
}

export function hasSeenScreenShareDisclaimerThisSession() {
  return !!sessionStorage.getItem(getScreenShareDisclaimerLocalStorageKey())
}

export function setHasSeenScreenShareDisclaimerThisSession() {
  return sessionStorage.setItem(
    getScreenShareDisclaimerLocalStorageKey(),
    'true'
  )
}

function getActiveHolds(session) {
  const now = new Date()
  return (session?.holds ?? []).filter(
    (hold) => new Date(hold.startsAt) <= now && new Date(hold.endsAt) > now
  )
}

export function maybeGetActiveSessionHoldForUser(session, forUserId) {
  const activeHolds = getActiveHolds(session)
  return activeHolds.find((hold) => hold.coachId === forUserId)
}

export function getWaitTime(session: { createdAt: Date }): {
  displayValue: string
  milliseconds: number
} {
  const createdAt = dayjs(new Date(session.createdAt))
  const now = dayjs(new Date())
  const waitDuration = dayjs.duration(now.diff(createdAt))

  // Total hours, since `hours()` wraps around every 24 hours
  const hours = Math.floor(waitDuration.asHours())
  const minutes = waitDuration.minutes()
  const seconds = waitDuration.seconds()

  // total ms waiting
  const milliseconds = waitDuration.asMilliseconds()

  if (hours > 0) {
    return {
      displayValue: `${hours}hr+`,
      milliseconds,
    }
  }
  const secondsDisplay = seconds > 9 ? seconds : `0${seconds}`
  return { displayValue: `${minutes}:${secondsDisplay}`, milliseconds }
}
