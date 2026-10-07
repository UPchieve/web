import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import router from '@/router'
import { storeOptions } from '@/store'
import NTHSApplicationView from '@/views/NTHS/NTHSApplicationView.vue'

vi.mock('@/services/AnalyticsService')

describe('NTHSApplicationView', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the deadline from the flag', () => {
    vi.useFakeTimers({ toFake: ['Date'] }).setSystemTime(
      new Date(2026, 9, 20, 12)
    )
    const store = createStore({
      modules: {
        ...storeOptions.modules,
        featureFlags: {
          ...storeOptions.modules.featureFlags,
          getters: { nthsApplicationsCloseAt: () => '2026-10-31' },
        },
      },
    })
    const wrapper = mount(NTHSApplicationView, {
      global: { plugins: [store, router] },
    })

    expect(
      wrapper.find('[data-testid="nths-application-deadline"]').text()
    ).toBe('Deadline to apply to start a chapter is Oct 31, 2026')
  })

  it('tells every coach NTHS is only for high school students', () => {
    const wrapper = mount(NTHSApplicationView, {
      global: { plugins: [createStore(storeOptions), router] },
    })

    expect(
      wrapper.find('[data-testid="nths-high-school-only"]').text()
    ).not.toBe('')
  })
})
