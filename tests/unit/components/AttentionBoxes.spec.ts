import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { createPinia, setActivePinia } from 'pinia'
import AttentionBoxes from '@/components/AttentionBoxes.vue'
import { useNotificationsStore } from '@/stores/notifications'

vi.mock('@/services/AnalyticsService')

beforeEach(() => {
  setActivePinia(createPinia())
})

function mountBoxes() {
  const store = createStore({
    getters: { 'volunteer/availableSessions': () => [] },
  })
  return mount(AttentionBoxes, { global: { plugins: [store] } })
}

describe('AttentionBoxes', () => {
  it('does not dim the screen for regular notifications', () => {
    useNotificationsStore().add({ id: 1, title: 'Algebra 1' })

    expect(mountBoxes().find('.backdrop').exists()).toBe(false)
  })

  it('treats clicking outside a modal notification as the secondary CTA', async () => {
    const action = vi.fn()
    useNotificationsStore().add({ id: 1, title: 'Algebra 1' })
    useNotificationsStore().add(
      {
        id: 2,
        title: 'Trigonometry',
        modal: true,
        secondaryCta: { text: 'Pass', action },
      },
      true
    )
    const wrapper = mountBoxes()

    await wrapper.find('.backdrop').trigger('click')

    expect(action).toHaveBeenCalledTimes(1)
    expect(useNotificationsStore().notifications.map(({ id }) => id)).toEqual([
      1,
    ])
  })
})
