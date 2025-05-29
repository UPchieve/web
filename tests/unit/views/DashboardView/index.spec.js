import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import DashboardView from '@/views/DashboardView/index.vue'
import VolunteerDashboard from '@/views/DashboardView/VolunteerDashboard/index.vue'
import StudentDashboard from '@/views/DashboardView/StudentDashboard/index.vue'
import TeacherDashboard from '@/views/DashboardView/VolunteerDashboard/index.vue'

const getWrapper = (isAuthenticated = true, userType = 'student') => {
  const store = createStore({
    modules: {
      ...storeOptions.modules,
      user: {
        ...storeOptions.modules.user,
        getters: {
          isAuthenticated: () => isAuthenticated,
          userType: () => userType,
        },
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
