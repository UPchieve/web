import { storeOptions } from '@/store'
import router from '@/router'
import { createStore } from 'vuex'
import { mount, VueWrapper } from '@vue/test-utils'
import ListSessions from '@/views/DashboardView/VolunteerDashboard/ListSessions/ListSessions.vue'
import { dayjs } from '@/utils/time-utils'
import { it, describe, vi, expect, beforeEach } from 'vitest'
import { merge } from 'lodash-es'
import { nextTick } from 'vue'

vi.mock('@/services/PresenceService')

let wrapper: VueWrapper

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  if (wrapper) {
    wrapper?.unmount()
  }
})

const USER_ID = '123'
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
    createdAt: dayjs().subtract(5, 'minutes'),
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
    createdAt: dayjs().subtract(3, 'minutes'),
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
    createdAt: dayjs().subtract(2, 'minutes'),
  },
]
const getWrapper = async (overrides = {}) => {
  const store = createStore(
    merge({}, storeOptions, {
      modules: {
        app: {
          getters: {
            mobileMode: () => false,
          },
        },
        user: {
          state: {
            user: {
              id: USER_ID,
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
            ...(overrides.user?.getters ?? {}),
          },
        },
        volunteer: {
          getters: {
            isReadyToTutor: () => true,
          },
        },
        subjects: {
          getters: {
            isComputedUnlockSubject: () => () => false,
            ...(overrides.subjects?.getters ?? {}),
          },
        },
      },
    })
  )
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

  return mount(ListSessions, {
    attachTo: window.document.body,
    global: {
      plugins: [router, store],
    },
    propsData: {
      showLockedSessions: false,
      ...(overrides.props ?? {}),
    },
  })
}

/**
 * Get table rows that are specifically listing sessions (not header or footer rows)
 */
function getSessionRows(wrapper: VueWrapper) {
  return wrapper.findAll('[data-testid^="session-row-"]')
}

describe('Dashboard with Muted Subjects', () => {
  const mutedSubjectAlerts = ['algebraOne']
  it('Should only show unmuted subject sessions', async () => {
    wrapper = await getWrapper({
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
      wrapper = await getWrapper({
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
  it('Should show the Become an Ambassador CTA when there are no students waiting', async () => {
    wrapper = await getWrapper({
      user: {
        getters: {
          isVolunteer: () => true,
          isAmbassador: () => false,
        },
      },
      sessions: [],
    })
    expect(
      wrapper.find('[data-testid="no-students-waiting-message"]').exists()
    ).toBeTruthy()
    expect(
      wrapper.find('[data-testid="no-students-ambassador-message"]').exists()
    ).toBeTruthy()
  })

  it.each([
    { isVolunteer: true, isAmbassador: true },
    { isVolunteer: false, isAmbassador: false },
  ])(
    'Should not show the Become an Ambassador CTA for %o',
    async ({ isVolunteer, isAmbassador }) => {
      wrapper = await getWrapper({
        user: {
          getters: {
            isVolunteer: () => isVolunteer,
            isAmbassador: () => isAmbassador,
          },
        },
        sessions: [],
      })
      expect(
        wrapper.find('[data-testid="no-students-waiting-message"]').exists()
      ).toBeTruthy()
      expect(
        wrapper.find('[data-testid="no-students-ambassador-message"]').exists()
      ).toBeFalsy()
    }
  )
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
      createdAt: dayjs().subtract(5, 'minutes').toDate(),
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
      createdAt: dayjs().subtract(3, 'minutes').toDate(),
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
      createdAt: dayjs().subtract(9, 'minutes').toDate(),
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
      createdAt: dayjs().subtract(10, 'minutes').toDate(),
    },
  ]

  it('Should show locked sessions at the bottom of the list', async () => {
    wrapper = await getWrapper({
      props: {
        showLockedSessions: true,
      },
      user: {
        state: {
          user: {
            mutedSubjectAlerts: [],
            subjects: ['prealgebra', 'algebraOne'],
          },
        },
      },
      sessions: testSessions,
    })

    const tableRows = getSessionRows(wrapper)
    expect(tableRows.length).toEqual(4)
    // They are also ordered correctly: Available sessions at the top, ordered by wait time,
    // and locked sessions at the bottom, ordered by wait time.

    // First session should be prealgebra, with a wait time of 5 minutes
    const session1WaitTime = tableRows[0].find(
      '[data-testid="wait-time-session-1"]'
    )
    const session1Subject = tableRows[0].find(
      '[data-testid="subject-session-1"]'
    )
    expect(session1WaitTime.text()).toEqual('5:00')
    expect(session1Subject.text()).toEqual('Prealgebra')

    // Second session should be algebra one, with a wait time of 3 minutes
    const session2WaitTime = tableRows[1].find(
      '[data-testid="wait-time-session-2"]'
    )
    const session2Subject = tableRows[1].find(
      '[data-testid="subject-session-2"]'
    )
    expect(session2WaitTime.text()).toEqual('3:00')
    expect(session2Subject.text()).toEqual('Algebra 1')

    // Third session is session-4, Biology, locked, with a wait time of 10 minutes
    const session3WaitTime = tableRows[2].find(
      '[data-testid="wait-time-session-4"]'
    )
    const session3Subject = tableRows[2].find(
      '[data-testid="subject-session-4"]'
    )
    expect(session3WaitTime.text()).toEqual('10:00')
    expect(session3Subject.text()).toEqual('🔒Biology')

    // Fourth session is session-3, Calculus BC, locked, with a wait time of 9 minutes
    const session4WaitTime = tableRows[3].find(
      '[data-testid="wait-time-session-3"]'
    )
    const session4Subject = tableRows[3].find(
      '[data-testid="subject-session-3"]'
    )
    expect(session4WaitTime.text()).toEqual('9:00')
    expect(session4Subject.text()).toEqual('🔒Calculus BC')
  })

  it('Hides locked sessions when the props.showLockedSessions is false', async () => {
    wrapper = await getWrapper({
      props: {
        showLockedSessions: false,
      },
      user: {
        state: {
          user: {
            mutedSubjectAlerts: [],
            subjects: ['prealgebra', 'algebraOne'],
          },
        },
      },
      sessions: testSessions, // 4 sessions open, but user should only see 2
    })
    const tableRows = getSessionRows(wrapper)
    expect(tableRows.length).toEqual(2)
  })

  it('Keeps a locked session in the list for 1 minute after it is picked up', async () => {
    wrapper = await getWrapper({
      props: { showLockedSessions: true },
      user: {
        state: {
          user: {
            mutedSubjectAlerts: [],
            subjects: ['prealgebra', 'algebraOne'],
          },
        },
      },
      sessions: testSessions,
    })
    const store = (wrapper.vm as any).$store
    const context = {
      $router: { currentRoute: { value: { path: '/dashboard' } } },
    }
    const rowIds = () =>
      getSessionRows(wrapper).map((row) => row.attributes('id'))
    expect(rowIds()).toContain('session-4')

    vi.useFakeTimers()
    try {
      // Another coach picks up the locked biology session (session-4)
      await store.dispatch('volunteer/handleIncomingSessions', {
        context,
        sessions: testSessions.filter((s) => s.id !== 'session-4'),
      })
      await nextTick()
      expect(rowIds()).toContain('session-4')
      // Locked sessions just linger; they don't get the "Claimed!" badge
      expect(
        wrapper.find('[data-testid="claimed-badge-session-4"]').exists()
      ).toBe(false)

      // A later update within the minute shouldn't reset or remove it early
      vi.advanceTimersByTime(30 * 1000)
      await store.dispatch('volunteer/handleIncomingSessions', {
        context,
        sessions: testSessions.filter((s) => s.id !== 'session-4'),
      })
      await nextTick()
      expect(rowIds()).toContain('session-4')

      vi.advanceTimersByTime(30 * 1000)
      await nextTick()
      expect(rowIds()).not.toContain('session-4')
    } finally {
      vi.useRealTimers()
    }
  })

  it('Clicking a locked session should take you to the subject quiz', async () => {
    const routerPushSpy = vi.spyOn(router, 'push')
    const getTestWrapper = () =>
      getWrapper({
        props: {
          showLockedSessions: true,
        },
        user: {
          state: {
            user: {
              mutedSubjectAlerts: [],
              subjects: ['prealgebra', 'algebraOne'],
            },
          },
        },
        sessions: testSessions,
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

  it('Clicking on an integrated math session should take you to the Training page', async () => {
    const routerPushSpy = vi.spyOn(router, 'push')
    wrapper = await getWrapper({
      props: {
        showLockedSessions: true,
      },
      user: {
        state: {
          user: {
            subjects: ['prealgebra'],
          },
        },
      },
      sessions: [
        {
          id: 'session-1',
          student: {
            firstname: 'Student1',
            isTestUser: false,
          },
          studentFirstName: 'Student1',
          subTopic: 'integratedMathOne',
          subjectDisplayName: 'Integrated Math One',
          type: 'math',
          createdAt: dayjs().subtract(5, 'minutes').toDate(),
        },
      ],
      subjects: {
        getters: {
          isComputedUnlockSubject: () => () => true,
        },
      },
    })
    const integratedMathRow = wrapper.find(
      '[data-testid="session-row-session-1"]'
    )
    await integratedMathRow.trigger('click')
    expect(routerPushSpy).toHaveBeenNthCalledWith(
      1,
      '/training?openTo=integratedMathOne'
    )
  })
})

describe('Pagination', () => {
  // Let there be 11 sessions staggered a minute apart
  const testSessions = Array.from({ length: 11 }, (_, i) => ({
    id: `session-${i + 1}`,
    student: {
      firstname: `Student${i + 1}`,
      isTestUser: false,
    },
    studentFirstName: `Student${i + 1}`,
    subTopic: 'algebraOne',
    subjectDisplayName: 'Algebra 1',
    type: 'math',
    createdAt: dayjs()
      .subtract(11 - i, 'minutes')
      .toDate(),
  }))

  it('Displays the correct page information', async () => {
    wrapper = await getWrapper({ sessions: testSessions })
    const pageSizeSelect = wrapper.findComponent(
      '[data-testid="page-size-select"]'
    ) // set page size to 5
    pageSizeSelect.vm.$emit('update:modelValue', 5)
    await nextTick()

    const range = () =>
      wrapper.find('[data-testid="page-controls-range"]').text()
    const prevButton = () => wrapper.find('[data-testid="prev-page"]')
    const nextButton = () => wrapper.find('[data-testid="next-page"]')

    // First page
    expect(range()).toEqual('1–5 of 11')
    expect(prevButton().attributes('disabled')).toBeDefined() // cannot navigate to a previous page
    expect(nextButton().attributes('disabled')).toBeUndefined()

    // Second page
    await nextButton().trigger('click')
    expect(range()).toEqual('6–10 of 11')
    expect(prevButton().attributes('disabled')).toBeUndefined()
    expect(nextButton().attributes('disabled')).toBeUndefined()

    // Third page
    await nextButton().trigger('click')
    expect(range()).toEqual('11–11 of 11')
    expect(prevButton().attributes('disabled')).toBeUndefined()
    expect(nextButton().attributes('disabled')).toBeDefined() // cannot navigate to a next page
  })

  it('Goes back to the first page when a new exclusive session comes in', async () => {
    wrapper = await getWrapper({ sessions: testSessions })
    const pageSizeSelect = wrapper.findComponent(
      '[data-testid="page-size-select"]'
    )
    pageSizeSelect.vm.$emit('update:modelValue', 5)
    await nextTick()
    await wrapper.find('[data-testid="next-page"]').trigger('click')
    const range = () =>
      wrapper.find('[data-testid="page-controls-range"]').text()
    expect(range()).toEqual('6–10 of 11') // on page 2

    const exclusiveSession = {
      ...testSessions[0],
      id: 'exclusive-1',
      isExclusive: true,
      requestedVolunteerId: USER_ID,
      createdAt: new Date(),
    }
    await (wrapper.vm as any).$store.dispatch(
      'volunteer/handleIncomingSessions',
      {
        context: {
          $router: { currentRoute: { value: { path: '/dashboard' } } },
        },
        sessions: [...testSessions, exclusiveSession],
      }
    )
    await nextTick()

    expect(range()).toEqual('1–5 of 12') // back on page 1
    expect(getSessionRows(wrapper)[0].attributes('id')).toEqual('exclusive-1')
  })
})

describe('Claimed sessions', () => {
  const testSessions = Array.from({ length: 3 }, (_, i) => ({
    id: `session-${i + 1}`,
    student: {
      firstname: `Student${i + 1}`,
      isTestUser: false,
    },
    studentFirstName: `Student${i + 1}`,
    subTopic: 'algebraOne',
    subjectDisplayName: 'Algebra 1',
    type: 'math',
    createdAt: dayjs()
      .subtract(3 - i, 'minutes')
      .toDate(),
  }))
  const context = {
    $router: { currentRoute: { value: { path: '/dashboard' } } },
  }
  const rowIds = () =>
    getSessionRows(wrapper).map((row) => row.attributes('id'))

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Shows a "Claimed!" badge in place of a session that was picked up, then removes it', async () => {
    wrapper = await getWrapper({ sessions: testSessions })
    const store = (wrapper.vm as any).$store
    const routerPushSpy = vi.spyOn(router, 'push')
    vi.useFakeTimers()

    // Another coach picks up the middle session
    await store.dispatch('volunteer/handleIncomingSessions', {
      context,
      sessions: testSessions.filter((s) => s.id !== 'session-2'),
    })
    await nextTick()

    // It keeps its place in the list, with a badge instead of a wait time
    expect(rowIds()).toEqual(['session-1', 'session-2', 'session-3'])
    expect(
      wrapper.find('[data-testid="claimed-badge-session-2"]').text()
    ).toContain('Claimed!')
    expect(wrapper.find('[data-testid="wait-time-session-2"]').exists()).toBe(
      false
    )

    // Clicking it does nothing, since the session is gone
    await wrapper.find('[data-testid="session-row-session-2"]').trigger('click')
    expect(routerPushSpy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(rowIds()).toEqual(['session-1', 'session-3'])
  })
})
