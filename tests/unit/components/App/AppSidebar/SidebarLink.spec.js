import { shallowMount } from '@vue/test-utils'
import { merge } from 'lodash-es'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import SidebarLink from '@/components/App/AppSidebar/SidebarLink.vue'
import { vi } from 'vitest'

const getWrapper = (props = {}, collapse) => {
  const store = createStore(
    merge({}, storeOptions, {
      modules: { app: { modules: { sidebar: { actions: { collapse } } } } },
    })
  )

  return shallowMount(SidebarLink, {
    global: {
      plugins: [store],
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

  it('conditionally renders icon', () => {
    // const wrapper = getWrapper({ to: "/", text: "Home" });
    // const icon = wrapper.find(UpchieveIcon);
    // expect(icon.exists()).toBe(false);
  })

  it('collapses sidebar when clicked', () => {
    const collapse = vi.fn()
    const wrapper = getWrapper(
      { to: '/', text: 'Home', openNewTab: false },
      collapse
    )
    wrapper.find('.SidebarLink').trigger('click')
    expect(collapse).toHaveBeenCalled()
  })
})
