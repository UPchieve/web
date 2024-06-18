export default {
  namespaced: true,
  state: {
    isPartnerOnline: false,
  },
  mutations: {
    setIsPartnerOnline: (state, flag) => (state.isPartnerOnline = flag),
  },

  actions: {
    onlineStatusForPartner({ commit }, flag) {
      commit('setIsPartnerOnline', flag)
    },
  },
}
