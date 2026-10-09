import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import router from '@/router'
import { storeOptions } from '@/store'
import { useAppSidebarStore } from '@/stores/app/sidebar'
import SidebarLink from '@/components/App/AppSidebar/SidebarLink.vue'
import { vi } from 'vitest'

const getWrapper = (props = {}) => {
  const store = createStore(storeOptions)

  return shallowMount(SidebarLink, {
    global: {
      plugins: [router, store],
    },
    props,
    slots: {
      default: '',
    },
  })
}

describe('SidebarLink', () => {
  it.skip('renders expected elements', () => {
    // const wrapper = getWrapper({ to: "/", icon: HouseIcon, text: "Home" });
    const wrapper = getWrapper({ to: '/', text: 'Home' })
    expect(wrapper.find('router-link-stub')).toBe(true)
    expect(wrapper.classes()).toEqual(['SidebarLink'])
    expect(wrapper.props('to')).toBe('/')
    // expect(wrapper.contains(HouseIcon)).toBe(true);

    const text = wrapper.find('p')
    expect(text.text()).toBe('Home')
  })

  it('collapses sidebar when clicked', () => {
    const collapse = vi.spyOn(useAppSidebarStore(), 'collapse')
    const wrapper = getWrapper({ to: '/', text: 'Home', openNewTab: false })
    wrapper.find('.SidebarLink').trigger('click')
    expect(collapse).toHaveBeenCalled()
  })

  it('runs onClick for a link that opens in a new tab', () => {
    const onClick = vi.fn()
    const wrapper = getWrapper({
      to: 'https://example.com',
      text: 'Community',
      openNewTab: true,
      onClick,
    })
    wrapper.find('a').trigger('click')
    expect(onClick).toHaveBeenCalled()
  })
})
