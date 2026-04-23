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
        featureFlags: {
          ...storeOptions.modules.featureFlags,
          getters: {
            ...storeOptions.modules.featureFlags.getters,
            isForceSmsVerificationEnabled: () => false,
            isSmsVerificationEnabled: () => true,
            ...(overrides?.featureFlags?.getters ?? {}),
          },
        },
      },
    })
    return mount(VerificationView, {
      global: { plugins: [store] },
    })
  }

  describe('Rendering the VerificationMethodSelector when multiple verification methods are available', () => {
    it('Should render VerificationMethodSelector when the flags are on', () => {
      const wrapper = getWrapper()
      expect(
        wrapper.find('[data-testid="verification-method-selector"]').exists()
      ).toBeTruthy()
      expect(wrapper.find('[data-testid="step-2"]').exists()).toBeFalsy()
    })

    it.each([
      [true, 'verification-method-selector'],
      [false, 'step-2'],
    ])(
      'When SMS enabled=%s, should render %s',
      (smsVerificationFlag: boolean, step: string) => {
        // Scenario: SMS verification disabled, the user has no choice of verification method,
        // so it goes straight to step 2.
        const wrapper = getWrapper({
          featureFlags: {
            getters: { isSmsVerificationEnabled: () => smsVerificationFlag },
          },
        })
        expect(
          wrapper.find('[data-testid="verification-method-selector"]').exists()
        ).toEqual(smsVerificationFlag)
        expect(wrapper.find(`[data-testid="${step}"]`).exists()).toBeTruthy()
      }
    )
  })
})
