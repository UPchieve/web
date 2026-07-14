import DashboardBanner from '@/views/DashboardView/DashboardBanner.vue'
import StudentDashboard from '@/views/DashboardView/StudentDashboard/index.vue'
import SubjectSelection from '@/views/DashboardView/StudentDashboard/SubjectSelection/index.vue'
import JourneyModal from '@/views/DashboardView/StudentDashboard/JourneyModal.vue'
import { shallowMount } from '@vue/test-utils'
import { storeOptions } from '@/store'
import { merge } from 'lodash-es'
import { createStore } from 'vuex'

const getWrapper = (overrides = {}) => {
  const store = createStore(
    merge({}, storeOptions, {
      modules: {
        user: {
          state: {
            user: {
              pastSessions: [],
              studentAssignments: [],
              gradeLevel: '8th',
              ...(overrides.user?.state?.user ?? {}),
            },
          },
        },
        featureFlags: {
          ...storeOptions.modules.featureFlags,
        },
      },
    })
  )

  return shallowMount(StudentDashboard, {
    global: {
      plugins: [store],
    },
  })
}

describe('StudentDashboard', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  test('layout without assignments', () => {
    const wrapper = getWrapper()
    expect(wrapper.classes('student-dashboard')).toBe(true)

    const banner = wrapper.findComponent(DashboardBanner)
    expect(banner.exists()).toBe(true)

    const selection = wrapper.findComponent(SubjectSelection)
    expect(selection.exists()).toBe(true)
  })

  test('shows grade level card if student has no grade level and there are no assignments', () => {
    const wrapper = getWrapper({
      user: { state: { user: { gradeLevel: null } } },
    })
    expect(wrapper.classes('student-dashboard')).toBe(true)
    const gradeLevelComponent = wrapper.find(
      '[data-testid="grade-level-select"]'
    )
    expect(gradeLevelComponent.exists()).toBe(true)
  })

  test('shows journey modal when not seen before', async () => {
    const wrapper = getWrapper()

    await wrapper.vm.$nextTick()

    const journeyModal = wrapper.findComponent(JourneyModal)
    expect(journeyModal.exists()).toBe(true)
  })

  test('does not show journey modal when already seen', async () => {
    localStorage.setItem('seenJourneyModal', 'true')

    const wrapper = getWrapper()

    await wrapper.vm.$nextTick()

    const journeyModal = wrapper.findComponent(JourneyModal)
    expect(journeyModal.exists()).toBe(false)
  })
})
