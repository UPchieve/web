import { reactive, ref } from 'vue'
import LoggerService from '@/services/LoggerService'
import store from '@/store'
import {
  ScreenShareActions,
  ScreenShareEvent,
  screenShareMachine,
  ScreenShareState,
} from './machines/screenShareMachine'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

interface ScreenShareContext {
  targetElement: HTMLCanvasElement | HTMLVideoElement | null
}

const INITIAL_STATE: ScreenShareContext = {
  targetElement: null,
}

export function createScreenShareActor({
  inspect = false,
}: {
  inspect: boolean
}) {
  const stream = store.state.liveMedia.zoomClient.getMediaStream()
  const zoomClient = store.state.liveMedia.zoomClient
  const state = ref(ScreenShareState.Initial)
  const context = reactive({ ...INITIAL_STATE })
  const actions: Record<
    ScreenShareActions,
    (context: any, payload?: any) => void
  > = {
    [ScreenShareActions.DESTROY]: async () => {
      await stream.stopShareScreen()
      await stream.stopShareView()
      store.commit('liveMedia/screenShare/setScreenShareActive', false)
    },
    [ScreenShareActions.JOIN_SCREEN_SHARE]: async ({ context, payload }) => {
      if (context.targetElement && payload.zoomUserId) {
        // TODO: this sometimes hangs forever
        await stream.startShareView(context.targetElement, payload.zoomUserId)
        await send(ScreenShareEvent.JOINED_SCREEN_SHARE)
        AnalyticsService.captureEvent(
          EVENTS.SCREENSHARE_USER_VIEWED_SCREENSHARE
        )
        store.commit('liveMedia/screenShare/setScreenShareActive', true)
      } else if (context.targetElement) {
        for (const user of zoomClient.getAllUser()) {
          if (user.sharerOn) {
            await stream.startShareView(context.targetElement, user.userId)
          }
        }
      } else {
        await send(ScreenShareEvent.NO_CANVAS_ELEMENT)
      }
    },
    [ScreenShareActions.CHECK_SCREEN_SHARE]: async ({ context, payload }) => {
      if (payload.targetElement) {
        context.targetElement = payload.targetElement
      }
      if (context.targetElement) {
        const userSharing = zoomClient
          .getAllUser()
          .find((user) => user.sharerOn)
        if (
          userSharing &&
          userSharing.userIdentity !== store.state.user.user.id
        ) {
          await send(ScreenShareEvent.SCREEN_SHARE_ACTIVATED, {
            zoomUserId: userSharing.userId,
          })
        } else {
          await send(ScreenShareEvent.NO_SCREEN_SHARE)
        }
      } else {
        await send(ScreenShareEvent.NO_SCREEN_SHARE)
      }
    },
    [ScreenShareActions.START_SCREEN_SHARE]: async ({ context }) => {
      try {
        await stream.startShareScreen(context.targetElement)
        await send(ScreenShareEvent.CHOOSE_SCREEN)
      } catch (error) {
        await send(ScreenShareEvent.CANCEL_SCREEN_SELECTION)
        store.commit('liveMedia/screenShare/setScreenShareActive', false)
        LoggerService.noticeError({ error }, 'Failed to start screenshare')
      }
    },
    [ScreenShareActions.SHARING_SCREEN]: async () => {
      AnalyticsService.captureEvent(EVENTS.SCREENSHARE_USER_SHARED_SCREEN)
    },
    [ScreenShareActions.STOP_SCREEN_SHARE]: async ({ context }) => {
      await stream.stopShareScreen()
      AnalyticsService.captureEvent(EVENTS.SCREENSHARE_USER_STOPPED_SCREENSHARE)
      // TODO: is there a method for this?
      if (context.targetElement && context.targetElement.tagName === 'CANVAS') {
        context.targetElement
          .getContext('2d')
          .clearRect(
            0,
            0,
            context.targetElement.width,
            context.targetElement.height
          )
      }
      store.commit('liveMedia/screenShare/setScreenShareActive', false)
      await send(ScreenShareEvent.SCREEN_SHARE_STOPPED)
    },
    [ScreenShareActions.STOP_VIEW_SCREEN_SHARE]: async () => {
      await stream.stopShareView()
      AnalyticsService.captureEvent(
        EVENTS.SCREENSHARE_USER_STOPPED_VIEWING_SCREENSHARE
      )
      store.commit('liveMedia/screenShare/setScreenShareActive', false)
      await send(ScreenShareEvent.VIEW_SCREEN_SHARE_STOPPED)

      // Dispatch system message to let the user know that the session partner has stopped sharing their screen
      const sessionId = store.state.user.session.id
      const sessionPartnerName = store.getters['user/sessionPartner'].firstName
      store.dispatch('user/addMessage', {
        contents: `${sessionPartnerName} has stopped sharing their screen`,
        sessionId,
        isSystemMessage: true,
        createdAt: new Date().toISOString(),
      })
    },
    [ScreenShareActions.REMOVE_VIEWER]: async ({ context }) => {
      await stream.stopShareView()
      AnalyticsService.captureEvent(
        EVENTS.SCREENSHARE_USER_STOPPED_VIEWING_SCREENSHARE
      )
      context.targetElement = null
      store.commit('liveMedia/screenShare/setScreenShareActive', false)
      await send(ScreenShareEvent.VIEW_SCREEN_SHARE_STOPPED)
    },
  }

  function start() {
    // If someone is sharing, and we have a place to render it, then render it.
    store.state.liveMedia.zoomClient.getAllUser().forEach((user) => {
      if (user.sharerOn && context.targetElement) {
        send(ScreenShareEvent.SCREEN_SHARE_ACTIVATED, user.userId)
      }
    })
  }

  async function send(event: ScreenShareEvent, payload?: any) {
    if (inspect) {
      // eslint-disable-next-line no-console
      console.debug(`recieved event: ${event} while in state: ${state.value}`)
    }
    const nextState = screenShareMachine.states[state.value].on?.[event]
    if (nextState) {
      // Check the leaf nodes for a transition first
      state.value = nextState
      if (inspect) console.debug(`set state to: ${nextState}`)

      const nextStateConfig =
        screenShareMachine.states[nextState as ScreenShareState]

      for (const action of nextStateConfig?.actions ?? []) {
        if (inspect) console.debug(`executing action: ${action}`)
        await actions[action]({ context, payload })
      }
    } else if (screenShareMachine.on?.[event]) {
      // Then go up to the root level to see if there's a transition defined
      const nextState = screenShareMachine.on?.[event]

      if (nextState) {
        state.value = nextState
        const nextStateConfig =
          screenShareMachine.states[nextState as ScreenShareState]
        for (const action of nextStateConfig?.actions ?? []) {
          await actions[action]({ context, payload })
        }
      }
    } else {
      // TODO: This should really be a warning in dev only
      LoggerService.noticeError(
        `ScreenShareService: Invalid transition, event: '${event}' sent while in state: '${state.value}'`
      )
    }
  }

  return {
    state,
    start,
    send,
  }
}
