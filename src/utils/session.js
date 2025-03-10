import SessionService from '@/services/SessionService'
import Case from 'case'
import NetworkService from '@/services/NetworkService'

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
  router,
  sessionPath,
  userType,
  roleInCurrentSession
) => {
  if (sessionPath) {
    if (roleInCurrentSession !== userType)
      await NetworkService.switchActiveRole(roleInCurrentSession)
    router.push(sessionPath)
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
    .catch(() => window.alert('Could not end session'))
}
