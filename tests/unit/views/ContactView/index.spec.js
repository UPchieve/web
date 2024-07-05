import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import userModule from '@/store/modules/user'
import appModule from '@/store/modules/app'
import ContactView from '@/views/ContactView.vue'

const getWrapper = (
  isAuthenticated = true,
  userType = 'student',
  isVerified = true
) => {
  const store = createStore({
    modules: {
      app: {
        ...appModule,
      },
      user: {
        ...userModule,
        getters: {
          isAuthenticated: () => isAuthenticated,
          userType: () => userType,
          isVerified: () => isVerified,
        },
      },
    },
  })

  store.dispatch('user/addToUser', { email: 'avalid@email.com' })

  return shallowMount(ContactView, { global: { plugins: [store] } })
}

describe('ContactView', () => {
  it('renders ContactView', () => {
    const wrapper = getWrapper(true, true, true)
    expect(wrapper.findComponent(ContactView))
    expect(wrapper.find('.contact__header').text()).toEqual('Contact Us')
  })

  it('renders ContactView for a logged in user', () => {
    const wrapper = getWrapper(true, true, true)
    expect(wrapper.vm.hasValidEmail).toBeTruthy()
    expect(wrapper.find('#contact-form-email').exists()).toBeFalsy()
  })

  it('renders ContactView for an anonymous user', () => {
    const wrapper = getWrapper(false, undefined, false)
    expect(wrapper.vm.hasValidEmail).toBeFalsy()
    expect(wrapper.find('#contact-form-email').exists()).toBeTruthy()
    expect(wrapper.find('#contact-form-email').isVisible()).toBeTruthy()
  })
})
