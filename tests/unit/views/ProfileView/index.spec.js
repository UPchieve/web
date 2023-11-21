import userModule from '@/store/modules/user'
import featureFlagsModule from '@/store/modules/feature-flags'
import subjectsModule from '@/store/modules/subjects'
import ProfileView from '@/views/ProfileView.vue'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import { POSTHOG_FEATURE_FLAGS } from '@/consts'
import UserService from '@/services/UserService'
import AuthService from '@/services/AuthService'
import AnalyticsService from '@/services/AnalyticsService'

describe('ProfileView', () => {
  const localVue = createLocalVue()
  localVue.use(Vuex)

  let DEFAULT_FLAGS, DEFAULT_FLAGS_GETTERS, DEFAULT_USER

  UserService.setProfile = jest.fn().mockResolvedValue()
  AuthService.initiateVerification = jest.fn().mockResolvedValue()
  userModule.actions.addToUser = jest.fn().mockResolvedValue()
  AnalyticsService.captureEvent = jest.fn().mockReturnValue()

  beforeEach(() => {
    jest.resetAllMocks()

    DEFAULT_FLAGS = {
      [POSTHOG_FEATURE_FLAGS.FILTER_ACTIVE_SUBJECTS]: true,
    }
    DEFAULT_FLAGS_GETTERS = {
      isFilterActiveSubjectsActive: () => true,
    }
    DEFAULT_USER = {
      email: 'test@gmail.com',
      phone: '+18187774439',
      phoneVerified: false,
      deactivated: false,
      smsConsent: false,
      isVolunteer: false,
      subjects: [],
      activeSubjects: [],
    }
  })

  const getWrapper = (overrides = {}) => {
    const store = new Vuex.Store({
      modules: {
        user: {
          ...userModule,
          state: {
            user: {
              ...DEFAULT_USER,
              ...(overrides.user ?? {}),
            },
          },
        },
        featureFlags: {
          ...featureFlagsModule,
          // flags: {
          state: {
            flags: {
              ...DEFAULT_FLAGS,
              ...(overrides.featureFlags?.flags ?? {}),
            },
          },
          getters: {
            ...DEFAULT_FLAGS_GETTERS,
            ...(overrides.featureFlags?.getters ?? {}),
          },
          // },
        },
        subjects: {
          ...subjectsModule,
          subjects: {
            state: {
              subjects: {},
              training: {},
              isFetchingSubjects: false,
              isFetchingTraining: false,
            },
          },
        },
      },
    })
    // Many tests rely on accessing the wrapper for the nested VuePhoneNumberInput component.
    // Thus we must use mount() instead of shallowMount()
    return mount(ProfileView, {
      localVue,
      store,
    })
  }

  describe('Render differences between students and volunteers', () => {
    it.each([true, false])(
      "Should/shouldn't show the description text for what we use the phone number for when isVolunteer=%s",
      isVolunteer => {
        const wrapper = getWrapper({
          user: {
            isVolunteer,
          },
        })
        expect(wrapper.find('.description').exists()).toEqual(isVolunteer)
      }
    )

    it.each([true, false])(
      "Should/shouldn't show the deactivate account option when isVolunteer=%s",
      isVolunteer => {
        const wrapper = getWrapper({
          user: {
            isVolunteer,
          },
        })
        expect(
          wrapper.find('[data-testid="deactivate-account-toggle"]').exists()
        ).toEqual(isVolunteer)
      }
    )
  })

  describe('Editing and verifying phone numbers', () => {
    /**
     * Helper function to click the button for editing/saving the profile
     */
    const clickEditSaveButton = async wrapper => {
      wrapper.find('[data-testid="edit-profile-btn"]').trigger('click')
      await wrapper.vm.$nextTick()
    }

    it.each([
      // isVolunteer, expected
      [true, false],
      [false, true],
    ])(
      'Should only show sms consent checkbox for students',
      (isVolunteer, expected) => {
        const wrapper = getWrapper({
          user: {
            isVolunteer,
            phone: '+18188888857',
          },
        })
        expect(wrapper.find('#sms-consent-checkbox').exists()).toEqual(expected)
      }
    )

    it('Should not show SMS checkbox for students who have no phone number', () => {
      const wrapper = getWrapper({
        user: {
          isVolunteer: false,
          phone: null,
        },
      })
      expect(wrapper.find('#sms-consent-checkbox').exists()).toBeFalsy()
    })

    it('Should NOT open the SMS verification modal if the profile was saved with no changes to phone number', async () => {
      const wrapper = getWrapper({
        user: {
          phone: '+18607889345',
        },
      })
      // Enter edit mode and save (no) changes
      await clickEditSaveButton(wrapper)
      await clickEditSaveButton(wrapper)

      // Expect modal to pop open
      expect(
        wrapper.find('[data-testid="sms-verification-modal"]').exists()
      ).toBeFalsy()
    })
  })
})
