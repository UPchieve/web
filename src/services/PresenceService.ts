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
export async function checkForInactivity() {
  return NetworkService.trackPresenceCheckForInactivity(getClientUUID())
}
