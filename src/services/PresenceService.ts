import { createActor } from 'xstate'
import NetworkService from './NetworkService'
import { activityMachine } from './PresenceService/machine'
import type { RootState } from '@/store'
import { Store } from 'vuex'

const DEFAULT_TRACKING_INTERVAL = 1000 * 15
let actor: ReturnType<typeof createActor>
export function initActivityTracking(
  store: Store<RootState>,
  trackingInterval = DEFAULT_TRACKING_INTERVAL
) {
  if (actor) return actor

  actor = createActor(activityMachine, {
    input: { getStore: () => store, trackingInterval },
  })
  actor.start()
  return actor
}

export async function trackActivity() {
  const savedClientUUID = localStorage.getItem('clientUUID')
  const clientUUID = savedClientUUID ? savedClientUUID : crypto.randomUUID()
  localStorage.setItem('clientUUID', clientUUID)
  return NetworkService.trackPresenceActive(clientUUID)
}

export async function trackInactivity() {
  /*
   * NOTE: if there is no clientUUID in local storage
   * (it could happen due to disk space usage but is unlikely.
   * it's more likely that there's a bug and we didn't set clientUUID)
   * then we will just let the redis key expire and create the INACTIVE_ON_SITE user_action
   * this does mean that a presence session could be artifically longer by
   * 2 minutes longer (or wheatever we set the TTL to in redis)
   */
  const clientUUID = localStorage.getItem('clientUUID')
  if (clientUUID) {
    return NetworkService.trackPresenceInactive(clientUUID)
  }
}
