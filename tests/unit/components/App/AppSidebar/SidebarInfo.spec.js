import { createStore } from 'vuex'
import { shallowMount } from '@vue/test-utils'
import { storeOptions } from '@/store'
import SidebarInfo from '@/components/App/AppSidebar/SidebarInfo.vue'

const getWrapper = (options) => {
  const store = createStore({
    modules: {
      ...storeOptions.modules,
      app: {
        ...storeOptions.modules.app,
        getters: {
          ...storeOptions.modules.app.getters,
          mobileMode: () => options.mobileMode,
        },
      },
      user: {
        ...storeOptions.modules.user,
        getters: {
          ...storeOptions.modules.user.getters,
          isAuthenticated: () => options.isAuthenticated,
        },
      },
    },
  })
  return shallowMount(SidebarInfo, { global: { plugins: [store] } })
}

test('shows correct layout when logged in and not in mobileMode', () => {
  const loggedIn = getWrapper({ isAuthenticated: true, mobileMode: false })

  expect(loggedIn.find('.SidebarInfo-name').exists()).toBe(true)
  expect(loggedIn.find('.SidebarInfo-type').exists()).toBe(true)
  expect(loggedIn.find('.SidebarInfo-status').exists()).toBe(true)
  expect(loggedIn.find('hr').exists()).toBe(false)
})

test('shows correct layout when logged in and in mobileMode', () => {
  const loggedIn = getWrapper({ isAuthenticated: true, mobileMode: true })

  expect(loggedIn.find('.SidebarInfo-name').exists()).toBe(true)
  expect(loggedIn.find('.SidebarInfo-type').exists()).toBe(true)
  expect(loggedIn.find('.SidebarInfo-status').exists()).toBe(false)
})

test('shows correct layout when logged out', () => {
  const loggedOut = getWrapper({ isAuthenticated: false, mobileMode: false })

  expect(loggedOut.find('.SidebarInfo-name').exists()).toBe(false)
  expect(loggedOut.find('.SidebarInfo-type').exists()).toBe(false)
  expect(loggedOut.find('.SidebarInfo-status').exists()).toBe(false)
})
