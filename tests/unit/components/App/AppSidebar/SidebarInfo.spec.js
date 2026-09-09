import { createStore } from 'vuex'
import { shallowMount, mount, DOMWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import router from '@/router'
import { storeOptions } from '@/store'
import vuetify from '@/plugins/vuetify'

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

describe('user menu', () => {
  let wrapper

  afterEach(() => {
    wrapper.unmount()
    vi.restoreAllMocks()
  })

  const getMountedWrapper = async () => {
    const store = createStore({
      modules: {
        ...storeOptions.modules,
        app: {
          ...storeOptions.modules.app,
          getters: {
            ...storeOptions.modules.app.getters,
            mobileMode: () => false,
          },
        },
        user: {
          ...storeOptions.modules.user,
          getters: {
            ...storeOptions.modules.user.getters,
            isVolunteer: () => true,
            isAuthenticated: () => true,
          },
        },
      },
    })
    wrapper = mount(SidebarInfo, {
      attachTo: document.body,
      global: { plugins: [store, router, vuetify] },
    })
    await nextTick()
    // The v-menu content is teleported out of the component, so query the whole document for it.
    return new DOMWrapper(document.body)
  }

  test('closes the menu after choosing Profile', async () => {
    const body = await getMountedWrapper()
    vi.spyOn(router, 'push').mockResolvedValue(undefined)

    await wrapper.find('[data-testid="menu-container"]').trigger('click')
    await nextTick()
    expect(wrapper.find('#info-container').attributes('aria-expanded')).toBe(
      'true'
    )
    expect(body.find('[data-testid="menu-row-profile"]').exists()).toBe(true)

    await body.find('[data-testid="menu-row-profile"]').trigger('click')
    await nextTick()

    expect(router.push).toHaveBeenCalledWith('/profile')
    expect(wrapper.find('#info-container').attributes('aria-expanded')).toBe(
      'false'
    )
  })
})
