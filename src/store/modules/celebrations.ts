import type { Commit } from 'vuex'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import type { RootGetters } from '..'

export type Celebration = {
  id: number
  duration: number
}

export type State = {
  confettiCelebrations: Celebration[]
}

export const DEFAULT_CELEBRATION_DURATION = 2200
const MAX_CONFETTI_TRIGGERS = 3

export default {
  namespaced: true,
  state: {
    confettiCelebrations: [] as Celebration[],
  },
  mutations: {
    addConfetti: (state: State, celebration: Celebration) => {
      if (state.confettiCelebrations.length >= MAX_CONFETTI_TRIGGERS) {
        return
      }
      state.confettiCelebrations = [...state.confettiCelebrations, celebration]
    },
    removeConfetti: (state: State, id: number) =>
      (state.confettiCelebrations = state.confettiCelebrations.filter(
        (c: Celebration) => c.id !== id
      )),
  },
  actions: {
    celebrate: (
      { commit, rootGetters }: { commit: Commit; rootGetters: RootGetters },
      duration = DEFAULT_CELEBRATION_DURATION
    ) => {
      const id = Date.now()
      commit('addConfetti', { id, duration })
      setTimeout(() => {
        commit('removeConfetti', id)
      }, duration)
      if (rootGetters['user/isStudent']) {
        AnalyticsService.captureEvent(EVENTS.USER_RECEIVED_CELEBRATION)
      }
    },
  },
}
