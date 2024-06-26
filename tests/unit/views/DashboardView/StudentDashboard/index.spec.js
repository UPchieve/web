import DashboardBanner from '@/views/DashboardView/DashboardBanner.vue'
import StudentDashboard from '@/views/DashboardView/StudentDashboard/index.vue'
import SubjectSelection from '@/views/DashboardView/StudentDashboard/SubjectSelection/index.vue'
import { shallowMount } from '@vue/test-utils'
import { storeOptions } from '@/store'
import { merge } from 'lodash-es'
import { createStore } from 'vuex'

const getWrapper = () => {
  const store = createStore(
    merge({}, storeOptions, {
      modules: {
        user: {
          user: { state: { user: { pastSessions: [] } } },
        },
        featureFlags: {
          flags: { state: { flags: {} } },
        },
      },
    })
  )

  return shallowMount(StudentDashboard, { global: { plugins: [store] } })
}

describe('StudentDashboard', () => {
  test('layout', () => {
    const wrapper = getWrapper()
    expect(wrapper.classes('student-dashboard')).toBe(true)

    const banner = wrapper.findComponent(DashboardBanner)
    expect(banner.exists()).toBe(true)

    const selection = wrapper.findComponent(SubjectSelection)
    expect(selection.exists()).toBe(true)
  })
})
