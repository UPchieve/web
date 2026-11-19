import { it, vi, describe, expect, beforeEach } from 'vitest'
import { createStore } from 'vuex'
import { createPinia, setActivePinia } from 'pinia'
import { storeOptions } from '@/store'
import * as PresenceService from '@/services/PresenceService'
import * as AmericaCountsVolunteerService from '@/services/AmericaCountsVolunteerService'
import { useNotificationsStore } from '@/stores/notifications'

vi.mock('@/services/PresenceService')
vi.mock('@/services/AmericaCountsVolunteerService', { spy: true })
vi.mock('@/utils/send-web-notification')

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

  it('passes available and personally requested sessions to America Counts auto-join', async () => {
    setActivePinia(createPinia())
    const autoJoin = vi.mocked(
      AmericaCountsVolunteerService.maybeAutoJoinOldestSession
    )
    autoJoin.mockResolvedValue(undefined)
    const store = getStore({
      user: {
        state: {
          user: {
            id: 'coach',
            userType: 'volunteer',
            isApproved: true,
            isOnboarded: true,
            subjects: ['algebraOne'],
            mutedSubjectAlerts: [],
            sponsorships: [{ key: 'america-counts' }],
          },
        },
      },
      volunteer: { state: { tickIntervalId: 1, allOpenSessions: [] } },
    })
    const session = {
      id: 'available',
      subTopic: 'algebraOne',
      student: { currentGradeName: '8th' },
      isExclusive: false,
    }
    const reserved = {
      ...session,
      id: 'reserved',
      isExclusive: true,
      requestedVolunteerId: 'another-coach',
    }
    const requested = {
      ...reserved,
      id: 'requested',
      requestedVolunteerId: 'coach',
    }

    await store.dispatch('volunteer/handleIncomingSessions', {
      context: mockVueContext,
      sessions: [reserved, session, requested],
    })
    expect(autoJoin).toHaveBeenCalledWith([session, requested])
  })

  describe('checking whether the coach has gone inactive', () => {
    function buildSession(id: string) {
      return {
        id,
        subTopic: 'algebraOne',
        subjectDisplayName: 'Algebra 1',
        student: { firstname: 'Ada' },
        isExclusive: false,
      }
    }

    function getReadyCoachStore(session = {}) {
      setActivePinia(createPinia())
      return getStore({
        user: {
          state: {
            user: {
              userType: 'volunteer',
              isApproved: true,
              isOnboarded: true,
              subjects: ['algebraOne'],
              mutedSubjectAlerts: [],
            },
            session,
          },
        },
        // a tick interval is already running, so none is started
        volunteer: { state: { tickIntervalId: 1 } },
      })
    }

    it('checks when a session the coach can take comes in', async () => {
      const store = getReadyCoachStore()

      await store.dispatch('volunteer/handleIncomingSessions', {
        context: mockVueContext,
        sessions: [buildSession('session-1')],
      })

      expect(PresenceService.checkForInactivity).toHaveBeenCalledTimes(1)
    })

    it('does not check again for a session the coach has already seen', async () => {
      const store = getReadyCoachStore()
      const sessions = [buildSession('session-1')]
      await store.dispatch('volunteer/handleIncomingSessions', {
        context: mockVueContext,
        sessions,
      })

      await store.dispatch('volunteer/handleIncomingSessions', {
        context: mockVueContext,
        sessions,
      })

      expect(PresenceService.checkForInactivity).toHaveBeenCalledTimes(1)
    })

    it('does not check for a session in a subject the coach cannot take', async () => {
      const store = getReadyCoachStore()

      await store.dispatch('volunteer/handleIncomingSessions', {
        context: mockVueContext,
        sessions: [{ ...buildSession('session-1'), subTopic: 'calculusAB' }],
      })

      expect(PresenceService.checkForInactivity).not.toHaveBeenCalled()
    })

    it('does not check while the coach is in a session', async () => {
      const store = getReadyCoachStore({
        createdAt: new Date().toISOString(),
        endedAt: null,
      })

      await store.dispatch('volunteer/handleIncomingSessions', {
        context: mockVueContext,
        sessions: [buildSession('session-1')],
      })

      expect(PresenceService.checkForInactivity).not.toHaveBeenCalled()
    })
  })
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

describe('alertVolunteer', () => {
  it('keeps a session offer when replacing session alerts with the rollup', async () => {
    setActivePinia(createPinia())
    const sessions = [1, 2, 3, 4, 5].map((n) => ({
      id: `session-${n}`,
      subTopic: 'algebraOne',
      subjectDisplayName: 'Algebra 1',
      student: { firstname: 'Ada' },
      isExclusive: false,
    }))
    const store = getStore({
      user: {
        state: {
          user: {
            userType: 'volunteer',
            isApproved: true,
            isOnboarded: true,
            subjects: ['algebraOne'],
          },
        },
      },
      volunteer: { state: { allOpenSessions: sessions } },
    })
    const notificationsStore = useNotificationsStore()
    notificationsStore.add({
      id: 'offer',
      title: 'Offer',
      type: 'session-offer',
    })
    notificationsStore.add({ id: 'session-1', title: 'Algebra 1' })

    await store.dispatch('volunteer/alertVolunteer', {
      context: { $router: { currentRoute: { value: { path: '/profile' } } } },
      session: sessions[4],
    })

    expect(notificationsStore.notifications.map(({ id }) => id)).toEqual([
      'offer',
      'rollup-alert',
    ])
  })

  async function alertOn(path: string) {
    setActivePinia(createPinia())
    const session = {
      id: 'session-1',
      subTopic: 'algebraOne',
      subjectDisplayName: 'Algebra 1',
      student: { firstname: 'Ada' },
      isExclusive: false,
    }
    const store = getStore({
      user: {
        state: {
          user: {
            userType: 'volunteer',
            isApproved: true,
            isOnboarded: true,
            subjects: ['algebraOne'],
          },
        },
      },
      volunteer: { state: { allOpenSessions: [session] } },
    })

    await store.dispatch('volunteer/alertVolunteer', {
      context: { $router: { currentRoute: { value: { path } } } },
      session,
    })

    return useNotificationsStore().notifications
  }

  it.each([
    ['/session/math/algebra-one/1', 0],
    ['/feedback/1', 1],
    ['/sessions/history', 1],
  ])('on %s, adds %i session alert(s)', async (path, count) => {
    expect(await alertOn(path)).toHaveLength(count)
  })

  it('auto-dismisses a session alert after 15 seconds', async () => {
    const [alert] = await alertOn('/dashboard')

    expect(alert.duration).toBe(15000)
  })
})
