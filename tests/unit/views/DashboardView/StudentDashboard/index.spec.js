import DashboardBanner from '@/views/DashboardView/DashboardBanner'
import StudentDashboard from '@/views/DashboardView/StudentDashboard'
import SubjectSelection from '@/views/DashboardView/StudentDashboard/SubjectSelection'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

const getWrapper = () => {
  const store = new Vuex.Store({
    modules: {
      user: {
        user: { state: { user: { pastSessions: [] } } },
      },
      productFlags: {
        flags: { state: { flags: { fallIncentiveProgram: false } } },
      },
      featureFlags: {
        flags: { state: { flags: {} } },
      },
    },
  })

  return shallowMount(StudentDashboard, { localVue, store })
}

describe('StudentDashboard', () => {
  test('layout', () => {
    const wrapper = getWrapper()
    expect(wrapper.classes('student-dashboard')).toBe(true)

    const banner = wrapper.find(DashboardBanner)
    expect(banner.exists()).toBe(true)

    const selection = wrapper.find(SubjectSelection)
    expect(selection.exists()).toBe(true)
  })
})
