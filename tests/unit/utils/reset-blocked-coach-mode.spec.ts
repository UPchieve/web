import { describe, expect, it } from 'vitest'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'

describe('user/shouldForceStudentMode', () => {
  it('returns true for a blocked dual-role user in volunteer mode', () => {
    const store = createStore({
      ...storeOptions,
      modules: {
        ...storeOptions.modules,
        featureFlags: {
          ...storeOptions.modules.featureFlags,
          state: {
            ...storeOptions.modules.featureFlags.state,
            toggleFlags: {
              ...storeOptions.modules.featureFlags.state.toggleFlags,
              'block-student-coach-mode': true,
            },
          },
        },
        user: {
          ...storeOptions.modules.user,
          state: {
            ...storeOptions.modules.user.state,
            user: {
              userType: 'volunteer',
              roleContext: { roles: ['student', 'volunteer'] },
            },
          },
        },
      },
    })

    expect(store.getters['user/shouldForceStudentMode']).toBe(true)
  })
})
