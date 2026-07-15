import Case from 'case'
import UserService from '@/services/UserService'

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
