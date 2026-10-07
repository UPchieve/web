import { describe, expect, test, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createStore } from 'vuex'

import AnalyticsService from '@/services/AnalyticsService'
import NetworkService from '@/services/NetworkService'
import JoinClassModal from '@/views/JoinClassModal.vue'

describe('JoinClassModal', () => {
  test('opens the class the student just joined', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:path(.*)*', component: { template: '<div />' } }],
    })
    await router.push('/classes/class-they-were-on')
    let urlAtReload: string | undefined
    vi.spyOn(router, 'go').mockImplementation(() => {
      urlAtReload = router.currentRoute.value.fullPath
    })
    vi.spyOn(AnalyticsService, 'captureEvent').mockImplementation(() => {})
    NetworkService.addStudentToClass = vi
      .fn()
      .mockResolvedValue({ data: { teacherClass: { id: 'joined-class' } } })
    const wrapper = mount(JoinClassModal, {
      props: { closeModal: () => {} },
      global: {
        plugins: [
          router,
          createStore({
            modules: {
              user: {
                namespaced: true,
                state: {
                  user: { email: 'sam@example.com', gradeLevel: '9th' },
                },
              },
            },
          }),
        ],
      },
    })

    await wrapper.get('input').setValue('ABC123')
    await wrapper.get('[data-testid="button-submit"]').trigger('click')
    await flushPromises()

    expect(urlAtReload).toBe('/classes/joined-class')
  })
})
