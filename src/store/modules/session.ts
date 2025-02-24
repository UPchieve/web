import type { ActionContext } from 'vuex'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import type { RootState } from '@/store/index'
import errorFromHttpResponse from '@/utils/error-from-http-response'

const SESSION_REQUEST_COOLDOWN_MS = 1000 * 60 * 5 // 5 minutes
const ONE_MINUTE_IN_MS = 1000 * 60

type Session = {
  id: string
  createdAt: Date
  endedByUserRole?: 'student' | 'volunteer'
  subject: string
  timeTutored: number
}

export type SessionState = {
  isPartnerOnline: boolean
  latestSession?: Session
  cooldownMinutes: number
}

export default {
  namespaced: true,
  state: {
    isPartnerOnline: false,
    latestSession: undefined,
    cooldownMinutes: 0,
  } as SessionState,

  getters: {
    hasCooldown(state: SessionState) {
      return state.cooldownMinutes > 0
    },
  },

  mutations: {
    setIsPartnerOnline: (state: SessionState, flag: boolean) =>
      (state.isPartnerOnline = flag),
    setLatestSession: (state: SessionState, session: Session) =>
      (state.latestSession = session),
    setCooldownMinutes: (state: SessionState, cooldownMinutes: number) =>
      (state.cooldownMinutes = cooldownMinutes),
  },

  actions: {
    onlineStatusForPartner(
      { commit }: ActionContext<SessionState, RootState>,
      flag: boolean
    ) {
      commit('setIsPartnerOnline', flag)
    },

    calculateCooldown({
      state,
    }: ActionContext<SessionState, RootState>): number {
      if (
        !state.latestSession ||
        // Session is still ongoing.
        !state.latestSession.endedByUserRole ||
        // Only apply a cooldown if the student ended a session.
        state.latestSession.endedByUserRole === 'volunteer'
      ) {
        return 0
      }

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

    async setCooldown({
      commit,
      dispatch,
    }: ActionContext<SessionState, RootState>) {
      const cooldown = await dispatch('calculateCooldown')
      commit('setCooldownMinutes', cooldown)
      return cooldown
    },

    async startCooldownInterval({
      dispatch,
    }: ActionContext<SessionState, RootState>) {
      const initialCooldown = await dispatch('setCooldown')

      if (initialCooldown > 0) {
        const interval = setInterval(async () => {
          const cooldown = await dispatch('setCooldown')
          if (cooldown === 0) {
            clearInterval(interval)
          }
        }, ONE_MINUTE_IN_MS)
      }
    },

    async fetchLatestSession({
      commit,
      dispatch,
    }: ActionContext<SessionState, RootState>) {
      try {
        const result = await NetworkService.latestSession()
        commit('setLatestSession', result.data.data)
        dispatch('startCooldownInterval')
      } catch (err) {
        commit('setLatestSession', {})
        LoggerService.noticeError(
          `Could not set latest session in session store: ${errorFromHttpResponse(err)}`
        )
      }
    },
  },
}
