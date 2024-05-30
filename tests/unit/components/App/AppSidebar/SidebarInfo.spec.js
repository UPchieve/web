import { shallowMount } from '@vue/test-utils'
import store from '@/store'
import SidebarInfo from '@/components/App/AppSidebar/SidebarInfo.vue'

const getWrapper = (props) =>
  shallowMount(SidebarInfo, { global: { plugins: [store] }, props })

describe('SidebarInfo', () => {
  test('layout', () => {
    const loggedIn = getWrapper({ authenticated: true })
    const loggedOut = getWrapper({ authenticated: false })

    expect(loggedIn.classes('SidebarInfo')).toBe(true)
    expect(loggedOut.classes('SidebarInfo')).toBe(true)

    // TODO: figure out how to test dynamic components
    // expect(loggedIn.find(".SidebarInfo-avatar").exists()).toBe(true);
    // expect(loggedOut.find(".SidebarInfo-avatar").exists()).toBe(false);

    expect(loggedIn.find('.SidebarInfo-name').exists()).toBe(true)
    expect(loggedOut.find('.SidebarInfo-name').exists()).toBe(false)

    expect(loggedIn.find('.SidebarInfo-type').exists()).toBe(true)
    expect(loggedOut.find('.SidebarInfo-type').exists()).toBe(false)

    expect(loggedIn.find('.SidebarInfo-status').exists()).toBe(true)
    expect(loggedOut.find('.SidebarInfo-status').exists()).toBe(false)
  })
})
