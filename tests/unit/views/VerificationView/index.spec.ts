import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import VerificationView from '@/views/VerificationView/index.vue'
import { vi, describe, expect, beforeEach, it } from 'vitest'

describe('VerificationView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  const getWrapper = (overrides = {}) => {
    const store = createStore({
      modules: {
        ...storeOptions.modules,
        user: {
          ...storeOptions.modules.user,
          state: {
            ...storeOptions.modules.user.state,
            user: {
              email: 'testEmail@gmail.com',
              phone: null,
              emailVerified: false,
              phoneVerified: false,
              verified: false,
              ...(overrides?.user?.state?.user ?? {}),
            },
          },
          getters: {
            ...storeOptions.modules.user.getters,
            ...(overrides?.user?.getters ?? {}),
          },
        },
      },
    })
    return mount(VerificationView, {
      global: { plugins: [store] },
    })
  }

  describe('Rendering the VerificationMethodSelector', () => {
    it('Should render VerificationMethodSelector', () => {
      const wrapper = getWrapper()
      expect(
        wrapper.find('[data-testid="verification-method-selector"]').exists()
      ).toBeTruthy()
      expect(wrapper.find('[data-testid="step-2"]').exists()).toBeFalsy()
    })
  })
})
