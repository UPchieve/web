import { mount } from '@vue/test-utils'
import { merge } from 'lodash-es'
import { createStore } from 'vuex'
import router from '@/router'
import { storeOptions } from '@/store'
import App from '@/components/App/index.vue'
import AppHeader from '@/components/App/AppHeader/index.vue'
import AppSidebar from '@/components/App/AppSidebar/index.vue'
import AppModal from '@/components/App/AppModal/index.vue'

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

  const store = createStore(
    merge({}, storeOptions, {
      modules: {
        app: {
          modules: {
            header: { state: { isShown: options.showHeader } },
            sidebar: { state: { isShown: options.showSidebar } },
            modal: { state: { isShown: options.showModal } },
          },
        },
      },
    })
  )

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
})
