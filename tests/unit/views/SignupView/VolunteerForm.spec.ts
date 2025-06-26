import { mount, flushPromises } from '@vue/test-utils'
import router from '@/router'
import store from '@/store'
import { vi, expect, describe, it, beforeEach } from 'vitest'
import VolunteerForm from '@/views/SignupView/VolunteerForm.vue'
import AuthService from '@/services/AuthService'
import NetworkService from '@/services/NetworkService'

describe('VolunteerForm', () => {
  const SIGN_UP_SOURCES = {
    data: {
      signupSources: [
        { id: 5, name: 'Parent / Relative' },
        { id: 2, name: 'Social media' },
        { id: 3, name: 'Friend' },
        { id: 1, name: 'Web search' },
        { id: 6, name: 'Other' },
      ],
    },
  }

  const VOLUNTEER = {
    email: 'volunteer@example.com',
    password: 'password',
    terms: true,
    firstName: 'Example',
    lastName: 'Volunteer',
    phone: '+12015552134',
    signupSourceId: 3,
    otherSignupSource: '',
    referredByCode: null,
  }

  beforeEach(() => {
    vi.resetAllMocks()
    NetworkService.getStudentSignupSources = vi
      .fn()
      .mockResolvedValue(SIGN_UP_SOURCES)
    AuthService.registerOpenVolunteer = vi.fn().mockResolvedValue({})
  })

  const getWrapper = async (data: Record<string, any> = {}) => {
    const wrapper = mount(VolunteerForm, {
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

    const wrapper = await getWrapper(data)
    wrapper.vm.nextPage()
    await flushPromises()

    const formSelects = wrapper.findAllComponents({ name: 'FormSelect' })
    const signUpSources = formSelects.find(
      (select) => select.props('name') === 'signup-source'
    )

    expect(signUpSources?.props().options).toEqual(
      SIGN_UP_SOURCES.data.signupSources
    )
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

    const wrapper = await getWrapper(data)
    const routerPushSpy = vi.spyOn(router, 'push')

    await flushPromises()

    const signupButton = wrapper.find('[data-testid="signup-button"]')
    expect(signupButton.exists()).toBe(true)

    await signupButton.trigger('submit')
    await flushPromises()

    expect(AuthService.registerOpenVolunteer).toHaveBeenCalledWith(VOLUNTEER)
    expect(routerPushSpy).toHaveBeenCalledOnce()
  })
})
