import { assign, setup, spawnChild, stopChild } from 'xstate'
import {
  activityListeners,
  authWatcher,
  trackingInterval,
  visibilityWatcher,
} from './actors'
import * as PresenceService from '../PresenceService'
import type { RootState } from '@/store'
import { Store } from 'vuex'

const config = setup({
  types: {
    context: {} as {
      getStore: () => Store<RootState>
      activityHappened: boolean
      trackingInterval: number
    },
    input: {} as { getStore: () => Store<RootState>; trackingInterval: number },
    events: {} as
      | { type: 'AUTHENTICATED' }
      | { type: 'UNAUTHENTICATED' }
      | { type: 'DOCUMENT_VISIBLE' }
      | { type: 'DOCUMENT_HIDDEN' }
      | { type: 'USER_ACTIVITY' },
  },
  guards: {
    ifActivityHappened: ({ context }) => context.activityHappened,
  },
  actions: {
    trackActivity: () => PresenceService.trackActivity(),
    trackInactivity: () => PresenceService.trackInactivity(),
  },
  actors: {
    visibilityWatcher,
    authWatcher,
    activityListeners,
    trackingInterval,
  },
})

export const activityMachine = config.createMachine({
  id: 'presenceMachine',
  context: ({ input }) => ({
    getStore: input.getStore,
    activityHappened: false,
    trackingInterval: input.trackingInterval,
  }),
  initial: 'UserUnauthenticated',
  entry: [
    spawnChild('authWatcher', {
      id: 'authWatcher',
      input: ({ context }) => ({ getStore: context.getStore }),
    }),
  ],
  states: {
    UserUnauthenticated: {
      on: {
        AUTHENTICATED: { target: 'UserAuthenticated' },
      },
    },
    UserAuthenticated: {
      entry: [spawnChild('visibilityWatcher', { id: 'visibilityWatcher' })],
      exit: [stopChild('visibilityWatcher')],
      initial: 'TrackingPaused',
      on: {
        UNAUTHENTICATED: { target: 'UserUnauthenticated' },
      },
      states: {
        TrackingPaused: {
          description: `
            This is kind of a holding state until all of visiblityWatcher spawns and sends its first event
          `,
          on: {
            DOCUMENT_VISIBLE: {
              target: 'TrackingStarted',
              actions: assign({ activityHappened: true }),
            },
          },
        },
        TrackingStarted: {
          description: `
            After a specified interval (trackingInterval), we check to see if any activity happened
            if it did, we relay that to subway, if it didn't we do nothing.

            We use this interval to batch user activity into one call. In the future, if we wanted
            more granularity, context.activityHappened could be an array of all event types since
            the last update and we could send them up together. For now, knowing whether any
            activity happened or not is enough.
          `,
          entry: [
            'trackActivity',
            assign({ activityHappened: false }),
            spawnChild('activityListeners', { id: 'activityListeners' }),
            spawnChild('trackingInterval', {
              id: 'trackingInterval',
              input: ({ context }) => ({
                trackingInterval: context.trackingInterval,
              }),
            }),
          ],
          exit: [stopChild('activityListeners'), stopChild('trackingInterval')],
          on: {
            USER_ACTIVITY: {
              actions: [assign({ activityHappened: true })],
            },
            TRACK_ACTIVITY: {
              guard: 'ifActivityHappened',
              actions: ['trackActivity', assign({ activityHappened: false })],
            },
            DOCUMENT_HIDDEN: {
              target: 'TrackingPaused',
              actions: ['trackInactivity', assign({ activityHappened: false })],
            },
          },
        },
      },
    },
  },
})
