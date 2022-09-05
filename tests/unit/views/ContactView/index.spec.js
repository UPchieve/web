import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import userModule from '@/store/modules/user'
import appModule from '@/store/modules/app'
import ContactView from '@/views/ContactView'
import vSelect from 'vue-select'

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.component('v-select', vSelect)

const getWrapper = (
  isAuthenticated = true,
  isVolunteer = false,
  isVerified = true
) => {
  const store = new Vuex.Store({
    modules: {
      app: {
        ...appModule,
      },
      user: {
        ...userModule,
        getters: {
          isAuthenticated: () => isAuthenticated,
          isVolunteer: () => isVolunteer,
          isVerified: () => isVerified,
        },
      },
    },
  })

  store.dispatch('user/addToUser', { email: 'avalid@email.com' })

  return shallowMount(ContactView, { localVue, store })
}

describe('ContactView', () => {
  it('renders ContactView', () => {
    const wrapper = getWrapper(true, true, true)
    expect(wrapper.is(ContactView))
    expect(wrapper.find('.contact__header').text()).toEqual('Contact Us')
  })

  it('renders ContactView for a logged in user', () => {
    const wrapper = getWrapper(true, true, true)
    expect(wrapper.vm.hasValidEmail).toBeTruthy()
    expect(wrapper.find('#contact-form-email').exists()).toBeFalsy()
  })

  it('renders ContactView for an anonymous user', () => {
    const wrapper = getWrapper(false, false, false)
    expect(wrapper.vm.hasValidEmail).toBeFalsy()
    expect(wrapper.find('#contact-form-email').exists()).toBeTruthy()
    expect(wrapper.find('#contact-form-email').isVisible()).toBeTruthy()
  })
})
