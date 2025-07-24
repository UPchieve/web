import { nextTick } from 'vue'
import { createStore } from 'vuex'
import { shallowMount } from '@vue/test-utils'
import router from '@/router'
import { storeOptions } from '@/store'

import SidebarInfo from '@/components/App/AppSidebar/SidebarInfo.vue'
import AuthService from '@/services/AuthService'

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
          isVolunteer: () => true,
          isAuthenticated: () => options.isAuthenticated,
        },
      },
    },
  })
  return shallowMount(SidebarInfo, {
    global: {
      plugins: [store, router],
    },
  })
}

test('shows correct layout when logged in and not in mobileMode', () => {
  const loggedIn = getWrapper({ isAuthenticated: true, mobileMode: false })

  expect(loggedIn.find('.first-name').exists()).toBe(true)
  expect(loggedIn.find('.account-type').exists()).toBe(true)
  expect(loggedIn.find('.indicator').exists()).toBe(true)
})

test('shows correct layout when logged in and in mobileMode', () => {
  const loggedIn = getWrapper({ isAuthenticated: true, mobileMode: true })

  expect(loggedIn.find('.first-name').exists()).toBe(true)
  expect(loggedIn.find('.account-type').exists()).toBe(true)
  expect(loggedIn.find('.indicator').exists()).toBe(true)
})

test('shows correct layout when logged out', () => {
  const loggedOut = getWrapper({ isAuthenticated: false, mobileMode: false })

  expect(loggedOut.find('.first-name').exists()).toBe(false)
  expect(loggedOut.find('.account-type').exists()).toBe(false)
  expect(loggedOut.find('.indicator').exists()).toBe(false)
})

test('clicking avatar area opens user menu', async () => {
  const wrapper = getWrapper({ isAuthenticated: true, mobileMode: false })
  expect(wrapper.find('.user-menu').exists()).toBe(false)
  wrapper.find('#info-container').trigger('click')
  await nextTick()
  expect(wrapper.find('.user-menu').exists()).toBe(true)
})

test('user menu contains Profile and Logout buttons', async () => {
  const wrapper = getWrapper({ isAuthenticated: true, mobileMode: false })
  wrapper.find('#info-container').trigger('click')
  await nextTick()
  const buttons = wrapper.findAll('.menu-button')
  expect(buttons).toHaveLength(2)
  expect(buttons[0].text()).toBe('Profile')
  expect(buttons[1].text()).toBe('Log out of UPchieve')
})

test('clicking Profile button navigates to /profile', async () => {
  vi.restoreAllMocks()
  const routerPushSpy = vi.spyOn(router, 'push')
  const wrapper = getWrapper({ isAuthenticated: true, mobileMode: false })
  wrapper.find('#info-container').trigger('click')
  await nextTick()
  const profileButton = wrapper.findAll('.menu-button')[0]
  profileButton.trigger('click')
  expect(routerPushSpy).toHaveBeenCalledWith('/profile')
})

test('clicking Logout button calls logout function', async () => {
  AuthService.logout = vi.fn().mockReturnValue()
  const wrapper = getWrapper({ isAuthenticated: true, mobileMode: false })
  wrapper.find('#info-container').trigger('click')
  await nextTick()
  const buttons = wrapper.findAll('.menu-button')
  const logoutButton = buttons[1]
  logoutButton.trigger('click')
  expect(AuthService.logout).toHaveBeenCalled()
})
