import UserAvatarMenu from '@/components/UserAvatarMenu/index.vue'
import { it, describe, expect, vi } from 'vitest'
import { createStore } from 'vuex'
import vuetify from '@/plugins/vuetify'
import { storeOptions } from '../../../../src/store'
import router from '@/router'
import { mount, DOMWrapper } from '@vue/test-utils'
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
          namespaced: true,
          getters: {
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
    }
  }

  it('Can navigate to the profile page', async () => {
    const { wrapper, setProps } = getWrapper()

    // Profile row should not be visible when the menu is closed
    expect(wrapper.find('[data-testid="menu-row-profile"]').exists()).toBe(
      false
    )

    await setProps({ isMenuOpen: true })
    await nextTick()

    expect(wrapper.find('[data-testid="menu-row-profile"]').exists()).toBe(true)

    const pushSpy = vi.spyOn(router, 'push')
    await wrapper.find('[data-testid="menu-row-profile"]').trigger('click')
    await nextTick()
    expect(pushSpy).toHaveBeenCalledWith('/profile')
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
