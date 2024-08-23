import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import userModule from '@/store/modules/user'
import featureFlagModule from '@/store/modules/feature-flags'
import DashboardView from '@/views/DashboardView/index.vue'
import VolunteerDashboard from '@/views/DashboardView/VolunteerDashboard/index.vue'
import StudentDashboard from '@/views/DashboardView/StudentDashboard/index.vue'
import TeacherDashboard from '@/views/DashboardView/VolunteerDashboard/index.vue'

const getWrapper = (isAuthenticated = true, userType = 'student') => {
  const store = createStore({
    modules: {
      user: {
        ...userModule,
        getters: {
          isAuthenticated: () => isAuthenticated,
          userType: () => userType,
        },
      },
      featureFlags: {
        ...featureFlagModule,
      },
    },
  })

  return shallowMount(DashboardView, { global: { plugins: [store] } })
}

describe('DashboardView', () => {
  it('renders StudentDashboard', () => {
    const wrapper = getWrapper(true, 'student')
    expect(wrapper.findComponent(StudentDashboard))
  })

  it('renders VolunteerDashboard', () => {
    const wrapper = getWrapper(true, 'volunteer')
    expect(wrapper.findComponent(VolunteerDashboard))
  })

  it('renders TeacherDashboard', () => {
    const wrapper = getWrapper(true, 'teacher')
    expect(wrapper.findComponent(TeacherDashboard))
  })
})
