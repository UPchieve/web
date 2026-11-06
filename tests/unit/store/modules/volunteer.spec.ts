import { it, vi, describe, expect, beforeEach } from 'vitest'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'

vi.mock('@/services/PresenceService')

beforeEach(() => {
  vi.resetAllMocks()
})

const getStore = (args = {}) => {
  return createStore({
    modules: {
      ...storeOptions.modules,
      volunteer: {
        ...storeOptions.modules.volunteer,
        state: {
          ...storeOptions.modules.volunteer.state,
          ...(args.volunteer?.state ?? {}),
        },
        mutations: {
          ...storeOptions.modules.volunteer.mutations,
          ...(args.volunteer?.mutations ?? {}),
        },
      },
      user: {
        ...storeOptions.modules.user,
        state: {
          ...storeOptions.modules.user.state,
          ...(args.user?.state ?? {}),
        },
        getters: {
          ...storeOptions.modules.user.getters,
          ...(args.user?.getters ?? {}),
        },
      },
      featureFlags: {
        ...storeOptions.modules.featureFlags,
        getters: {
          ...storeOptions.modules.featureFlags.getters,
          ...(args.featureFlags?.getters ?? {}),
        },
      },
    },
  })
}
describe('handleIncomingSessions', () => {
  const mockSetAllOpenSessions = vi.fn()
  const mockVueContext = {
    $router: {
      currentRoute: {
        value: {
          path: '/profile',
        },
      },
    },
  }

  it('Sets allOpenSessions to an empty array when the volunteer is not ready to tutor', async () => {
    const store = getStore({
      user: {
        state: {
          user: {
            banType: 'complete',
            isVolunteer: true,
            isApproved: true,
            isOnboarded: true,
          },
        },
        getters: {
          passedUpchieve101: () => true,
        },
      },
      volunteer: {
        state: {
          allOpenSessions: ['test-session-1'],
        },
        mutations: {
          setAllOpenSessions: mockSetAllOpenSessions,
        },
      },
    })

    expect(store.state.volunteer.allOpenSessions.length).toEqual(1) // Initially
    expect(store.getters['volunteer/isReadyToTutor']).toEqual(false)

    await store.dispatch('volunteer/handleIncomingSessions', {
      context: mockVueContext,
      sessions: ['test-session-2'],
    })
    expect(mockSetAllOpenSessions).toHaveBeenCalledWith(expect.anything(), [])
  })

  it.todo('Does not send web notifications for old sessions')
  it.todo(
    'Does not include test user or shadowbanned user sessions unless current user is an admin'
  )
})

describe('isReadyToTutor', () => {
  it('Positive case: Returns true when the volunteer is ready to tutor', () => {
    const store = getStore({
      user: {
        state: {
          user: {
            userType: 'volunteer',
            isOnboarded: true,
            isApproved: true,
            banType: null,
          },
        },
        getters: {
          passedUpchieve101: () => true,
        },
      },
    })
    expect(store.getters['volunteer/isReadyToTutor']).toEqual(true)
  })

  it.each([
    { state: { userType: 'student' } },
    { state: { isApproved: false } },
    { state: { isOnboarded: false } },
    { state: { banType: 'complete' } },
    { state: { banType: 'shadow' } },
  ])('Negative cases: Returns FALSE when %s', (arg) => {
    const store = getStore({
      user: {
        state: {
          user: {
            userType: 'volunteer',
            isOnboarded: true,
            isApproved: true,
            banType: null,
            ...(arg?.state ?? {}),
          },
        },
      },
    })

    expect(store.getters['volunteer/isReadyToTutor']).toEqual(false)
  })

  it('Is true even if the coach is live media-banned', () => {
    const store = getStore({
      user: {
        state: {
          user: {
            userType: 'volunteer',
            isOnboarded: true,
            isApproved: true,
            banType: 'live_media',
          },
        },
      },
    })

    expect(store.getters['volunteer/isReadyToTutor']).toEqual(true)
  })
})

describe('isOnboardedAndApproved', () => {
  it.each([{ banType: 'complete' }, { banType: 'shadow' }, { banType: null }])(
    'ignores bans, banType $banType',
    ({ banType }) => {
      const store = getStore({
        user: {
          state: {
            user: {
              userType: 'volunteer',
              isOnboarded: true,
              isApproved: true,
              banType,
            },
          },
        },
      })
      expect(store.getters['volunteer/isOnboardedAndApproved']).toEqual(true)
    }
  )
})

describe('session offers', () => {
  const buildOffer = (overrides = {}) => ({
    sessionId: 'session-1',
    subject: 'algebraOne',
    subjectDisplayName: 'Algebra 1',
    topic: 'math',
    studentFirstName: 'Ada',
    expiresAt: '2026-11-04T12:00:30.000Z',
    ...overrides,
  })

  it('clears the offer for its session', () => {
    const store = getStore()
    store.commit('volunteer/setSessionOffer', buildOffer())

    store.commit('volunteer/clearSessionOffer', 'session-1')

    expect(store.state.volunteer.sessionOffer).toBeNull()
  })

  it('keeps the offer when a different session is cleared', () => {
    const store = getStore()
    const offer = buildOffer()
    store.commit('volunteer/setSessionOffer', offer)

    store.commit('volunteer/clearSessionOffer', 'session-2')

    expect(store.state.volunteer.sessionOffer).toEqual(offer)
  })
})
