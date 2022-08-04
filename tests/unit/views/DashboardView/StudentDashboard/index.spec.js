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
        user: {
          state: { user: { pastSessions: [] } },
        },
        getters: {
          isSessionAlive: () => true,
        },
      },
      featureFlags: {
        getters: {
          isReferFriendsActive: () => false,
          isDowntimeBannerActive: () => false,
          isSummerPrepActive: () => false,
        },
      },
    },
  })

  return shallowMount(StudentDashboard, { localVue, store })
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
