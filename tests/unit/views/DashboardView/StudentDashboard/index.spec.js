import DashboardBanner from '@/views/DashboardView/DashboardBanner.vue'
import StudentDashboard from '@/views/DashboardView/StudentDashboard/index.vue'
import SubjectSelection from '@/views/DashboardView/StudentDashboard/SubjectSelection/index.vue'
import { shallowMount } from '@vue/test-utils'
import { storeOptions } from '@/store'
import { merge } from 'lodash-es'
import { createStore } from 'vuex'
import { nextTick } from 'vue'
import { useAppModalStore } from '@/stores/app/modal'
import { POSTHOG_FEATURE_FLAGS } from '@/consts'

const getWrapper = (overrides = {}) => {
  const store = createStore(
    merge({}, storeOptions, {
      modules: {
        user: {
          state: {
            ...overrides.user?.state,
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
          state: merge(
            {},
            storeOptions.modules.featureFlags.state,
            overrides.featureFlags?.state
          ),
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
    useAppModalStore().hide()
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

  test('shows the college session modal after a new student dismisses onboarding', async () => {
    const wrapper = getWrapper({
      user: {
        state: {
          isFirstDashboardVisit: true,
          user: { pastSessions: [] },
        },
      },
      featureFlags: {
        state: {
          toggleFlags: {
            [POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION]: true,
          },
          payloadFlags: {
            [POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION]: 'collegePrep',
          },
        },
      },
    })

    await wrapper.vm.$store.dispatch('user/firstDashboardVisit', false)
    await nextTick()

    const modalStore = useAppModalStore()
    expect(modalStore.component).toBe('StartCollegeSessionModal')
    expect(modalStore.modalTemplateProps).toEqual({
      showTemplateButtons: false,
      sessionTopic: 'collegePrep',
    })
  })

  test('does not show the college session modal to a returning student', async () => {
    const wrapper = getWrapper({
      user: {
        state: {
          isFirstDashboardVisit: true,
          user: { pastSessions: [{ id: 'past-session' }] },
        },
      },
      featureFlags: {
        state: {
          toggleFlags: {
            [POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION]: true,
          },
          payloadFlags: {
            [POSTHOG_FEATURE_FLAGS.AUTO_START_COLLEGE_SESSION]: 'collegePrep',
          },
        },
      },
    })

    await wrapper.vm.$store.dispatch('user/firstDashboardVisit', false)
    await nextTick()

    expect(useAppModalStore().component).toBeNull()
  })

  test('does not show the secondary email modal before the first session', () => {
    const wrapper = getWrapper({
      user: {
        state: {
          isFirstDashboardVisit: true,
          user: {
            email: 'student@school.edu',
            pastSessions: [],
            proxyEmail: null,
          },
        },
      },
      featureFlags: {
        state: {
          toggleFlags: {
            [POSTHOG_FEATURE_FLAGS.SECONDARY_EMAIL_ON_PROFILE_PAGE]: true,
          },
        },
      },
    })

    expect(wrapper.vm.showSecondaryEmailModal).toBe(false)
  })

  test('shows the secondary email modal after the first session', () => {
    const wrapper = getWrapper({
      user: {
        state: {
          hadASession: true,
          user: {
            email: 'student@school.edu',
            pastSessions: [{ id: 'first-session' }],
            proxyEmail: null,
          },
        },
      },
      featureFlags: {
        state: {
          toggleFlags: {
            [POSTHOG_FEATURE_FLAGS.SECONDARY_EMAIL_ON_PROFILE_PAGE]: true,
          },
        },
      },
    })

    expect(wrapper.vm.showSecondaryEmailModal).toBe(true)
  })
})
