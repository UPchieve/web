import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import router from '@/router'
import { storeOptions } from '@/store'
import { useAppHeaderStore } from '@/stores/app/header'
import { useAppSidebarStore } from '@/stores/app/sidebar'
import { useAppModalStore } from '@/stores/app/modal'
import App from '@/components/App/index.vue'
import AppHeader from '@/components/App/AppHeader/index.vue'
import AppSidebar from '@/components/App/AppSidebar/index.vue'
import AppModal from '@/components/App/AppModal/index.vue'
import SessionOfferAlert from '@/views/SessionOffers/SessionOfferAlert.vue'

const getWrapper = (options = {}) => {
  options = {
    showHeader: true,
    showSidebar: true,
    showModal: false,
    mockRoute: {
      path: '/dashboard',
      params: {},
      query: {},
      name: 'DashboardView',
    },
    ...options,
  }

  useAppHeaderStore().setIsShown(options.showHeader)
  if (options.showSidebar) useAppSidebarStore().show()
  if (options.showModal) useAppModalStore().show()

  const store = createStore(storeOptions)

  return mount(App, {
    attachTo: window.document.body,
    global: {
      plugins: [router, store],
      mocks: {
        $route: options.mockRoute,
      },
      stubs: options.stubs,
    },
  })
}

describe('App', () => {
  it('syncs viewport state when the mobile breakpoint changes', () => {
    const originalMatchMedia = window.matchMedia.bind(window)
    const mobileModeMediaQuery = originalMatchMedia('(max-width: 767px)')
    const addEventListener = vi.spyOn(mobileModeMediaQuery, 'addEventListener')
    const removeEventListener = vi.spyOn(
      mobileModeMediaQuery,
      'removeEventListener'
    )
    const matchMedia = vi
      .spyOn(window, 'matchMedia')
      .mockImplementation((query) =>
        query === '(max-width: 767px)'
          ? mobileModeMediaQuery
          : originalMatchMedia(query)
      )

    const wrapper = getWrapper()
    const breakpointChangeHandler = addEventListener.mock.calls.find(
      ([event]) => event === 'change'
    )[1]
    const dispatch = vi.spyOn(wrapper.vm.$store, 'dispatch')

    breakpointChangeHandler({ matches: true })

    expect(dispatch).toHaveBeenCalledWith('app/mobileModeChange', true)

    wrapper.unmount()
    expect(removeEventListener).toHaveBeenCalledWith(
      'change',
      breakpointChangeHandler
    )
    matchMedia.mockRestore()
  })

  it('renders expected elements', () => {
    const wrapper = getWrapper().find('#app')
    expect(wrapper.classes('App')).toBe(true)
    expect(wrapper.findComponent(AppHeader).exists()).toBe(true)
    expect(wrapper.findComponent(AppSidebar).exists()).toBe(true)
    expect(wrapper.findComponent(AppModal).exists()).toBe(false)
    expect(
      wrapper.find('[data-testid="refresh-app-alert"]').exists()
    ).toBeTruthy()

    const routerViewWrapper = wrapper.find('.App-router-view-wrapper')
    expect(routerViewWrapper.exists()).toBe(true)
    expect(routerViewWrapper.element.tagName).toBe('DIV')
    expect(routerViewWrapper.classes()).toEqual([
      'App-router-view-wrapper',
      'App-router-view-wrapper--header',
      'App-router-view-wrapper--sidebar',
    ])
  })

  it('conditionally shows `AppHeader`', () => {
    const wrapper = getWrapper({ showHeader: false })
    expect(wrapper.findComponent(AppHeader).exists()).toBe(true)
    expect(wrapper.findComponent(AppHeader).isVisible()).toBe(false)

    const routerViewWrapper = wrapper.find('.App-router-view-wrapper')
    expect(routerViewWrapper.classes('App-router-view-wrapper--header')).toBe(
      false
    )
  })

  it('conditionally renders `AppSidebar`', () => {
    const wrapper = getWrapper({ showSidebar: false })
    expect(wrapper.findComponent(AppSidebar).exists()).toBe(false)

    const routerViewWrapper = wrapper.find('.App-router-view-wrapper')
    expect(routerViewWrapper.classes('App-router-view-wrapper--sidebar')).toBe(
      false
    )
  })

  it('conditionally renders `AppModal`', () => {
    const wrapper = getWrapper({ showModal: true })
    expect(wrapper.findComponent(AppModal).exists()).toBe(true)
  })

  it('does not render the RefreshAppAlert if in SessionView', () => {
    const mockSessionRoute = {
      name: 'SessionView',
      path: '/session/:topic/:subTopic/:sessionId?',
    }
    const wrapper = getWrapper({ mockRoute: mockSessionRoute })
    const refreshAppAlert = wrapper.find('[data-testid="refresh-app-alert"]')
    expect(refreshAppAlert.exists()).toBeFalsy()
  })

  describe('SessionOfferAlert', () => {
    const offer = { sessionId: 'session-1', expiresAt: new Date() }
    const liveSession = { id: 'session-2', createdAt: new Date() }

    const mountWith = async ({
      userType = 'volunteer',
      sessionOffer = offer,
      session = {},
    } = {}) => {
      const wrapper = getWrapper({ stubs: { SessionOfferAlert: true } })
      wrapper.vm.$store.commit('user/setUser', { userType })
      wrapper.vm.$store.commit('user/setSession', session)
      wrapper.vm.$store.commit('volunteer/setSessionOffer', sessionOffer)
      await wrapper.vm.$nextTick()
      return wrapper
    }

    it.each([
      ['shows for a volunteer with an offer', {}, true],
      ['hides with no offer', { sessionOffer: null }, false],
      ['hides for a non-volunteer', { userType: 'student' }, false],
      ['hides while in a live session', { session: liveSession }, false],
    ])('%s', async (_label, state, shown) => {
      const wrapper = await mountWith(state)

      expect(wrapper.findComponent(SessionOfferAlert).exists()).toBe(shown)
    })

    it('hides once the offer is cleared', async () => {
      const wrapper = await mountWith()

      wrapper.vm.$store.commit('volunteer/clearSessionOffer', 'session-1')
      await wrapper.vm.$nextTick()

      expect(wrapper.findComponent(SessionOfferAlert).exists()).toBe(false)
    })

    it('remounts for a new offer', async () => {
      const wrapper = await mountWith()
      const first = wrapper.findComponent(SessionOfferAlert).vm

      wrapper.vm.$store.commit('volunteer/setSessionOffer', {
        ...offer,
        sessionId: 'session-3',
      })
      await wrapper.vm.$nextTick()

      expect(wrapper.findComponent(SessionOfferAlert).vm).not.toBe(first)
    })

    it('does not touch the app modal', async () => {
      const wrapper = await mountWith()
      useAppModalStore().show({ component: 'ConfirmModal' })

      wrapper.vm.$store.commit('volunteer/clearSessionOffer', 'session-1')
      await wrapper.vm.$nextTick()

      expect(useAppModalStore().isShown).toBe(true)
    })
  })
})
