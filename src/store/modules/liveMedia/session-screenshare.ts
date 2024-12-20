import {
  ScreenShareEvent,
  ScreenShareState,
} from '@/services/LiveShareService/machines/screenShareMachine'

export default {
  namespaced: true,
  state: {
    screenShareActive: false,
    screenShareDimensions: {
      width: undefined,
      height: undefined,
    },
  },
  getters: {
    screenShareActive: (state) => {
      return state.screenShareActive
    },
    screenShareDimensions: (state) => {
      return state.screenShareDimensions
    },
  },
  mutations: {
    setScreenShareActive: (state, screenShareActive) =>
      (state.screenShareActive = screenShareActive),
    setScreenShareDimensions: (state, screenShareDimensions) =>
      (state.screenShareDimensions = screenShareDimensions),
  },
  actions: {
    toggleScreenShareWindow: async ({ commit, state, rootState }) => {
      commit('setScreenShareActive', !state.screenShareActive)

      if (rootState.user.user.isVolunteer) {
        const screenShareActor = rootState.liveMedia.screenShareActor
        if (screenShareActor.state === ScreenShareState.SharingScreen) {
          await screenShareActor.send(ScreenShareEvent.STOP_SCREEN_SHARE)
        } else {
          await screenShareActor.send(ScreenShareEvent.SHARE_SCREEN)
        }
      }
    },
    setScreenShareDimensions: async (
      { commit, rootGetters },
      screenShareDimensions
    ) => {
      // do we want a smarter algorithm here?
      // maybe get the ratio then check the window.innerHeight and window.innerWidth,
      // based on the ratio, choose one of them and scale it down to 50% of the window

      const ratio = screenShareDimensions.width / screenShareDimensions.height
      const smallerWindowDimension = Math.min(
        window.innerWidth,
        window.innerHeight
      )
      const smallerWindowDimensionName =
        smallerWindowDimension === window.innerWidth ? 'width' : 'height'

      const isMobileMode = rootGetters['app/mobileMode']
      // make the smallest half the size of the window in non-mobile mode other wise 75%
      const smallerDimension = isMobileMode
        ? smallerWindowDimension * 0.75
        : smallerWindowDimension / 2
      let newWidth, newHeight
      if (smallerWindowDimensionName === 'width') {
        newWidth = smallerDimension
        newHeight = smallerDimension / ratio
      } else {
        newHeight = smallerDimension
        newWidth = smallerDimension / ratio
      }

      commit('setScreenShareDimensions', {
        width: newWidth,
        height: newHeight,
      })
    },
  },
}
