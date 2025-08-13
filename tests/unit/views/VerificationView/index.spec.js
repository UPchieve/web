import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import VerificationView from '@/views/VerificationView/index.vue'
import { vi } from 'vitest'

describe('VerificationView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  const getWrapper = (smsVerificationEnabled = true) => {
    const store = createStore({
      modules: {
        ...storeOptions.modules,
        user: {
          ...storeOptions.modules.user,
          state: {
            user: {
              email: 'testEmail@gmail.com',
              phone: null,
              emailVerified: false,
              phoneVerified: false,
              verified: false,
            },
          },
        },
        featureFlags: {
          ...storeOptions.modules.featureFlags,
          getters: {
            ...storeOptions.modules.featureFlags.getters,
            isSmsVerificationEnabled: () => smsVerificationEnabled,
            isForceSmsVerificationEnabled: () => false,
          },
        },
      },
    })
    return mount(VerificationView, {
      global: { plugins: [store] },
    })
  }

  describe('sms-verification feature flag', () => {
    it('Should render VerificationMethodSelector when the flags are on', () => {
      const wrapper = getWrapper(true)
      expect(
        wrapper.find('[data-testid="verification-method-selector"]').exists()
      ).toBeTruthy()
      expect(wrapper.find('[data-testid="step-2"]').exists()).toBeFalsy()
    })

    it.each([
      [true, 'verification-method-selector'],
      [false, 'step-2'],
    ])('When SMS enabled=%s, should render %s', (smsVerificationFlag, step) => {
      // Scenario: SMS verification disabled, the user has no choice of verification method,
      // so it goes straight to step 2.
      const wrapper = getWrapper(smsVerificationFlag)
      expect(
        wrapper.find('[data-testid="verification-method-selector"]').exists()
      ).toEqual(smsVerificationFlag)
      expect(wrapper.find(`[data-testid="${step}"]`).exists()).toBeTruthy()
    })
  })
})
