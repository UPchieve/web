import { it, vi, describe, expect, beforeEach } from 'vitest'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import { VolunteerOccupations } from '../../../../src/services/VolunteerService'

vi.mock('../../../../src/services/PresenceService')

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

  describe('Feature flag hiding college sessions from high school volunteers', () => {
    const READY_TO_TUTOR_USER_STATE = {
      isApproved: true,
      isOnboarded: true,
      userType: 'volunteer',
      banType: null,
      mutedSubjectAlerts: [],
    }
    const COLLEGE_SESSION = {
      id: 'college-session',
      student: {
        isTestUser: false,
        isShadowBanned: false,
      },
      subTopic: 'financial aid',
      type: 'college',
      volunteer: undefined,
    }
    const PREALGEBRA_SESSION = {
      ...COLLEGE_SESSION,
      id: 'prealgebra-session',
      subTopic: 'prealgebra',
      type: 'math',
    }

    it('INCLUDES college sessions if the feature flag is OFF even if the current user IS a high school student', async () => {
      const store = getStore({
        user: {
          state: {
            user: {
              ...READY_TO_TUTOR_USER_STATE,
              subjects: ['prealgebra', 'financial aid'],
              occupation: [VolunteerOccupations.HIGH_SCHOOL_STUDENT],
            },
          },
          getters: {
            isVolunteer: () => true,
            isSessionAlive: () => false,
          },
        },
        volunteer: {
          state: {
            allOpenSessions: [],
          },
          mutations: {
            setAllOpenSessions: mockSetAllOpenSessions,
          },
        },
      })

      await store.dispatch('volunteer/handleIncomingSessions', {
        context: mockVueContext,
        sessions: [COLLEGE_SESSION, PREALGEBRA_SESSION],
      })
      expect(mockSetAllOpenSessions).toHaveBeenCalledTimes(1)
      expect(mockSetAllOpenSessions).toHaveBeenCalledWith(expect.anything(), [
        COLLEGE_SESSION,
        PREALGEBRA_SESSION,
      ])
    })

    it('INCLUDES college sessions if the feature flag is ON if the current user IS NOT a high school student', async () => {
      const store = getStore({
        user: {
          state: {
            user: {
              ...READY_TO_TUTOR_USER_STATE,
              subjects: ['prealgebra', 'financial aid'],
            },
          },
          getters: {
            isVolunteer: () => true,
          },
        },
        volunteer: {
          state: {
            allOpenSessions: [],
          },
          mutations: {
            setAllOpenSessions: mockSetAllOpenSessions,
          },
        },
        featureFlags: {
          getters: {
            areHighSchoolStudentsBarredFromCoachingCollegeSubjects: () => true,
          },
        },
      })

      await store.dispatch('volunteer/handleIncomingSessions', {
        context: mockVueContext,
        sessions: [COLLEGE_SESSION, PREALGEBRA_SESSION],
      })
      expect(mockSetAllOpenSessions).toHaveBeenCalledTimes(1)
      expect(mockSetAllOpenSessions).toHaveBeenCalledWith(expect.anything(), [
        COLLEGE_SESSION,
        PREALGEBRA_SESSION,
      ])
    })

    it('EXCLUDES college sessions if the feature flag is ON if the current user IS a high school student', async () => {
      const store = getStore({
        user: {
          state: {
            user: {
              ...READY_TO_TUTOR_USER_STATE,
              subjects: ['prealgebra', 'financial aid'],
              occupation: [VolunteerOccupations.HIGH_SCHOOL_STUDENT],
            },
          },
          getters: {
            isVolunteer: () => true,
          },
        },
        volunteer: {
          state: {
            allOpenSessions: [],
          },
          mutations: {
            setAllOpenSessions: mockSetAllOpenSessions,
          },
        },
        featureFlags: {
          getters: {
            areHighSchoolStudentsBarredFromCoachingCollegeSubjects: () => true,
          },
        },
      })

      await store.dispatch('volunteer/handleIncomingSessions', {
        context: mockVueContext,
        sessions: [COLLEGE_SESSION, PREALGEBRA_SESSION],
      })
      expect(mockSetAllOpenSessions).toHaveBeenCalledTimes(1)
      expect(mockSetAllOpenSessions).toHaveBeenCalledWith(expect.anything(), [
        PREALGEBRA_SESSION,
      ])
    })
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
