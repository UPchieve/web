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

export function getClientUUID() {
  const savedClientUUID = sessionStorage.getItem('clientUUID')
  const clientUUID = savedClientUUID ?? crypto.randomUUID()
  sessionStorage.setItem('clientUUID', clientUUID)
  return clientUUID
}

export async function trackActivity() {
  return NetworkService.trackPresenceActive(getClientUUID())
}

export async function trackPassivity() {
  const clientUUID = sessionStorage.getItem('clientUUID')
  if (clientUUID) {
    return NetworkService.trackPresencePassive(clientUUID)
  }
}

/**
 * Pings subway such that: if the user is currently PASSIVE_ON_SITE,
 * subway will set a countdown for marking them as INACTIVE_ON_SITE.
 * when the countdown reaches 0, if they are still passive, mark them as inactive.
 */
export async function checkForInactivity() {
  return NetworkService.trackPresenceCheckForInactivity(getClientUUID())
}
