import { RouterLinkStub, shallowMount } from '@vue/test-utils'
import { merge } from 'lodash-es'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import DefaultHeader from '@/components/App/AppHeader/DefaultHeader/index.vue'
import HamburgerButton from '@/components/App/AppHeader/HamburgerButton.vue'

const getWrapper = (mobileMode = false) => {
  const store = createStore(
    merge({}, storeOptions, {
      modules: {
        app: { getters: { mobileMode: () => mobileMode } },
        user: { getters: { firstName: () => 'Tester' } },
      },
    })
  )

  return shallowMount(DefaultHeader, {
    global: {
      plugins: [store],
      stubs: {
        RouterLink: RouterLinkStub,
      },
    },
  })
}

describe('DefaultHeader', () => {
  it('renders expected elements when in mobile mode', () => {
    const wrapper = getWrapper(true)
    expect(wrapper.classes()).toEqual(['DefaultHeader'])

    // User info
    const userInfo = wrapper.find('.DefaultHeader-user-info')
    expect(userInfo.exists()).toBe(true)
    expect(userInfo.element.tagName).toBe('DIV')

    const avatar = userInfo.find('.DefaultHeader-user-info-avatar')
    expect(avatar.exists()).toBe(true)
    expect(avatar.element.tagName).toBe('IMG')

    const name = userInfo.find('.DefaultHeader-user-info-name')
    expect(name.exists()).toBe(true)
    expect(name.element.tagName).toBe('SPAN')
    expect(name.text()).toBe('Tester')

    // Hamburger
    expect(wrapper.findComponent(HamburgerButton).exists()).toBe(true)
  })

  it('renders expected elements when not in mobile mode', () => {
    const wrapper = getWrapper()
    const logo = wrapper.find('.DefaultHeader-logo')
    expect(logo.exists()).toBe(true)
    expect(logo.element.tagName).toBe('IMG')
    expect(logo.attributes('src')).toBeDefined()
  })
})
