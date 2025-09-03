import type { RootState } from '@/store'
import { Store } from 'vuex'
import { fromCallback, type EventObject } from 'xstate'

const DOCUMENT_EVENTS_TO_TRACK = ['keyup', 'pointerdown', 'pointermove']
const WINDOW_EVENTS_TO_TRACK = ['scroll', 'resize']

export const activityListeners = fromCallback<EventObject>(({ sendBack }) => {
  const eventHandler = () => {
    sendBack({ type: 'USER_ACTIVITY' })
  }
  DOCUMENT_EVENTS_TO_TRACK.forEach((e) =>
    document.addEventListener(e, eventHandler)
  )
  WINDOW_EVENTS_TO_TRACK.forEach((e) =>
    window.addEventListener(e, eventHandler)
  )
  return () => {
    DOCUMENT_EVENTS_TO_TRACK.forEach((e) =>
      document.removeEventListener(e, eventHandler)
    )
    WINDOW_EVENTS_TO_TRACK.forEach((e) =>
      window.removeEventListener(e, eventHandler)
    )
  }
})

export const authWatcher = fromCallback<
  EventObject,
  { getStore: () => Store<RootState> }
>(({ sendBack, input }) => {
  const store = input.getStore()
  const removeWatcher = store.watch(
    (_state, getters) => getters['user/isAuthenticated'],
    (newValue) => {
      if (newValue) {
        sendBack({ type: 'AUTHENTICATED' })
      } else {
        sendBack({ type: 'UNAUTHENTICATED' })
      }
    }
  )

  // sendBack the current auth state on initial spawn
  if (store.getters['user/isAuthenticated']) {
    sendBack({ type: 'AUTHENTICATED' })
  } else {
    sendBack({ type: 'UNAUTHENTICATED' })
  }

  return () => {
    removeWatcher()
  }
})

export const visibilityWatcher = fromCallback<EventObject>(({ sendBack }) => {
  const visibilityHandler = () => {
    if (document.visibilityState === 'hidden') {
      sendBack({ type: 'DOCUMENT_HIDDEN' })
    } else {
      sendBack({ type: 'DOCUMENT_VISIBLE' })
    }
  }

  document.addEventListener('visibilitychange', visibilityHandler)

  // sendBack the current state on intial spawn
  visibilityHandler()

  return () => {
    document.removeEventListener('visibilitychange', visibilityHandler)
  }
})

export const pagehideWatcher = fromCallback<EventObject>(({ sendBack }) => {
  const pagehideHandler = () => sendBack({ type: 'DOCUMENT_UNLOADED' })
  window.addEventListener('pagehide', pagehideHandler)

  return () => {
    window.removeEventListener('pagehide', pagehideHandler)
  }
})

export const trackingInterval = fromCallback<
  EventObject,
  { trackingInterval: number }
>(({ sendBack, input }) => {
  const interval = setInterval(
    () => sendBack({ type: 'TRACK_ACTIVITY' }),
    input.trackingInterval
  )
  return () => {
    clearInterval(interval)
  }
})
