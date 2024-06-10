import volunteerModule from '@/store/modules/volunteer'
import userModule from '@/store/modules/user'
import { it, vi } from 'vitest'
import { createStore } from 'vuex'

describe('Volunteer store module', () => {
  const mockUserModule = {
    namespaced: true,
    getters: {},
    state: {},
    actions: {},
    mutations: {},
  }

  const getStore = (args = {}) => {
    return createStore({
      modules: {
        volunteer: {
          ...volunteerModule,
          state: {
            ...volunteerModule.state,
            ...(args.volunteer?.state ?? {}),
          },
          mutations: {
            ...volunteerModule.mutations,
            ...(args.volunteer?.mutations ?? {}),
          },
        },
        user: {
          ...mockUserModule,
          state: {
            ...userModule.state,
            ...(args.user?.state ?? {}),
          },
          getters: {
            ...userModule.getters,
            ...(args.user?.getters ?? {}),
          },
        },
      },
    })
  }
  describe('handleIncomingSessions', () => {
    it('Sets openSessions to an empty array when the volunteer is not ready to tutor', async () => {
      const mockVueContext = {
        $router: {},
      }
      const mockSetOpenSessions = vi.fn()
      const store = getStore({
        user: {
          state: {
            user: {
              isBanned: true, // should not be ready to tutor then
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
            openSessions: ['test-session-1'],
          },
          mutations: {
            setOpenSessions: mockSetOpenSessions,
          },
        },
      })

      expect(store.state.volunteer.openSessions.length).toEqual(1) // Initially
      expect(store.getters['volunteer/isReadyToTutor']).toEqual(false)

      await store.dispatch('volunteer/handleIncomingSessions', {
        mockVueContext,
        sessions: ['test-session-2'],
      })
      expect(mockSetOpenSessions).toHaveBeenCalledWith(expect.anything(), [])
    })
  })

  describe('isReadyToTutor', () => {
    it('Positive case: Returns true when the volunteer is ready to tutor', () => {
      const store = getStore({
        user: {
          state: {
            user: {
              isVolunteer: true,
              isOnboarded: true,
              isApproved: true,
              isBanned: false,
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
      { state: { isVolunteer: false } },
      { state: { isApproved: false } },
      { state: { isOnboarded: false } },
      { state: { isBanned: true } },
    ])('Negative cases: Returns FALSE when %s', (arg) => {
      const store = getStore({
        user: {
          state: {
            user: {
              isVolunteer: true,
              isOnboarded: true,
              isApproved: true,
              isBanned: false,
              ...(arg?.state ?? {}),
            },
          },
        },
      })

      expect(store.getters['volunteer/isReadyToTutor']).toEqual(false)
    })
  })
})
