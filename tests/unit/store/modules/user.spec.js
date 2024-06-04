import userModule from '@/store/modules/user'
import { it, vi } from 'vitest'
import { createStore } from 'vuex'

describe('User store module', () => {
  const mockFeatureFlagsModule = {
    namespaced: true,
    getters: {
      isQuizStudyMaterialsActive: vi.fn().mockReturnValue(true),
      showDashboardRedesign: vi.fn().mockReturnValue(false),
    },
    state: {},
    actions: {},
    mutations: {},
  }

  const getStore = (args = {}) => {
    return createStore({
      modules: {
        featureFlags: {
          ...mockFeatureFlagsModule,
        },
        user: {
          ...userModule,
          state: {
            ...userModule.state,
            ...(args.user?.state ?? {}),
          },
          getters: {
            ...userModule.getters,
            getUserPropsForAnalytics: vi.fn().mockReturnValue({}),
            ...(args.user?.getters ?? {}),
          },
        },
      },
    })
  }

  describe('addToUser', () => {
    it('Adds new top level user prop', async () => {
      const store = getStore({
        user: {
          state: {
            user: {
              someProp: 'someValue',
            },
          },
        },
      })
      expect(store.state.user.user).toEqual({ someProp: 'someValue' })
      await store.dispatch('user/addToUser', {
        anotherProp: 'anotherValue',
      })
      expect(store.state.user.user).toEqual({
        someProp: 'someValue',
        anotherProp: 'anotherValue',
      })
    })

    it('Updates existing top level user prop', async () => {
      const store = getStore({
        user: {
          state: {
            user: {
              someProp: 'someValue',
            },
          },
        },
      })
      expect(store.state.user.user).toEqual({ someProp: 'someValue' })
      await store.dispatch('user/addToUser', {
        someProp: 'newValue',
      })
      expect(store.state.user.user).toEqual({ someProp: 'newValue' })
    })

    it('Reassigns nested property to the given value', async () => {
      const store = getStore({
        user: {
          state: {
            user: {
              someProp: {
                keyA: 0,
              },
            },
          },
        },
      })
      expect(store.state.user.user).toEqual({ someProp: { keyA: 0 } })
      await store.dispatch('user/addToUser', {
        someProp: {
          keyB: 1,
          keyC: 2,
        },
      })
      expect(store.state.user.user).toEqual({
        someProp: {
          keyB: 1,
          keyC: 2,
        },
      })
    })
  })
})
