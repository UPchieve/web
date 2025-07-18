import { afterEach, beforeEach, expect, it, vi, describe } from 'vitest'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'

vi.mock('../../../../src/services/NetworkService')

describe('Session store', () => {
  const currentTime = new Date()

  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(currentTime)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const getStore = (args: { state?: any } = {}) => {
    return createStore({
      modules: {
        ...storeOptions.modules,
        session: {
          ...storeOptions.modules.session,
          state: {
            ...storeOptions.modules.session.state,
            ...(args?.state || {}),
          },
        },
      },
    })
  }

  describe('calculateCooldown', () => {
    it('Returns undefined when there is no prior session', async () => {
      const store = getStore({
        state: {
          latestSession: {},
        },
      })
      const cooldown = await store.dispatch('session/calculateCooldown')
      expect(cooldown).toBe(0)
    })

    it('Returns undefined when there is an ongoing session', async () => {
      const store = getStore({
        state: {
          latestSession: {
            endedAt: null,
          },
        },
      })
      const cooldown = await store.dispatch('session/calculateCooldown')
      expect(cooldown).toBe(0)
    })

    it('Returns 0 when the session was ended by the volunteer', async () => {
      const store = getStore({
        state: {
          latestSession: {
            endedAt: currentTime,
            endedByUserId: 'volunteer-id',
            volunteerId: 'volunteer-id',
          },
        },
      })
      const cooldown = await store.dispatch('session/calculateCooldown')
      expect(cooldown).toBe(0)
    })

    it('Returns 0 when session was ended by student 6 minutes ago', async () => {
      const createdAt = new Date(currentTime)
      createdAt.setMinutes(createdAt.getMinutes() - 6)
      const store = getStore({
        state: {
          latestSession: {
            endedAt: currentTime,
            endedByUserId: 'student-id',
            createdAt,
          },
        },
      })
      const cooldown = await store.dispatch('session/calculateCooldown')
      expect(cooldown).toBe(0)
    })

    it('Returns 0 when session was ended by student exactly 5 minutes ago', async () => {
      const createdAt = new Date(currentTime)
      createdAt.setMinutes(createdAt.getMinutes() - 5)
      const store = getStore({
        state: {
          latestSession: {
            endedAt: currentTime,
            endedByUserId: 'student',
            createdAt,
          },
        },
      })
      const cooldown = await store.dispatch('session/calculateCooldown')
      expect(cooldown).toBe(0)
    })

    it('Returns 1 when session was ended by student 4 minutes ago', async () => {
      const createdAt = new Date(currentTime)
      createdAt.setMinutes(createdAt.getMinutes() - 4)
      const store = getStore({
        state: {
          latestSession: {
            endedAt: currentTime,
            endedByUserId: 'student-id',
            createdAt,
          },
        },
      })
      const cooldown = await store.dispatch('session/calculateCooldown')
      expect(cooldown).toBe(1)
    })

    it('Returns 2 when session was ended by student 3.5 minutes ago', async () => {
      const createdAt = new Date(currentTime)
      createdAt.setMinutes(
        createdAt.getMinutes() - 3,
        createdAt.getSeconds() - 30
      )
      const store = getStore({
        state: {
          latestSession: {
            endedAt: currentTime,
            endedByUserId: 'student-id',
            createdAt,
          },
        },
      })
      const cooldown = await store.dispatch('session/calculateCooldown')
      expect(cooldown).toBe(2)
    })
  })
})
