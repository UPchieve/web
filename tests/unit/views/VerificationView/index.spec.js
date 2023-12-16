import userModule from '@/store/modules/user'
import featureFlagsModule from '@/store/modules/feature-flags'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import VerificationView from '@/views/VerificationView/index.vue'
import { POSTHOG_FEATURE_FLAGS } from '@/consts'

describe('VerificationView', () => {
  const localVue = createLocalVue()
  localVue.use(Vuex)

  beforeEach(() => {
    jest.resetAllMocks()
  })

  const getWrapper = (
    smsVerificationEnabled = true,
    smsVerificationEnabledOnSignupFlow = true
  ) => {
    const store = new Vuex.Store({
      modules: {
        user: {
          ...userModule,
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
          ...featureFlagsModule,
          state: {
            flags: {
              [POSTHOG_FEATURE_FLAGS.SMS_VERIFICATION]: smsVerificationEnabled,
              [POSTHOG_FEATURE_FLAGS.SMS_VERIFICATION_ENABLED_ON_SIGNUP_FLOW]: smsVerificationEnabledOnSignupFlow,
            },
          },
        },
      },
    })
    return mount(VerificationView, {
      localVue,
      store,
    })
  }

  describe('sms-verification feature flag', () => {
    it('Should render VerificationMethodSelector when the flags are on', () => {
      const wrapper = getWrapper(true, true)
      expect(
        wrapper.find('[data-testid="verification-method-selector"]').exists()
      ).toBeTruthy()
      expect(wrapper.find('[data-testid="step-2"]').exists()).toBeFalsy()
    })

    it.each([
      [false, false],
      [false, true],
      [true, false],
    ])(
      'Should render in step 2 if either flag is disabled (%s, %s)',
      (smsVerificationFlag, smsVerificationOnSignupFlag) => {
        // Scenario: SMS verification disabled, therefore the user has no choice of verification method,
        // so it goes straight to step 2.
        const wrapper = getWrapper(
          smsVerificationFlag,
          smsVerificationOnSignupFlag
        )
        expect(
          wrapper.find('[data-testid="verification-method-selector"]').exists()
        ).toBeFalsy()
        expect(wrapper.find('[data-testid="step-2"]').isVisible()).toBeTruthy()
      }
    )
  })
})
