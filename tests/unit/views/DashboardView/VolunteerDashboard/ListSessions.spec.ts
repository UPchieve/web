import { storeOptions } from '@/store'
import router from '@/router'
import { createStore } from 'vuex'
import { shallowMount } from '@vue/test-utils'
import ListSessions from '@/views/DashboardView/VolunteerDashboard/ListSessions.vue'
import moment from 'moment'
import { it, describe, vi, expect, beforeEach } from 'vitest'

vi.mock('@/services/PresenceService')

beforeEach(() => {
  vi.restoreAllMocks()
})

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
    createdAt: moment().subtract(5, 'minutes'),
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
    createdAt: moment().subtract(3, 'minutes'),
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
    createdAt: moment().subtract(2, 'minutes'),
  },
]

const getWrapper = async (overrides = {}) => {
  const store = createStore({
    modules: {
      ...storeOptions.modules,
      user: {
        ...storeOptions.modules.user,
        state: {
          user: {
            ...storeOptions.modules.user.state.user,
            userType: 'volunteer',
            subjects: ['algebraOne', 'algebraTwo', 'biology'],
            mutedSubjectAlerts: [],
            isApproved: true,
            isOnboarded: true,
            isBanned: false,
            ...(overrides.user?.state?.user ?? {}),
          },
        },
        getters: {
          ...storeOptions.modules.user.getters,
          ...(overrides.user?.getters ?? {}),
        },
      },
      volunteer: {
        ...storeOptions.modules.volunteer,
        getters: {
          ...storeOptions.modules.volunteer.getters,
          isReadyToTutor: () => true,
        },
      },
      featureFlags: {
        ...storeOptions.modules.featureFlags,
        getters: {
          ...(overrides.featureFlags?.getters ?? {}),
        },
      },
      subjects: {
        ...storeOptions.modules.subjects,
        getters: {
          isComputedUnlockSubject: () => () => false,
        },
      },
    },
  })
  const mockVueContext = {
    $router: {
      currentRoute: {
        value: {
          path: '/dashboard',
        },
      },
      query: {},
    },
  }
  await store.dispatch('volunteer/handleIncomingSessions', {
    context: mockVueContext,
    sessions: overrides.sessions ?? sessions,
  })
  return shallowMount(ListSessions, {
    propsData: {
      showLockedSessions: false,
      ...(overrides.props ?? {}),
    },
    global: { plugins: [store, router] },
  })
}

describe('Dashboard with Muted Subjects', () => {
  const mutedSubjectAlerts = ['algebraOne']
  it('Should only show unmuted subject sessions', async () => {
    const wrapper = await getWrapper({
      user: {
        state: {
          user: {
            mutedSubjectAlerts,
          },
        },
      },
    })

    const sessionRowMuted = wrapper.find(
      '[data-testid="session-row-session-1"]'
    )
    const sessionRowUnmuted = wrapper.find(
      '[data-testid="session-row-session-2"]'
    )
    expect(sessionRowUnmuted.exists()).toBe(true)
    expect(sessionRowMuted.exists()).toBe(false)
  })
})

describe('Dashboard with banned students', () => {
  it.each([true, false])(
    'Should only show shadow banned students to admin users',
    async (isAdmin) => {
      const wrapper = await getWrapper({
        user: {
          state: {
            user: {
              isAdmin,
            },
          },
        },
      })

      const bannedStudentSession = wrapper.find(
        '[data-testid="session-row-session-3"]'
      )
      expect(bannedStudentSession.exists()).toBe(isAdmin)
    }
  )
})

describe('Empty state', () => {
  it('Should show a special message when there are no students waiting', async () => {
    const wrapper = await getWrapper({
      sessions: [],
      featureFlags: {
        getters: {
          isBecomeAnAmbassadorCtaEnabled: () => false,
        },
      },
    })
    expect(
      wrapper.find('[data-testid="no-students-waiting-message"]').exists()
    ).toBeTruthy()
    expect(
      wrapper.find('[data-testid="no-students-ambassador-message"]').exists()
    ).toBeFalsy()
  })

  it('Should show the Become an Ambassador CTA', async () => {
    const wrapper = await getWrapper({
      user: {
        getters: {
          isVolunteer: () => true,
          isAmbassador: () => false,
        },
      },
      sessions: [],
      featureFlags: {
        getters: {
          isBecomeAnAmbassadorCtaEnabled: () => true,
        },
      },
    })
    expect(
      wrapper.find('[data-testid="no-students-waiting-message"]').exists()
    ).toBeTruthy()
    expect(
      wrapper.find('[data-testid="no-students-ambassador-message"]').exists()
    ).toBeTruthy()
  })
})

