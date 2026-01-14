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
            },
          },
        },
        featureFlags: {
          ...storeOptions.modules.featureFlags,
          getters: {
            ...storeOptions.modules.featureFlags.getters,
            isGuidedJourneysEnabled: () => false,
            ...(overrides.featureFlags?.getters ?? {}),
          },
        },
      },
    })
  )

  return shallowMount(StudentDashboard, { global: { plugins: [store] } })
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

  test('shows journey modal when guided journey flag is enabled and not seen before', async () => {
    const wrapper = getWrapper({
      featureFlags: {
        getters: {
          isGuidedJourneysEnabled: () => true,
        },
      },
    })

    await wrapper.vm.$nextTick()

    const journeyModal = wrapper.findComponent(JourneyModal)
    expect(journeyModal.exists()).toBe(true)
  })

  test('does not show journey modal when already seen', async () => {
    localStorage.setItem('seenJourneyModal', 'true')

    const wrapper = getWrapper({
      featureFlags: {
        getters: {
          isGuidedJourneysEnabled: () => true,
        },
      },
    })

    await wrapper.vm.$nextTick()

    const journeyModal = wrapper.findComponent(JourneyModal)
    expect(journeyModal.exists()).toBe(false)
  })

  test('does not show journey modal when guided journeys disabled', async () => {
    const wrapper = getWrapper()

    await wrapper.vm.$nextTick()

    const journeyModal = wrapper.findComponent(JourneyModal)

    expect(journeyModal.exists()).toBe(false)
  })
})
