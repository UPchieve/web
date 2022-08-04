import { shallowMount, createLocalVue } from '@vue/test-utils'
import { merge } from 'lodash'
import Vuex from 'vuex'
import { storeOptions } from '@/store'
import DefaultHeader from '@/components/App/AppHeader/DefaultHeader'
import HamburgerButton from '@/components/App/AppHeader/DefaultHeader/HamburgerButton'

const localVue = createLocalVue()
localVue.use(Vuex)

const getWrapper = (mobileMode = false) => {
  const store = new Vuex.Store(
    merge({}, storeOptions, {
      modules: {
        app: { getters: { mobileMode: () => mobileMode } },
        user: { getters: { firstName: () => 'Tester' } },
      },
    })
  )

  return shallowMount(DefaultHeader, {
    localVue,
    store,
    stubs: ['router-link', 'router-view'],
  })
}

describe('DefaultHeader', () => {
  it('renders expected elements when in mobile mode', () => {
    const wrapper = getWrapper(true)
    expect(wrapper.classes()).toEqual(['DefaultHeader'])

    // User info
    const userInfo = wrapper.findComponent('.DefaultHeader-user-info')
    expect(userInfo.exists()).toBe(true)
    expect(userInfo.element.tagName).toEqual('DIV')

    const avatar = userInfo.find('.DefaultHeader-user-info-avatar')
    expect(avatar.exists()).toBe(true)
    expect(avatar.element.tagName).toEqual('IMG')

    const name = userInfo.find('.DefaultHeader-user-info-name')
    expect(name.exists()).toBe(true)
    expect(name.element.tagName).toEqual('SPAN')
    expect(name.text()).toBe('Tester')

    // Hamburger
    expect(wrapper.findComponent(HamburgerButton).exists()).toBe(true)
  })

  it('renders expected elements when not in mobile mode', () => {
    const wrapper = getWrapper()
    const logo = wrapper.findComponent('.DefaultHeader-logo')
    expect(logo.exists()).toBe(true)
    expect(logo.element.tagName).toEqual('IMG')
    expect(logo.attributes('src')).toBeDefined()
  })
})
