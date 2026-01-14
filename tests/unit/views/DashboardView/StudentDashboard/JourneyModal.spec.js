import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { createRouter, createMemoryHistory } from 'vue-router'
import { storeOptions } from '@/store'
import JourneyModal from '@/views/DashboardView/StudentDashboard/JourneyModal.vue'
import { vi } from 'vitest'

describe('JourneyModal', () => {
  let router

  beforeEach(() => {
    vi.resetAllMocks()
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/journeys', component: { template: '<div>Journeys</div>' } },
      ],
    })
  })

  const getWrapper = (overrides = {}) => {
    const store = createStore({
      modules: {
        ...storeOptions.modules,
      },
    })

    return mount(JourneyModal, {
      global: { plugins: [store, router] },
      props: {
        closeModal: vi.fn(),
        ...overrides.props,
      },
    })
  }

  test('should close modal when handleClose is called', async () => {
    const wrapper = getWrapper()
    const closeModalSpy = vi.spyOn(wrapper.props(), 'closeModal')

    await wrapper.vm.handleClose()

    expect(closeModalSpy).toHaveBeenCalled()
  })

  test('should navigate to /journeys when handleStartJourney is called', async () => {
    const wrapper = getWrapper()
    const routerPushSpy = vi.spyOn(router, 'push')

    const seePlanButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('See my plan'))

    expect(seePlanButton).toBeTruthy()

    await seePlanButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(routerPushSpy).toHaveBeenCalledWith('/journeys')
  })
})
