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
import ModalService from '@/services/ModalService'

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

  describe('sessionHoldData watcher', () => {
    const hold = { endsAt: new Date() }
    const state = (extra = {}) => ({
      hold,
      hideAlert: false,
      isVolunteer: true,
      isInSession: false,
      ...extra,
    })

    it.each([
      [
        'a volunteer whose session goes live hides the modal',
        state({ isInSession: true }),
        state(),
        1,
      ],
      [
        'a volunteer already in session does not hide again',
        state({ isInSession: true }),
        state({ isInSession: true }),
        0,
      ],
      [
        'a non-volunteer whose session goes live does not hide',
        state({ isInSession: true, isVolunteer: false }),
        state({ isVolunteer: false }),
        0,
      ],
    ])('%s', (_label, current, previous, hideCalls) => {
      const hide = vi.spyOn(ModalService, 'hide').mockImplementation(() => {})
      const fakeThis = { $store: { commit: vi.fn() } }

      App.watch.sessionHoldData.handler.call(fakeThis, current, previous)

      expect(hide).toHaveBeenCalledTimes(hideCalls)
    })
  })
})
