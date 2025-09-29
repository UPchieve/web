import * as AmericaCountsVolunteerService from '@/services/AmericaCountsVolunteerService'

export default {
  namespaced: true,

  state: {
    cooldownId: null,
  },

  mutations: {
    setCooldownId: (state, cooldownId) => (state.cooldownId = cooldownId),
  },

  actions: {
    startCooldown({ commit, getters, rootGetters }, cooldown) {
      if (getters['isAmericaCountsVolunteer']) {
        const id = setTimeout(() => {
          commit('setCooldownId', null)
          const sessions = rootGetters['volunteer/unlockedOpenSessions']
          AmericaCountsVolunteerService.maybeAutoJoinOldestSession(sessions)
        }, cooldown)
        commit('setCooldownId', id)
      }
    },
  },

  getters: {
    isAmericaCountsVolunteer(_state, _getters, rootState) {
      return rootState.user.user?.sponsorships?.some(
        (sponsorship) => sponsorship.key === 'america-counts'
      )
    },
  },
}
