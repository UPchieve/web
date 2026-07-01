import type { ActionContext } from 'vuex'
import LoggerService from '@/services/LoggerService'
import errorFromHttpResponse from '@/utils/error-from-http-response'
import SessionService from '@/services/SessionService'

const SESSION_REQUEST_COOLDOWN_MS = 1000 * 60 * 5 // 5 minutes
const ONE_MINUTE_IN_MS = 1000 * 60

type Session = {
  id: string
  createdAt: Date
  subject: string
  timeTutored: number
  studentId: string
  endedAt?: Date
  endedByUserId?: string
  volunteerId?: string
}

type Zwibbler = {
  save(data: { format: 'image/jpeg' | 'image/png' }): string
}

type JourneySessionData = {
  dropdownLabel: string
  key: string
  stepNumber: number
  title: string
  subject: string
}

export type SessionState = {
  isPartnerOnline: boolean
  latestSession?: Session
  cooldownMinutes: number
  journeySessionData?: JourneySessionData
  zwibbler: Zwibbler | null
}

export default {
  namespaced: true,
  state: {
    isPartnerOnline: false,
    latestSession: undefined,
    cooldownMinutes: 0,
    journeySessionData: undefined,
    zwibbler: null,
  } as SessionState,

  getters: {
    sessionStatus(
      _state,
      _getters,
      rootState,
      rootGetters
    ): {
      text: string
      class:
        | ''
        | 'indicator--banned'
        | 'indicator--session'
        | 'indicator--onboarding'
    } {
      const inSession = rootGetters['user/isSessionAlive']
      const isVolunteer = rootGetters['user/isVolunteer']
      const user = rootState.user.user
      const status = {
        text: 'Ready to chat',
        class: '',
      }

      if (isVolunteer) {
        status.text = 'Ready to help'
      }

      if (user?.banType === 'complete') {
        status.class += 'indicator--banned'
        status.text = 'Paused'
      }

      if (inSession) {
        status.class += 'indicator--session'
        status.text = 'Chat in session'
      }

      if (isVolunteer && !user?.isOnboarded) {
        status.class += 'indicator--onboarding'
        status.text = 'Onboarding'
      }

      if (isVolunteer && user?.isOnboarded && !user?.isApproved) {
        status.class += 'indicator--onboarding'
        status.text = 'Pending approval'
      }

      return status
    },
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
    setJourneySessionData: (state: SessionState, data: JourneySessionData) =>
      (state.journeySessionData = data),
    setZwibbler: (state: SessionState, zwibbler: Zwibbler | null) =>
      (state.zwibbler = zwibbler),
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
      const hasNoLatestSession = !state.latestSession
      const isSessionOngoing = !state.latestSession?.endedAt
      const wasSessionEndedByVolunteer =
        !!state.latestSession?.volunteerId &&
        !!state.latestSession?.endedByUserId &&
        state.latestSession?.volunteerId === state.latestSession?.endedByUserId
      if (
        hasNoLatestSession ||
        isSessionOngoing ||
        wasSessionEndedByVolunteer
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
        const result = await SessionService.getLatestSession()
        commit('setLatestSession', result.sessionData)
        dispatch('startCooldownInterval')
      } catch (err) {
        commit('setLatestSession', {})
        LoggerService.noticeError(
          `Could not set latest session in session store: ${errorFromHttpResponse(err)}`
        )
      }
    },
    setZwibbler(
      { commit }: ActionContext<SessionState, RootState>,
      zwibbler: Zwibbler | null
    ) {
      commit('setZwibbler', zwibbler)
    },
  },
}
