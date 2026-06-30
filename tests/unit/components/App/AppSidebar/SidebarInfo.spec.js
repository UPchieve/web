import { createStore } from 'vuex'
import { shallowMount } from '@vue/test-utils'
import router from '@/router'
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

test('shows correct layout when logged out', () => {
  const loggedOut = getWrapper({ isAuthenticated: false, mobileMode: false })

  expect(loggedOut.find('.first-name').exists()).toBe(false)
  expect(loggedOut.find('.account-type').exists()).toBe(false)
  expect(loggedOut.find('.indicator').exists()).toBe(false)
})
