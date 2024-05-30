import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import userModule from '@/store/modules/user'
import featureFlagModule from '@/store/modules/feature-flags'
import DashboardView from '@/views/DashboardView/index.vue'
import VolunteerDashboard from '@/views/DashboardView/VolunteerDashboard/index.vue'
import StudentDashboard from '@/views/DashboardView/StudentDashboard/index.vue'

const getWrapper = (isAuthenticated = true, isVolunteer = false) => {
  const store = createStore({
    modules: {
      user: {
        ...userModule,
        getters: {
          isAuthenticated: () => isAuthenticated,
          isVolunteer: () => isVolunteer,
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
    const wrapper = getWrapper(true, false)
    expect(wrapper.findComponent(StudentDashboard))
  })

  it('renders VolunteerDashboard', () => {
    const wrapper = getWrapper(true, true)
    expect(wrapper.findComponent(VolunteerDashboard))
  })
})
