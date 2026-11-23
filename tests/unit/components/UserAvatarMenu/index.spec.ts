import UserAvatarMenu from '@/components/UserAvatarMenu/index.vue'
import UserModeToggle from '@/components/UserAvatarMenu/UserModeToggle.vue'
import { it, describe, expect, vi, afterEach } from 'vitest'
import { createStore } from 'vuex'
import vuetify from '@/plugins/vuetify'
import { storeOptions } from '@/store'
import router from '@/router'
import { mount, DOMWrapper, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useAppSidebarStore } from '@/stores/app/sidebar'
import { useSessionOfferStore } from '@/stores/session-offer'
import UserService from '@/services/UserService'

describe('Navigation', () => {
  const DEFAULT_USER_STATE = {
    userType: 'student',
    firstName: 'J',
  }
  const DEFAULT_USER_GETTERS = {
    userType: () => 'student',
    isVolunteer: () => false,
    isSessionAlive: () => false,
    // Real getter, so the test covers how the status is derived from the other getters.
    sessionStatus: storeOptions.modules.user.getters.sessionStatus,
  }

  // Tests query the whole document, so a component left mounted by an earlier test would
  // answer those queries too.
  let mounted: VueWrapper | undefined

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
    document.querySelectorAll('ion-modal').forEach((modal) => modal.remove())
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
        app: {
          ...storeOptions.modules.app,
          getters: {
            ...storeOptions.modules.app.getters,
            mobileMode: () => options?.app?.getters?.mobileMode?.() ?? false,
          },
        },
        featureFlags: {
          ...storeOptions.modules.featureFlags,
          getters: {
            ...storeOptions.modules.featureFlags.getters,
            isStudentCoachModeBlocked: () =>
              options?.featureFlags?.getters?.isStudentCoachModeBlocked?.() ??
              false,
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

  const isDrawerCollapsed = () => useAppSidebarStore().isCollapsed

  async function expandDrawer() {
    useAppSidebarStore().expand()
    await nextTick()
    expect(isDrawerCollapsed()).toBe(false)
  }

  it('Navigates to the profile page and closes the menu', async () => {
    const { wrapper, setProps, component } = getWrapper()

    // Profile row should not be visible when the menu is closed
    expect(wrapper.find('[data-testid="menu-row-profile"]').exists()).toBe(
      false
    )

    await setProps({ isMenuOpen: true })
    await nextTick()

    expect(wrapper.find('[data-testid="menu-row-profile"]').exists()).toBe(true)
    await expandDrawer()

    const pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined)
    await wrapper.find('[data-testid="menu-row-profile"]').trigger('click')
    await nextTick()

    expect(pushSpy).toHaveBeenCalledWith('/profile')
    expect(component.emitted('update:isMenuOpen')).toContainEqual([false])
    expect(isDrawerCollapsed()).toBe(true)
  })

  it('Closes the menu and collapses the drawer after switching modes', async () => {
    const switchSpy = vi
      .spyOn(UserService, 'switchActiveRole')
      .mockResolvedValue(undefined)
    vi.spyOn(router, 'push').mockResolvedValue(undefined)
    const { component } = getWrapper({
      isMenuOpen: true,
      app: { getters: { mobileMode: () => true } },
      user: { getters: { isStudentVolunteer: () => true } },
    })
    const modeToggle = () => component.findComponent(UserModeToggle)
    await vi.waitFor(() => expect(modeToggle().exists()).toBe(true))
    await expandDrawer()

    modeToggle().vm.$emit('switchMode')

    await vi.waitFor(() => expect(isDrawerCollapsed()).toBe(true))
    expect(switchSpy).toHaveBeenCalledWith(expect.anything(), 'volunteer')
    expect(component.emitted('update:isMenuOpen')).toContainEqual([false])
  })

  describe('when a coach in the queue switches to student mode', () => {
    const COACH_OPTIONS = {
      isMenuOpen: true,
      user: {
        getters: {
          isStudentVolunteer: () => true,
          userType: () => 'volunteer',
        },
      },
    }

    async function requestSwitch() {
      useSessionOfferStore().queueJoiningState = 'joined'
      const result = getWrapper(COACH_OPTIONS)
      const modeToggle = () => result.component.findComponent(UserModeToggle)
      await vi.waitFor(() => expect(modeToggle().exists()).toBe(true))
      modeToggle().vm.$emit('switchMode')
      await nextTick()
      await nextTick()
      return result
    }

    const confirmation = (wrapper: DOMWrapper<Element>) =>
      wrapper.find('[data-testid="leave-queue-confirmation"]')

    it('replaces the menu content with the confirmation', async () => {
      const switchSpy = vi.spyOn(UserService, 'switchActiveRole')
      const { wrapper } = await requestSwitch()

      expect(confirmation(wrapper).text()).toContain(
        'Leave queue and switch to Student Mode.'
      )
      expect(wrapper.find('[data-testid="menu-row-profile"]').exists()).toBe(
        false
      )
      expect(document.activeElement).toBe(
        wrapper.find('[data-testid="leave-queue-stay"]').element
      )
      expect(switchSpy).not.toHaveBeenCalled()
    })

    it('goes back to the menu when the coach stays', async () => {
      const switchSpy = vi.spyOn(UserService, 'switchActiveRole')
      const { wrapper } = await requestSwitch()

      await wrapper.find('[data-testid="leave-queue-stay"]').trigger('click')

      expect(confirmation(wrapper).exists()).toBe(false)
      expect(wrapper.find('[data-testid="menu-row-profile"]').exists()).toBe(
        true
      )
      expect(switchSpy).not.toHaveBeenCalled()
    })

    it('switches to student mode when the coach confirms', async () => {
      const switchSpy = vi
        .spyOn(UserService, 'switchActiveRole')
        .mockResolvedValue(undefined)
      vi.spyOn(router, 'push').mockResolvedValue(undefined)
      const { wrapper, component } = await requestSwitch()

      await wrapper.find('[data-testid="leave-queue-confirm"]').trigger('click')

      expect(switchSpy).toHaveBeenCalledWith(expect.anything(), 'student')
      await vi.waitFor(() =>
        expect(component.emitted('update:isMenuOpen')).toContainEqual([false])
      )
    })

    it('dismisses the confirmation when the menu is closed', async () => {
      const { wrapper, setProps } = await requestSwitch()

      await setProps({ isMenuOpen: false })
      await setProps({ isMenuOpen: true })
      await nextTick()

      expect(confirmation(wrapper).exists()).toBe(false)
      expect(wrapper.find('[data-testid="menu-row-profile"]').exists()).toBe(
        true
      )
    })
  })

  it('hides the mode toggle when coach mode is blocked', async () => {
    const { component } = getWrapper({
      isMenuOpen: true,
      user: { getters: { isStudentVolunteer: () => true } },
      featureFlags: {
        getters: { isStudentCoachModeBlocked: () => true },
      },
    })

    await nextTick()

    expect(component.findComponent(UserModeToggle).exists()).toBe(false)
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
    ).toContain('Ready to chat')
  })

  it('Shows the session status from the user store', async () => {
    const { wrapper } = getWrapper({
      isMenuOpen: true,
      user: {
        state: { firstName: 'Alice', userType: 'student' },
        getters: { ...DEFAULT_USER_GETTERS, isSessionAlive: () => true },
      },
    })
    await nextTick()

    expect(
      wrapper.find('[data-testid="session-status-container"]').text()
    ).toContain('Chat in session')
  })
})
