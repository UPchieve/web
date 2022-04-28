export default {
  namespaced: true,
  state: {
    isShown: false,
    isCollapsed: true
  },
  mutations: {
    setIsShown: (state, b) => (state.isShown = !!b),
    setIsCollapsed: (state, b) => (state.isCollapsed = !!b)
  },
  actions: {
    show: ({ dispatch, commit }) => {
      dispatch('collapse')
      commit('setIsShown', true)
    },
    hide: ({ dispatch, commit }) => {
      dispatch('collapse')
      commit('setIsShown', false)
    },
    collapse: ({ commit }) => commit('setIsCollapsed', true),
    expand: ({ commit }) => commit('setIsCollapsed', false)
  }
}
