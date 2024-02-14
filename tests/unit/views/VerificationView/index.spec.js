import userModule from '@/store/modules/user'
import featureFlagsModule from '@/store/modules/feature-flags'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import VerificationView from '@/views/VerificationView/index.vue'

describe('VerificationView', () => {
  const localVue = createLocalVue()
  localVue.use(Vuex)

  beforeEach(() => {
    vi.resetAllMocks()
  })

  const getWrapper = (
    smsVerificationEnabled = true,
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
          getters: {
            isSmsVerificationEnabled: () => smsVerificationEnabled,
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
      const wrapper = getWrapper(true)
      expect(
        wrapper.find('[data-testid="verification-method-selector"]').exists()
      ).toBeTruthy()
      expect(wrapper.find('[data-testid="step-2"]').exists()).toBeFalsy()
    })

    it.each([
      [true, 'verification-method-selector'], [false, 'step-2'],
    ])(
      'When SMS enabled=%s, should render %s',
      (smsVerificationFlag, step) => {
        // Scenario: SMS verification disabled, the user has no choice of verification method,
        // so it goes straight to step 2.
        const wrapper = getWrapper(smsVerificationFlag)
        expect(
          wrapper.find('[data-testid="verification-method-selector"]').exists()
        ).toEqual(smsVerificationFlag)
        expect(wrapper.find(`[data-testid="${step}"]`).exists()).toBeTruthy()
      }
    )
  })
})
