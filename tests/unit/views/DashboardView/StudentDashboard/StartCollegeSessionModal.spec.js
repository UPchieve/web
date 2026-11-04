import { shallowMount } from '@vue/test-utils'
import { vi } from 'vitest'
import StartCollegeSessionModal from '@/views/DashboardView/StudentDashboard/StartCollegeSessionModal.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS, POSTHOG_FEATURE_FLAGS } from '@/consts'

describe('StartCollegeSessionModal', () => {
  const push = vi.fn()
  const modalData = { sessionTopic: 'collegePrep' }
  const analyticsProperties = {
    topic: 'collegePrep',
    subject: 'college',
    featureFlag: POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION,
  }

  beforeEach(() => {
    vi.spyOn(AnalyticsService, 'captureEvent').mockImplementation(() => {})
    push.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function getWrapper() {
    return shallowMount(StartCollegeSessionModal, {
      props: { modalData },
      global: {
        mocks: { $router: { push } },
      },
    })
  }

  test('tracks an impression with the selected topic', () => {
    getWrapper()

    expect(AnalyticsService.captureEvent).toHaveBeenCalledWith(
      EVENTS.STUDENT_SHOWED_START_COLLEGE_SESSION,
      analyticsProperties
    )
  })

  test('tracks the click and routes directly to the college session', async () => {
    const wrapper = getWrapper()

    await wrapper.findComponent({ name: 'LargeButton' }).trigger('click')

    expect(AnalyticsService.captureEvent).toHaveBeenCalledWith(
      EVENTS.STUDENT_CLICKED_START_COLLEGE_SESSION,
      analyticsProperties
    )
    expect(push).toHaveBeenCalledWith('/session/college/collegePrep/')
  })
})
