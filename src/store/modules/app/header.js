export default {
  namespaced: true,
  state: {
    component: null,
    data: {},
    isShown: false
  },
  mutations: {
    setComponent: (state, component = null) => (state.component = component),
    setData: (state, data = {}) => (state.data = data),
    setIsShown: (state, b) => (state.isShown = !!b)
  },
  actions: {
    show: ({ commit }, payload = {}) => {
      commit('setIsShown', true)
      commit('setComponent', payload.component)
      commit('setData', payload.data)
    },
    hide: ({ commit }) => {
      commit('setIsShown', false)
      commit('setComponent', null)
      commit('setData', {})
    }
  }
}
