export default {
  namespaced: true,
  state: {
    component: null,
    modalTemplateProps: {},
    componentProps: {},
    isShown: false,
  },
  mutations: {
    setComponent: (state, component = null) => (state.component = component),
    setModalTemplateProps: (state, props = {}) =>
      (state.modalTemplateProps = props),
    setIsShown: (state, b) => (state.isShown = !!b),
    setComponentProps: (state, props) => (state.componentProps = props),
  },
  actions: {
    show: ({ commit }, payload = {}) => {
      commit('setIsShown', true)
      commit('setComponent', payload.component)
      commit('setModalTemplateProps', payload.data)
      commit('setComponentProps', payload.componentProps)
    },
    update: ({ commit, state }, payload = {}) => {
      commit('setModalTemplateProps', {
        ...state.modalTemplateProps,
        ...(payload.modalTemplateProps ?? {}),
      })
      commit('setComponentProps', {
        ...state.componentProps,
        ...(payload.componentProps ?? {}),
      })
    },
    hide: ({ commit }) => {
      commit('setIsShown', false)
      commit('setComponent', null)
      commit('setModalTemplateProps', {})
      commit('setComponentProps', {})
    },
  },
}
