import { storeOptions } from '@/store'
import ProfileView from '@/views/ProfileView/index.vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createStore } from 'vuex'
import UserService from '@/services/UserService'
import AuthService from '@/services/AuthService'
import AnalyticsService from '@/services/AnalyticsService'
import NetworkService from '@/services/NetworkService'
import { vi } from 'vitest'
import MazPhoneNumberInput from 'maz-ui/components/MazPhoneNumberInput'
import { nextTick } from 'vue'
import vuetify from '@/plugins/vuetify'
import { VolunteerOccupations } from '@/services/VolunteerService'

describe('ProfileView', () => {
  let DEFAULT_FLAGS_GETTERS, DEFAULT_USER

  beforeEach(() => {
    vi.resetAllMocks()
    UserService.setProfile = vi.fn().mockResolvedValue()
    AuthService.initiateVerification = vi.fn().mockResolvedValue()
    AnalyticsService.captureEvent = vi.fn().mockReturnValue()
    NetworkService.addBackgroundInfo = vi
      .fn()
      .mockResolvedValue({ removedFromNTHS: false })
    storeOptions.modules.user.actions.addToUser = vi.fn().mockResolvedValue()

    DEFAULT_FLAGS_GETTERS = {
      isFilterActiveSubjectsActive: () => true,
    }
    DEFAULT_USER = {
      email: 'test@gmail.com',
      phone: '+18187774439',
      phoneVerified: false,
      deactivated: false,
      smsConsent: false,
      userType: 'student',
      subjects: [],
      activeSubjects: [],
      mutedSubjectAlerts: [],
    }
  })

  const getWrapper = (overrides = {}) => {
    const store = createStore({
      modules: {
        ...storeOptions.modules,
        user: {
          ...storeOptions.modules.user,
          state: {
            user: {
              ...DEFAULT_USER,
              ...(overrides.user?.state ?? {}),
            },
          },
          getters: {
            ...storeOptions.modules.user.getters,
            ...(overrides.user?.getters ?? {}),
          },
        },
        featureFlags: {
          ...storeOptions.modules.featureFlags,
          getters: {
            ...storeOptions.modules.featureFlags.getters,
            ...DEFAULT_FLAGS_GETTERS,
            ...(overrides.featureFlags?.getters ?? {}),
          },
        },
        subjects: {
          ...storeOptions.modules.subjects,
          state: {
            subjects: {
              ...(overrides.subjects ?? {}),
            },
            training: {},
            isFetchingSubjects: false,
            isFetchingTraining: false,
          },
        },
      },
    })
    return mount(ProfileView, {
      global: {
        plugins: [store, vuetify, MazPhoneNumberInput],
      },
    })
  }

  const getPhoneInputs = (wrapper) => {
    const mazInputs = wrapper.findAll('.m-input-wrapper-input')
    const countryCodeInput = mazInputs
      .find((input) => input.text() === 'Country code')
      .find('.m-input-input')
    const phoneNumberInput = mazInputs
      .find(
        (input) =>
          input.text() === 'Phone number' ||
          input.text() === 'Example: (201) 555-0123'
      )
      .find('.m-input-input')
    return { countryCodeInput, phoneNumberInput }
  }

  describe('Render differences between students and volunteers', () => {
    test.each(['volunteer', 'student'])(
      "Should/shouldn't show the description text for what we use the phone number for when userType=%s",
      (userType) => {
        const wrapper = getWrapper({
          user: {
            state: {
              userType,
            },
          },
        })
        expect(wrapper.find('.sms-consent .description').exists()).toEqual(
          userType === 'volunteer'
        )
      }
    )

    test.each(['volunteer', 'student'])(
      "Should/shouldn't show the deactivate account option when userType=%s",
      (userType) => {
        const wrapper = getWrapper({
          user: {
            state: {
              userType,
            },
          },
        })
        expect(
          wrapper.find('[data-testid="deactivate-account-toggle"]').exists()
        ).toEqual(userType === 'volunteer')
      }
    )

    test.each([
      [true, false],
      [false, true],
    ])(
      "Should show 'Remove phone number' option only if the user does not have the volunteer role",
      async (hasVolunteerRole, expected) => {
        const wrapper = getWrapper({
          user: {
            state: {
              phone: '+18187776543',
            },
            getters: {
              hasVolunteerRole: () => hasVolunteerRole,
            },
          },
        })
        expect(
          wrapper.find('[data-testid="delete-phone-button"]').exists()
        ).toEqual(expected)
      }
    )

    test('Shows the grade level question for students', async () => {
      const wrapper = getWrapper({
        user: {
          getters: {
            isStudent: () => true,
          },
        },
      })
      expect(
        wrapper.find('[data-testid="grade-level-select"]').isVisible()
      ).toEqual(true)
    })

    test.each([
      [undefined],
      [['A graduate student']],
      [['Working part-time', VolunteerOccupations.HIGH_SCHOOL_STUDENT]],
    ])(
      'Does not show the grade level question for volunteers (occupation: %j)',
      async (occupation) => {
        const wrapper = getWrapper({
          user: {
            getters: {
              isStudent: () => false,
              isVolunteer: () => true,
            },
            state: occupation ? { occupation } : {},
          },
        })
        expect(
          wrapper.find('[data-testid="grade-level-select"]').exists()
        ).toEqual(false)
      }
    )
  })

  describe('Phone numbers', () => {
    /**
     * Helper function to click the button for editing/saving the profile
     */
    const clickEditSaveButton = async (wrapper) => {
      wrapper.find('[data-testid="edit-profile-btn"]').trigger('click')
      await nextTick()
      await flushPromises()
    }

    test.each([
      ['volunteer', null, false],
      ['student', null, false],
      ['volunteer', '+18608660033', true],
      ['student', '+18608660033', true],
    ])(
      'Should only show sms consent checkbox if there is a phone number, regardless of userType',
      (userType, phone, expected) => {
        const wrapper = getWrapper({
          user: {
            state: {
              userType,
              phone,
            },
          },
        })
        expect(wrapper.find('#sms-consent-checkbox').exists()).toEqual(expected)
      }
    )

    it('Should not show SMS checkbox for students who have no phone number', () => {
      const wrapper = getWrapper({
        user: {
          state: {
            userType: 'student',
            phone: null,
          },
        },
      })
      expect(wrapper.find('#sms-consent-checkbox').exists()).toBeFalsy()
    })

    it('Should NOT open the SMS verification modal if the profile was saved with no changes to phone number', async () => {
      const wrapper = getWrapper({
        user: {
          state: {
            phone: '+18607889345',
          },
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

    it('Should open the verification modal if the user changes their phone number', async () => {
      const wrapper = getWrapper({
        user: {
          state: {
            phone: '+18602124444',
            phoneVerified: true,
          },
        },
      })
      // Enter edit mode and save changes
      await clickEditSaveButton(wrapper)
      await nextTick()

      const { countryCodeInput, phoneNumberInput } = getPhoneInputs(wrapper)
      await countryCodeInput.setValue('+1')
      await phoneNumberInput.setValue('(212) 998-1123')
      await clickEditSaveButton(wrapper)
      await nextTick()

      // Expect modal to open
      expect(
        wrapper.find('[data-testid="sms-verification-modal"]').exists()
      ).toBeTruthy()
    })

    it('Should open the verification modal if the user adds a phone number for the first time', async () => {
      const wrapper = getWrapper({
        user: {
          state: {
            phone: null,
          },
        },
      })
      // Enter edit mode and save changes
      await clickEditSaveButton(wrapper)

      const { countryCodeInput, phoneNumberInput } = getPhoneInputs(wrapper)
      await countryCodeInput.setValue('+1')
      await phoneNumberInput.setValue('(212) 998-1123')
      await clickEditSaveButton(wrapper)
      await nextTick()

      // Expect modal to open
      expect(
        wrapper.find('[data-testid="sms-verification-modal"]').exists()
      ).toBeTruthy()
    })

    it('Should open the corresponding modal if a student clicks the Remove Phone button', async () => {
      const wrapper = getWrapper({
        user: {
          state: {
            phone: '+18609998765',
            userType: 'student',
          },
        },
      })
      await wrapper.find('[data-testid="delete-phone-button"]').trigger('click')
      expect(
        wrapper.find('[data-testid="remove-phone-confirmation-modal"]').exists()
      ).toBeTruthy()
    })

    it('Should not render the Remove Phone button if the user has no phone', async () => {
      const wrapper = getWrapper({
        user: { state: { phone: undefined, userType: 'student' } },
      })
      expect(
        wrapper.find('[data-testid="delete-phone-button"]').exists()
      ).toBeFalsy()
    })
  })

  describe.skip('Muted Subject Alert Tests', async () => {
    const user = {
      state: {
        userType: 'volunteer',
        subjects: ['algebraOne', 'algebraTwo', 'biology'],
        activeSubjects: ['algebraOne', 'algebraTwo', 'biology'],
        mutedSubjectAlerts: [],
      },
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
      [false, false],
    ])(
      'Should only show tutoring alerts column and toggle button when mute subject alert FF is on',
      (expected) => {
        const wrapper = getWrapper({
          user,
          subjects,
        })

        expect(
          wrapper.find('[data-testid="tutoring-alerts"]').exists()
        ).toEqual(expected)

        expect(wrapper.find('[data-testid="toggle-buttons"]').exists()).toEqual(
          expected
        )
      }
    )

    test.each([
      [[], 'true', undefined],
      [['algebraTwo'], undefined, 'true'],
    ])(
      'Should set toggle button value to false when subject is toggled off and true when it is toggled on',
      async (valueBeforeToggle, valueAfterToggle) => {
        const wrapper = getWrapper({
          user,
          subjects,
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
          wrapper.find('[data-testid="toggle-button-algebraTwo"]').attributes()
            .value
        ).toEqual(valueBeforeToggle)

        await clickEditSaveButton(wrapper)
        await toggleMutedSubject(wrapper)
        await clickEditSaveButton(wrapper)

        //After toggle & save
        expect(
          wrapper.find('[data-testid="toggle-button-algebraTwo"]').attributes()
            .value
        ).toEqual(valueAfterToggle)
      }
    )
  })
})
