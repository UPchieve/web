import UserAvatarMenu from '@/components/UserAvatarMenu/index.vue'
import UserModeToggle from '@/components/UserAvatarMenu/UserModeToggle.vue'
import { it, describe, expect, vi, afterEach } from 'vitest'
import { createStore, type Store } from 'vuex'
import vuetify from '@/plugins/vuetify'
import { storeOptions } from '../../../../src/store'
import router from '@/router'
import { mount, DOMWrapper, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'

describe('Navigation', () => {
  const SESSION_STATUS = {
    text: 'Ready to chat',
    class: '',
  }
  const DEFAULT_USER_STATE = {
    userType: 'student',
    firstName: 'J',
  }
  const DEFAULT_USER_GETTERS = {
    userType: () => 'student',
    isVolunteer: () => false,
  }

  // Tests query the whole document, so a component left mounted by an earlier test would
  // answer those queries too.
  let mounted: VueWrapper | undefined

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
    vi.restoreAllMocks()
  })

  function getWrapper(options = {}) {
    const store = createStore({
      ...storeOptions,
      modules: {
        ...storeOptions.modules,
        user: {
          namespaced: true,
          getters: {
            ...DEFAULT_USER_GETTERS,
            ...(options?.user?.getters ?? {}),
          },
          state: {
            user: {
              ...DEFAULT_USER_STATE,
              ...(options?.user?.state ?? {}),
            },
          },
        },
        session: {
          namespaced: true,
          getters: {
            sessionStatus: () => SESSION_STATUS,
          },
        },
        app: {
          ...storeOptions.modules.app,
          getters: {
            ...storeOptions.modules.app.getters,
            mobileMode: () => options?.app?.getters?.mobileMode?.() ?? false,
          },
        },
      },
    })

    const wrapper = mount(UserAvatarMenu, {
      attachTo: document.body,
      props: {
        isMenuOpen: options?.isMenuOpen ?? false,
      },
      global: {
        plugins: [store, router, vuetify],
      },
    })
    mounted = wrapper

    /*
     * This is here to make testing the vuetify component work:
     * UserAvatarMenu uses Vuetify's v-menu, which is not rendered as a child of the main component under
     * test (it's placed elsewhere in the document).
     * For this reason, we can't do wrapper.find(...) for any piece of the v-menu, and instead have to
     * query the entire DOMWrapper.
     */
    return {
      setProps: (args: any) => wrapper.setProps(args),
      wrapper: new DOMWrapper(document.body),
      component: wrapper,
      store,
    }
  }

  const isDrawerCollapsed = (store: Store<any>) =>
    store.state.app.sidebar.isCollapsed

  async function expandDrawer(store: Store<any>) {
    store.dispatch('app/sidebar/expand')
    await nextTick()
    expect(isDrawerCollapsed(store)).toBe(false)
  }

  it('Navigates to the profile page and closes the menu', async () => {
    const { wrapper, setProps, component, store } = getWrapper()

    // Profile row should not be visible when the menu is closed
    expect(wrapper.find('[data-testid="menu-row-profile"]').exists()).toBe(
      false
    )

    await setProps({ isMenuOpen: true })
    await nextTick()

    expect(wrapper.find('[data-testid="menu-row-profile"]').exists()).toBe(true)
    await expandDrawer(store)

    const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined)
    await wrapper.find('[data-testid="menu-row-profile"]').trigger('click')
    await nextTick()

    expect(pushSpy).toHaveBeenCalledWith('/profile')
    expect(component.emitted('update:isMenuOpen')).toContainEqual([false])
    expect(isDrawerCollapsed(store)).toBe(true)
  })

  it('Closes the menu and collapses the drawer after switching modes', async () => {
    const { component, store } = getWrapper({
      isMenuOpen: true,
      app: { getters: { mobileMode: () => true } },
      user: { getters: { isStudentVolunteer: () => true } },
    })
    const modeToggle = () => component.findComponent(UserModeToggle)
    await vi.waitFor(() => expect(modeToggle().exists()).toBe(true))
    await expandDrawer(store)

    modeToggle().vm.$emit('switchedMode')
    await nextTick()

    expect(isDrawerCollapsed(store)).toBe(true)
    expect(component.emitted('update:isMenuOpen')).toContainEqual([false])
  })

  it('Can log out', async () => {
    const AuthService = await import('@/services/AuthService')
    const logoutSpy = vi
      .spyOn(AuthService.default, 'logout')
      .mockResolvedValue(undefined)

    const { wrapper } = getWrapper({ isMenuOpen: true })
    await nextTick()

    expect(wrapper.find('[data-testid="menu-row-logout"]').exists()).toBe(true)
    await wrapper.find('[data-testid="menu-row-logout"]').trigger('click')
    await nextTick()

    expect(logoutSpy).toHaveBeenCalled()
  })

  it("Shows the user's first name and session status", async () => {
    const { wrapper } = getWrapper({
      isMenuOpen: true,
      user: {
        state: { firstName: 'Alice', userType: 'student' },
        getters: DEFAULT_USER_GETTERS,
      },
    })
    await nextTick()

    // UserAvatar is always visible outside the menu and should show the name
    expect(wrapper.html()).toContain('Alice')

    // Session status is rendered inside the overlay (desktop mode)
    expect(
      wrapper.find('[data-testid="session-status-container"]').exists()
    ).toBe(true)
    expect(
      wrapper.find('[data-testid="session-status-container"]').text()
    ).toContain(SESSION_STATUS.text)
  })
})
