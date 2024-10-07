import SessionService from '@/services/SessionService'
import LoggerService from '@/services/LoggerService'

const SESSION_REQUEST_COOLDOWN_MS = 1000 * 60 * 5 // 5 minutes

export default {
  namespaced: true,
  state: {
    isPartnerOnline: false,
    latestSession: undefined,
  },

  getters: {
    sessionRequestCooldownMinutes: (state): number | undefined => {
      if (!state.latestSession) return 0

      if (!state.latestSession.endedByUserRole) return undefined

      // Only apply a cooldown if the student ended a session
      if (state.latestSession.endedByUserRole === 'volunteer') return 0

      const sessionCreatedAtMs = new Date(
        state.latestSession.createdAt
      ).getTime()
      const currentTimeMs = new Date().getTime()
      const timeSinceLastSessionStartedMs = currentTimeMs - sessionCreatedAtMs
      if (timeSinceLastSessionStartedMs >= SESSION_REQUEST_COOLDOWN_MS) return 0

      const diffInMs =
        SESSION_REQUEST_COOLDOWN_MS - timeSinceLastSessionStartedMs
      return Math.ceil(Math.max(0, diffInMs / 60000))
    },
  },

  mutations: {
    setIsPartnerOnline: (state, flag) => (state.isPartnerOnline = flag),
    setLatestSession: (state, session) => (state.latestSession = session),
  },

  actions: {
    onlineStatusForPartner({ commit }, flag) {
      commit('setIsPartnerOnline', flag)
    },
    fetchLatestSession: ({ commit }) => {
      SessionService.getLatestSession()
        .then(({ sessionData }) => {
          commit('setLatestSession', sessionData)
        })
        .catch((err) => {
          commit('setLatestSession', {})
          LoggerService.noticeError(
            `Could not set latest session in session store: ${err}`
          )
        })
    },
  },
}
