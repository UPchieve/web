import { it, vi, describe, expect } from 'vitest'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'

describe('Volunteer store module', () => {
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
      },
    })
  }
  describe('handleIncomingSessions', () => {
    it('Sets allOpenSessions to an empty array when the volunteer is not ready to tutor', async () => {
      const mockVueContext = {
        $router: {},
      }
      const mockSetAllOpenSessions = vi.fn()
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
        mockVueContext,
        sessions: ['test-session-2'],
      })
      expect(mockSetAllOpenSessions).toHaveBeenCalledWith(expect.anything(), [])
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
  })
})
