import userModule from '@/store/modules/user'
import featureFlagsModule from '@/store/modules/feature-flags'
import subjectsModule from '@/store/modules/subjects'
import ProfileView from '@/views/ProfileView/index.vue'
import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import UserService from '@/services/UserService'
import AuthService from '@/services/AuthService'
import AnalyticsService from '@/services/AnalyticsService'
import { vi } from 'vitest'

describe('ProfileView', () => {
  const localVue = createLocalVue()
  localVue.use(Vuex)

  let DEFAULT_FLAGS_GETTERS, DEFAULT_USER

  UserService.setProfile = vi.fn().mockResolvedValue()
  AuthService.initiateVerification = vi.fn().mockResolvedValue()
  userModule.actions.addToUser = vi.fn().mockResolvedValue()
  AnalyticsService.captureEvent = vi.fn().mockReturnValue()

  beforeEach(() => {
    vi.resetAllMocks()

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
          getters: {
            ...DEFAULT_FLAGS_GETTERS,
            ...(overrides.featureFlags?.getters ?? {}),
          },
        },
        subjects: {
          ...subjectsModule,
          state: {
              subjects: {
                ...(overrides.subjects ?? {})
              },
              training: {},
              isFetchingSubjects: false,
              isFetchingTraining: false,
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
    test.each([true, false])(
      "Should/shouldn't show the description text for what we use the phone number for when isVolunteer=%s",
      (isVolunteer) => {
        const wrapper = getWrapper({
          user: {
            isVolunteer,
          },
        })
        expect(wrapper.find('.description').exists()).toEqual(isVolunteer)
      }
    )

    test.each([true, false])(
      "Should/shouldn't show the deactivate account option when isVolunteer=%s",
      (isVolunteer) => {
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

    test.each([true, false])(
      "Should show 'Remove phone number' option for students only",
      async (isVolunteer) => {
        const wrapper = getWrapper({
          user: {
            isVolunteer,
            phone: '+18187776543',
          },
        })
        expect(
          wrapper.find('[data-testid="delete-phone-button"]').exists()
        ).toEqual(!isVolunteer)
      }
    )
  })

  describe('Phone numbers', () => {
    /**
     * Helper function to click the button for editing/saving the profile
     */
    const clickEditSaveButton = async (wrapper) => {
      wrapper.find('[data-testid="edit-profile-btn"]').trigger('click')
      await wrapper.vm.$nextTick()
    }

    test.each([
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

    it('Should open the corresponding modal if a student clicks the Remove Phone button', async () => {
      const wrapper = getWrapper({
        user: {
          phone: '+18609998765',
          isVolunteer: false,
        },
      })
      await wrapper.find('[data-testid="delete-phone-button"]').trigger('click')
      expect(
        wrapper.find('[data-testid="remove-phone-confirmation-modal"]').exists()
      ).toBeTruthy()
    })

    it('Should not render the Remove Phone button if the user has no phone', async () => {
      const wrapper = getWrapper({
        user: { phone: undefined, isVolunteer: false },
      })
      expect(
        wrapper.find('[data-testid="delete-phone-button"]').exists()
      ).toBeFalsy()
    })
  })

  describe('Muted Subject Alert Tests', async () => {
    const user = {
      isVolunteer: true,
      subjects: ['algebraOne', 'algebraTwo', 'biology'],
      activeSubjects: ['algebraOne', 'algebraTwo', 'biology'],
      mutedSubjectAlerts: [],
    }

    const subjects = {
      algebraOne: {
        active: true,
        displayName: 'Algebra 1',
        name: 'algebraOne',
        topicColor: '#E398E4',
        topicDisplayName: 'Math',
        topicName: 'math',
      },
      algebraTwo: {
        active: true,
        displayName: 'Algebra 2',
        name: 'algebraTwo',
        topicColor: '#E398E4',
        topicDisplayName: 'Math',
        topicName: 'math',
      },
      biology: {
        active: true,
        displayName: 'Biology',
        name: 'biology',
        topicColor: '#9675CE',
        topicDisplayName: 'Science',
        topicName: 'science',
      },
    }

    test.each([
      [true, true], 
      [false, false]
    ])
    ('Should only show tutoring alerts column and toggle button when mute subject alert FF is on', 
      (mutedSubjectsAlert, expected) => {
        const wrapper = getWrapper({
          user,
          subjects,
          featureFlags: {
            getters: {
              isMutedSubjectAlertsActive: () => mutedSubjectsAlert,
            },
          },
        })

        expect(
          wrapper.find('[data-testid="tutoring-alerts"]').exists()
        ).toEqual(expected)

        expect(wrapper.find('[data-testid="toggle-buttons"]').exists()).toEqual(
          expected
        )
      })

      test.each([
        [[], 'true', undefined],
        [['algebraTwo'], undefined, 'true']
      ])(
        'Should set toggle button value to false when subject is toggled off and true when it is toggled on', 
        async (mutedSubjects, valueBeforeToggle, valueAfterToggle) => {
          const wrapper = getWrapper({
            user: {
              ...user,
              mutedSubjectAlerts: mutedSubjects,
            },
            subjects,
            featureFlags: {
              getters: {
                isMutedSubjectAlertsActive: () => true,
              },
            },
          })

          const clickEditSaveButton = async (wrapper) => {
            wrapper.find('[data-testid="edit-profile-btn"]').trigger('click')
            await wrapper.vm.$nextTick()
          }

          const toggleMutedSubject = async (wrapper) => {
            wrapper
              .find('[data-testid="toggle-button-algebraTwo"]')
              .trigger('change')
            await wrapper.vm.$nextTick()
          }

          //Before toggle
          expect(
            wrapper
              .find('[data-testid="toggle-button-algebraTwo"]')
              .attributes().value
          ).toEqual(valueBeforeToggle)

          await clickEditSaveButton(wrapper)
          await toggleMutedSubject(wrapper)
          await clickEditSaveButton(wrapper)

          //After toggle & save
          expect(
            wrapper
              .find('[data-testid="toggle-button-algebraTwo"]')
              .attributes().value
          ).toEqual(valueAfterToggle)
        }
      )
  })
})
