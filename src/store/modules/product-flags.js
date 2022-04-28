import NetworkService from '@/services/NetworkService'

export default {
  namespaced: true,
  state: {
    flags: {}
  },
  mutations: {
    setUserProductFlags: (state, flags) => (state.flags = flags)
  },
  actions: {
    async getUserProductFlags({ commit }) {
      const response = await NetworkService.getUserProductFlags()
      commit('setUserProductFlags', response.body.flags)
    }
  },
}