describe('Locked sessions', () => {
  const testSessions = [
    {
      id: 'session-1',
      student: {
        firstname: 'Student1',
        isTestUser: false,
      },
      studentFirstName: 'Student1',
      subTopic: 'prealgebra',
      subjectDisplayName: 'Prealgebra',
      type: 'math',
      createdAt: moment().subtract(5, 'minutes').toDate(),
    },
    {
      id: 'session-2',
      student: {
        firstname: 'Student2',
        isTestUser: false,
      },
      studentFirstName: 'Student2',
      subTopic: 'algebraOne',
      subjectDisplayName: 'Algebra 1',
      type: 'math',
      createdAt: moment().subtract(3, 'minutes').toDate(),
    },
    {
      id: 'session-3',
      student: {
        firstname: 'Student3',
        isTestUser: false,
      },
      studentFirstName: 'Student3',
      subTopic: 'calculusBc',
      subjectDisplayName: 'Calculus BC',
      type: 'math',
      createdAt: moment().subtract(9, 'minutes').toDate(),
    },
    {
      id: 'session-4',
      student: {
        firstname: 'Student4',
        isTestUser: false,
      },
      studentFirstName: 'Student4',
      subTopic: 'biology',
      subjectDisplayName: 'Biology',
      type: 'math',
      createdAt: moment().subtract(10, 'minutes').toDate(),
    },
  ]

  it('Should show locked sessions at the bottom of the list', async () => {
    const wrapper = await getWrapper({
      user: {
        state: {
          user: {
            mutedSubjectAlerts: [],
            subjects: ['prealgebra', 'algebraOne'],
          },
        },
      },
      sessions: testSessions,
      featureFlags: {
        getters: {
          isShowLockedSessionsEnabled: () => true,
        },
      },
      props: { showLockedSessions: true },
    })

    const tableRows = wrapper.findAll('tr')
    expect(tableRows.length).toEqual(5) // 1 header row and 4 sessions
    // They are also ordered correctly: Available sessions at the top, ordered by wait time,
    // and locked sessions at the bottom, ordered by wait time.

    // First session should be prealgebra, with a wait time of 5 minutes
    const session1WaitTime = tableRows[1].find(
      '[data-testid="wait-time-session-1"]'
    )
    const session1Subject = tableRows[1].find(
      '[data-testid="subject-session-1"]'
    )
    expect(session1WaitTime.text()).toEqual('5 mins')
    expect(session1Subject.text()).toEqual('Prealgebra')

    // Second session should be algebra one, with a wait time of 3 minutes
    const session2WaitTime = tableRows[2].find(
      '[data-testid="wait-time-session-2"]'
    )
    const session2Subject = tableRows[2].find(
      '[data-testid="subject-session-2"]'
    )
    expect(session2WaitTime.text()).toEqual('3 mins')
    expect(session2Subject.text()).toEqual('Algebra 1')

    // Third session is session-4, Biology, locked, with a wait time of 10 minutes
    const session3WaitTime = tableRows[3].find(
      '[data-testid="wait-time-session-4"]'
    )
    const session3Subject = tableRows[3].find(
      '[data-testid="subject-session-4"]'
    )
    expect(session3WaitTime.text()).toEqual('10 mins')
    expect(session3Subject.text()).toEqual('🔒Biology')

    // Fourth session is session-3, Calculus BC, locked, with a wait time of 9 minutes
    const session4WaitTime = tableRows[4].find(
      '[data-testid="wait-time-session-3"]'
    )
    const session4Subject = tableRows[4].find(
      '[data-testid="subject-session-3"]'
    )
    expect(session4WaitTime.text()).toEqual('9 mins')
    expect(session4Subject.text()).toEqual('🔒Calculus BC')
  })

  it('Clicking a locked session should take you to the subject quiz', async () => {
    const routerPushSpy = vi.spyOn(router, 'push')
    const getTestWrapper = () =>
      getWrapper({
        user: {
          state: {
            user: {
              mutedSubjectAlerts: [],
              subjects: ['prealgebra', 'algebraOne'],
            },
          },
        },
        sessions: testSessions,
        featureFlags: {
          getters: {
            isShowLockedSessionsEnabled: () => true,
          },
        },
        props: { showLockedSessions: true },
      })
    const prealgebraSessionRow = (await getTestWrapper()).find(
      '[data-testid="session-row-session-1"]'
    )
    await prealgebraSessionRow.trigger('click')
    expect(routerPushSpy).toHaveBeenNthCalledWith(
      1,
      '/session/math/prealgebra/session-1'
    )

    const lockedCalculusSessionRow = (await getTestWrapper()).find(
      '[data-testid="session-row-session-3"]'
    )
    await lockedCalculusSessionRow.trigger('click')
    expect(routerPushSpy).toHaveBeenNthCalledWith(
      2,
      '/training/calculus-bc/quiz'
    )

    const lockedBiologySessionRow = (await getTestWrapper()).find(
      '[data-testid="session-row-session-4"]'
    )
    await lockedBiologySessionRow.trigger('click')
    expect(routerPushSpy).toHaveBeenNthCalledWith(3, '/training/biology/quiz')
  })
})
