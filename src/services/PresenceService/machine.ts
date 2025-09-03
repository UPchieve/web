import { assign, setup, spawnChild, stopChild } from 'xstate'
import {
  activityListeners,
  authWatcher,
  trackingInterval,
  visibilityWatcher,
  pagehideWatcher,
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
      tabIsClosing: boolean
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
    tabIsNotClosing: ({ context }) => !context.tabIsClosing,
  },
  actions: {
    trackActivity: () => PresenceService.trackActivity(),
    trackPassivity: () => PresenceService.trackPassivity(),
  },
  actors: {
    visibilityWatcher,
    pagehideWatcher,
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
    tabIsClosing: false,
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
      description: `
        Sets up our watchers to handle the user closing the tab/window and
        the user backgrounding the tab/window. Those watchers will trigger
        calls to the track passivitiy or inactivity.
      `,
      entry: [
        spawnChild('visibilityWatcher', {
          id: 'visibilityWatcher',
          input: ({ context }) => context,
        }),
        spawnChild('pagehideWatcher', {
          id: 'pagehideWatcher',
          input: ({ context }) => context,
        }),
      ],
      exit: [stopChild('visibilityWatcher'), stopChild('pagehideWatcher')],
      initial: 'TrackingPaused',
      on: {
        UNAUTHENTICATED: { target: 'UserUnauthenticated' },
        DOCUMENT_UNLOADED: {
          actions: [assign({ tabIsClosing: true })],
        },
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
              description: `
                This event transition and actions should only happen when the
                tab is being backgrounded.
                When the tab is closing (the 'pagehideWatcher' takes care of this), stop
                this transition with the guard.
              `,
              guard: 'tabIsNotClosing',
              target: 'TrackingPaused',
              actions: ['trackPassivity', assign({ activityHappened: false })],
            },
          },
        },
      },
    },
  },
})
