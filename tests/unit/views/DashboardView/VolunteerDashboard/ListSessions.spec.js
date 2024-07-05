import userModule from '@/store/modules/user'
import volunteerModule from '@/store/modules/volunteer'
import featureFlagsModule from '@/store/modules/feature-flags'
import subjectsModule from '@/store/modules/subjects'
import notificationsModule from '@/store/modules/notifications'
import { createStore } from 'vuex'
import { shallowMount } from '@vue/test-utils'
import ListSessions from '@/views/DashboardView/VolunteerDashboard/ListSessions.vue'

const sessions = [
  {
    id: 'session-1',
    student: {
      firstname: 'Student1',
      isTestUser: false,
    },
    studentFirstName: 'Student1',
    subTopic: 'algebraOne',
    subjectDisplayName: 'Algebra 1',
    type: 'math',
  },
  {
    id: 'session-2',
    student: {
      firstname: 'Student2',
      isTestUser: false,
    },
    studentFirstName: 'Student2',
    subTopic: 'algebraTwo',
    subjectDisplayName: 'Algebra 2',
    type: 'math',
  },
  {
    id: 'session-3',
    student: {
      firstname: 'Student3',
      isTestUser: false,
      isShadowBanned: true,
    },
    studentFirstName: 'Student3',
    subTopic: 'algebraTwo',
    subjectDisplayName: 'Algebra 2',
    type: 'math',
  },
]

const getWrapper = async (overrides = {}) => {
  const store = createStore({
    modules: {
      user: {
        state: {
          user: {
            ...userModule.state,
            userType: 'volunteer',
            subjects: ['algebraOne', 'algebraTwo', 'biology'],
            activeSubjects: ['algebraOne', 'algebraTwo', 'biology'],
            mutedSubjectAlerts: ['algebraOne'],
            isApproved: true,
            isOnboarded: true,
            isBanned: false,
            ...(overrides.user ?? {}),
          },
        },
        getters: {
          ...userModule.getters,
        },
      },
      volunteer: {
        ...volunteerModule,
        state: {
          ...volunteerModule.state,
        },
        mutations: {
          ...volunteerModule.mutations,
        },
        getters: {
          isReadyToTutor: () => true,
        },
      },
      featureFlags: {
        ...featureFlagsModule,
        getters: {
          isMutedSubjectAlertsActive: () => true,
        },
      },
      notifications: {
        state: {
          ...notificationsModule.state,
        },
      },
      subjects: {
        state: {
          ...subjectsModule,
          subjects: ['algebraOne', 'algebraTwo', 'biology'],
        },
      },
    },
  })
  const mockVueContext = {
    router: {
        currentRoute: {
          value: {
            path: '/dashboard',
          },
        },
    },
  }
  store.dispatch('volunteer/handleIncomingSessions', {
    context: mockVueContext,
    sessions,
  })
  return shallowMount(ListSessions, { global: { plugins: [store] }})
}

describe('Dashboard with Muted Subjects', () => {
  it('Should only show unmuted subject sessions', async () => {
    const wrapper = await getWrapper()

    const sessionRowMuted = wrapper.find('[data-testid="session-row-Student1"]')
    const sessionRowUnmuted = wrapper.find(
      '[data-testid="session-row-Student2"]'
    )
    expect(sessionRowUnmuted.exists()).toBe(true)
    expect(sessionRowMuted.exists()).toBe(false)
  })
})

describe('Dashboard with banned students', () => {
  test.each([true, false])('Should only show shadow banned students to admin users', async (isAdmin) => {
    const wrapper = await getWrapper({
      user: {
        isAdmin
      }
    })

    const bannedStudentSession = wrapper.find('[data-testid="session-row-Student3"]')
    expect(bannedStudentSession.exists()).toBe(isAdmin)
  })
})