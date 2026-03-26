import SessionService from '@/services/SessionService'
import Case from 'case'
import UserService from '@/services/UserService'
import ModalService from '@/services/ModalService'

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

/**
 * Ends the current session.
 * @param {object} context
 */
// TODO: Cleanup - not clear that this method is
// meant for the "RejoinSession" header/modal only.
// Also cleanup all the state.
export const endSession = (context) => {
  const sessionId = context.$store.state.user.session.id
  const subTopic = context.$store.state.user.session.subTopic
  SessionService.endSession(sessionId, subTopic, context.$store)
    .then(() => {
      context.$router.replace('/')
      context.$store.dispatch('user/fetch', context)
      context.$store.dispatch('app/modal/hide')
    })
    .catch(() => void ModalService.showAlert('Error', 'Could not end session'))
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
