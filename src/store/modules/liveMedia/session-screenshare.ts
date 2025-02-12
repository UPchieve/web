export default {
  namespaced: true,
  state: {
    screenShareDimensions: {
      width: undefined,
      height: undefined,
    },
  },
  getters: {
    screenShareDimensions: (state) => {
      return state.screenShareDimensions
    },
  },
  mutations: {
    setScreenShareDimensions: (state, screenShareDimensions) =>
      (state.screenShareDimensions = screenShareDimensions),
  },
  actions: {
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
