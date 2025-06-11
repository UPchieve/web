import NetworkService from '@/services/NetworkService'

export default {
  namespaced: true,
  state: {
    flags: {},
  },
  mutations: {
    setUserProductFlags: (state, flags) => (state.flags = flags),
    setImpactStudyCampaigns: (state, campaigns) =>
      (state.flags.impactStudyCampaigns = campaigns),
  },
  actions: {
    async getUserProductFlags({ commit }) {
      const response = await NetworkService.getUserProductFlags()
      commit('setUserProductFlags', response.data.flags ?? {})
    },
    addToProductFlags: ({ commit, state }, data) => {
      const { flags } = state
      const updatedFlags = { ...flags, ...data }
      commit('setUserProductFlags', updatedFlags)
    },
  },
}
