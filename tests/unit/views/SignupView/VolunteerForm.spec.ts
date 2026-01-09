import { mount, flushPromises, VueWrapper } from '@vue/test-utils'
import router from '@/router'
import store from '@/store'
import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest'
import VolunteerForm from '@/views/SignupView/VolunteerForm.vue'
import AuthService from '@/services/AuthService'
import NetworkService from '@/services/NetworkService'
import { page } from '@vitest/browser/context'

describe('VolunteerForm', () => {
  const SIGN_UP_SOURCES = {
    data: {
      signupSources: [
        { id: 5, name: 'Parent / Relative' },
        { id: 2, name: 'Social media' },
        { id: 3, name: 'Friend' },
        { id: 1, name: 'Web search' },
        { id: 6, name: 'Other' },
        { id: 7, name: 'TikTok' },
      ],
    },
  }

  const VOLUNTEER = {
    email: 'volunteer@example.com',
    // pragma: allowlist nextline secret
    password: 'password',
    terms: true,
    firstName: 'Example',
    lastName: 'Volunteer',
    phone: '+12015552134',
    signupSourceId: 3,
    otherSignupSource: '',
    referredByCode: null,
    inviteCode: null,
  }
  let wrapper: VueWrapper
  beforeEach(async () => {
    vi.resetAllMocks()
    NetworkService.getStudentSignupSources = vi
      .fn()
      .mockResolvedValue(SIGN_UP_SOURCES)
    AuthService.registerOpenVolunteer = vi.fn().mockResolvedValue({})
  })

  afterEach(() => {
    if (wrapper) {
      wrapper?.unmount()
    }
  })

  const getPhoneInputs = (wrapper: VueWrapper) => {
    const mazInputs = wrapper.findAll('.m-input-wrapper-input')
    const countryCodeInput = mazInputs
      .find((input) => input?.text() === 'Country code')!
      .find('.m-input-input')
    const phoneNumberInput = mazInputs
      .find(
        (input) =>
          input.text() === 'Phone number' ||
          input.text() === 'Example: (201) 555-0123'
      )!
      .find('.m-input-input')
    return { countryCodeInput, phoneNumberInput }
  }

  const fillOutFormStep2 = async (args: {
    wrapper: VueWrapper
    values?: {
      firstName?: string
      lastName?: string
      phoneNumber?: string
      signupSource?: { id: number; name: string }
      userAgreement?: boolean
    }
    skipSteps?: (
      | 'firstName'
      | 'lastName'
      | 'phoneNumber'
      | 'signupSource'
      | 'userAgreement'
    )[]
  }) => {
    const firstNameField = args.wrapper.find('[data-testid="firstNameField"]')
    const lastNameField = args.wrapper.find('[data-testid="lastNameField"]')
    const { countryCodeInput, phoneNumberInput } = getPhoneInputs(args.wrapper)
    const userAgreementCheckbox = args.wrapper.find(
      '[data-testid="userAgreementCheckbox"]'
    )

    const stepsToSkip = args.skipSteps ?? []
    if (!stepsToSkip.includes('firstName'))
      await firstNameField.setValue(args.values?.firstName ?? 'testfirstname')
    if (!stepsToSkip.includes('lastName'))
      await lastNameField.setValue(args.values?.lastName ?? 'testlastname')
    if (!stepsToSkip.includes('phoneNumber')) {
      await countryCodeInput.setValue('+1')
      await phoneNumberInput.setValue(args.values?.phoneNumber ?? '2129981123')
    }
    if (!stepsToSkip.includes('signupSource'))
      args.wrapper.vm.signupSourceId =
        args.values?.signupSource ?? SIGN_UP_SOURCES.data.signupSources[0].id
    if (!stepsToSkip.includes('userAgreement')) {
      await userAgreementCheckbox.trigger('change')
      args.wrapper.vm.credentials = {
        ...args.wrapper.vm.credentials,
        terms: true,
      }
    }

    const signupButton = page.getByTestId('signup-button')
    await signupButton.click()
  }

  const getWrapper = async (data: Record<string, any> = {}) => {
    const wrapper = mount(VolunteerForm, {
      attachTo: window.document.body,
      global: {
        plugins: [store, router],
      },
    })

    await router.push('/sign-up/volunteer/about')

    await wrapper.setData({
      ...wrapper.vm.$data,
      ...data,
      isLoadingSignupSources: false,
    })

    return wrapper
  }

  it('Show all sign up sources after volunteer enters email and password', async () => {
    const data = {
      credentials: {
        email: VOLUNTEER.email,
        password: VOLUNTEER.password,
      },
      step: 'step-2',
      signupSourcesOptions: SIGN_UP_SOURCES.data.signupSources,
    }

    wrapper = await getWrapper(data)

    const formSelects = wrapper.findAllComponents({ name: 'FormSelect' })
    const signUpSources = formSelects.find(
      (select) => select.props('name') === 'signup-source'
    )

    expect(signUpSources?.props().options).toEqual(
      SIGN_UP_SOURCES.data.signupSources
    )
  })

  it('Cannot proceed from step 2 until all required fields are provided', async () => {
    const data = {
      credentials: {
        email: VOLUNTEER.email,
        password: VOLUNTEER.password,
      },
      step: 'step-2',
      signupSourcesOptions: SIGN_UP_SOURCES.data.signupSources,
    }
    wrapper = await getWrapper(data)
    const signupButton = wrapper.find('[data-testid="signup-button"]')

    const checkWhetherSignupCallMade = async () => {
      await signupButton.trigger('submit')
      expect(AuthService.registerOpenVolunteer).not.toHaveBeenCalled()
    }

    // fill out only some steps
    await checkWhetherSignupCallMade()
    await fillOutFormStep2({
      wrapper,
      skipSteps: ['lastName', 'phoneNumber', 'signupSource', 'userAgreement'],
    })
    await checkWhetherSignupCallMade()
    await fillOutFormStep2({
      wrapper,
      skipSteps: ['phoneNumber', 'signupSource', 'userAgreement'],
    })
    await checkWhetherSignupCallMade()
    await fillOutFormStep2({
      wrapper,
      skipSteps: ['signupSource', 'userAgreement'],
    })
    await checkWhetherSignupCallMade()
    await fillOutFormStep2({
      wrapper,
      skipSteps: ['userAgreement'],
    })
    // Finally, the registration call is made after all required fields are supplied
    await checkWhetherSignupCallMade()
    await fillOutFormStep2({ wrapper })
    expect(AuthService.registerOpenVolunteer).toHaveBeenCalled()
  })

  it("Requires a text value for signup source when 'Other' is selected", async () => {
    const data = {
      credentials: {
        email: VOLUNTEER.email,
        password: VOLUNTEER.password,
      },
      step: 'step-2',
      signupSourcesOptions: SIGN_UP_SOURCES.data.signupSources,
    }
    wrapper = await getWrapper(data)
    await flushPromises()
    await fillOutFormStep2({
      wrapper,
      values: {
        signupSource: SIGN_UP_SOURCES.data.signupSources.find(
          (source) => source.name === 'Other'
        ).id,
      },
    })
    expect(AuthService.registerOpenVolunteer).not.toHaveBeenCalled()

    // Now fill out a text value for other signup source
    await wrapper
      .find('[data-testid="otherSignupSource"]')
      .setValue('some signup source')

    const signupButton = page.getByTestId('signup-button')
    await signupButton.click()
    expect(AuthService.registerOpenVolunteer).toHaveBeenCalled()
  })

  it('Should go to verification page after clicking Sign Up', async () => {
    const data = {
      credentials: {
        email: VOLUNTEER.email,
        password: VOLUNTEER.password,
        terms: true,
      },
      profile: {
        firstName: VOLUNTEER.firstName,
        lastName: VOLUNTEER.lastName,
        phone: VOLUNTEER.phone,
      },
      step: 'step-2',
      signupSourcesOptions: SIGN_UP_SOURCES.data.signupSources,
      signupSourceId: VOLUNTEER.signupSourceId,
    }

    wrapper = await getWrapper(data)
    const routerPushSpy = vi.spyOn(router, 'push')

    await flushPromises()

    const signupButton = page.getByTestId('signup-button')
    await signupButton.click()

    await flushPromises()

    expect(AuthService.registerOpenVolunteer).toHaveBeenCalledWith(VOLUNTEER)
    expect(routerPushSpy).toHaveBeenCalledOnce()
  })
})
