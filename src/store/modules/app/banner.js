export default {
  namespaced: true,
  state: {
    component: null,
    isShown: false
  },
  mutations: {
    setComponent: (state, component = null) => (state.component = component),
    setIsShown: (state, b) => (state.isShown = !!b)
  },
  actions: {
    show: ({ commit }, payload = {}) => {
      commit('setIsShown', true)
      commit('setComponent', payload.component)
    },
    hide: ({ commit }) => {
      commit('setIsShown', false)
      commit('setComponent', null)
    }
  }
}
