import sessionModule from '@/store/modules/session'
import { beforeEach, it, vi, describe } from 'vitest'
import { createStore } from 'vuex'

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
        session: {
          ...sessionModule,
          state: {
            ...sessionModule.state,
            ...(args?.state || {}),
          },
        },
      },
    })
  }

  describe('sessionRequestCooldownMinutes', () => {
    it('Returns undefined when there is no prior session', () => {
      const store = getStore({
        state: {
          latestSession: {},
        },
      })
      const cooldown = store.getters['session/sessionRequestCooldownMinutes']
      expect(cooldown).toBeUndefined()
    })

    it('Returns undefined when there is an ongoing session', () => {
      const store = getStore({
        state: {
          latestSession: {
            endedAt: null,
          },
        },
      })
      const cooldown = store.getters['session/sessionRequestCooldownMinutes']
      expect(cooldown).toBeUndefined()
    })

    it('Returns 0 when the session was ended by the volunteer', () => {
      const store = getStore({
        state: {
          latestSession: {
            endedAt: currentTime,
            endedByUserRole: 'volunteer',
          },
        },
      })
      const cooldown = store.getters['session/sessionRequestCooldownMinutes']
      expect(cooldown).toEqual(0)
    })

    it('Returns 0 when session was ended by student 6 minutes ago', () => {
      const createdAt = new Date(currentTime)
      createdAt.setMinutes(createdAt.getMinutes() - 6)
      const store = getStore({
        state: {
          latestSession: {
            endedAt: currentTime,
            endedByUserRole: 'student',
            createdAt,
          },
        },
      })
      const cooldown = store.getters['session/sessionRequestCooldownMinutes']
      expect(cooldown).toEqual(0)
    })

    it('Returns 0 when session was ended by student exactly 5 minutes ago', () => {
      const createdAt = new Date(currentTime)
      createdAt.setMinutes(createdAt.getMinutes() - 5)
      const store = getStore({
        state: {
          latestSession: {
            endedAt: currentTime,
            endedByUserRole: 'student',
            createdAt,
          },
        },
      })
      const cooldown = store.getters['session/sessionRequestCooldownMinutes']
      expect(cooldown).toEqual(0)
    })

    it('Returns 1 when session was ended by student 4 minutes ago', () => {
      const createdAt = new Date(currentTime)
      createdAt.setMinutes(createdAt.getMinutes() - 4)
      const store = getStore({
        state: {
          latestSession: {
            endedAt: currentTime,
            endedByUserRole: 'student',
            createdAt,
          },
        },
      })
      const cooldown = store.getters['session/sessionRequestCooldownMinutes']
      expect(cooldown).toEqual(1)
    })

    it('Returns 2 when session was ended by student 3.5 minutes ago', () => {
      const createdAt = new Date(currentTime)
      createdAt.setMinutes(
        createdAt.getMinutes() - 3,
        createdAt.getSeconds() - 30
      )
      const store = getStore({
        state: {
          latestSession: {
            endedAt: currentTime,
            endedByUserRole: 'student',
            createdAt,
          },
        },
      })
      const cooldown = store.getters['session/sessionRequestCooldownMinutes']
      expect(cooldown).toEqual(2)
    })
  })
})
