import * as FederalWorkStudyVolunteerService from '@/services/FederalWorkStudyVolunteerService'

export default {
  namespaced: true,

  state: {
    cooldownId: null,
  },

  mutations: {
    setCooldownId: (state, cooldownId) => (state.cooldownId = cooldownId),
  },

  actions: {
    startCooldown({ commit, rootState, getters }, cooldown) {
      if (getters['isFederalWorkStudyVolunteer']) {
        const id = setTimeout(() => {
          commit('setCooldownId', null)
          const sessions = rootState.volunteer.openSessions
          FederalWorkStudyVolunteerService.maybeAutoJoinOldestSession(sessions)
        }, cooldown)
        commit('setCooldownId', id)
      }
    },
  },

  getters: {
    isFederalWorkStudyVolunteer(_state, _getters, rootState) {
      return rootState.user.user.sponsorships.some(
        (sponsorship) => sponsorship.key === 'fws'
      )
    },
  },
}
