import { beforeEach, describe, expect, test, vi } from 'vitest'
import { dayjs } from '@/utils/time-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { createMemoryHistory, createRouter } from 'vue-router'

import '@/store'
import userModule from '@/store/modules/user'
import subjectsModule from '@/store/modules/subjects'
import featureFlagsModule from '@/store/modules/feature-flags'
import NetworkService from '@/services/NetworkService'
import ClassDetailsView from '@/views/DashboardView/TeacherDashboard/ClassDetailsView.vue'

type Overrides = {
  data?: Record<string, any>
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/dashboard/teacher',
      name: 'TeacherDashboard',
      children: [
        {
          path: 'class/:classId',
          name: 'ClassDetailsView',
          component: ClassDetailsView,
          children: [
            {
              path: 'student/:studentId',
              name: 'StudentDetailsView',
              redirect: '',
            },
          ],
        },
        {
          path: 'class/:classId/assignments',
          name: 'ClassAssignmentsView',
          component: ClassDetailsView,
          children: [
            {
              path: ':assignmentId',
              name: 'AssignmentView',
              redirect: '',
            },
          ],
        },
      ],
    },
  ],
})

const getWrapper = async (overrides: Overrides = {}) => {
  const store = createStore({
    modules: {
      user: {
        ...userModule,
        getters: {
          isAuthenticated: () => true,
          userType: () => 'teacher',
        },
      },
      featureFlags: {
        ...featureFlagsModule,
      },
      subjects: {
        ...subjectsModule,
        state: {
          ...subjectsModule.state,
          subjects: {
            math: {
              id: 1,
              name: 'Math',
              topicName: 'Math',
              displayName: 'Math',
            },
          },
        },
      },
    },
  })
  const wrapper = mount(ClassDetailsView, {
    global: {
      plugins: [store, router],
    },
  })

  wrapper.setData({
    ...wrapper.vm.$data,
    isLoading: false,
    ...overrides.data,
  })

  return wrapper
}

describe('Class Details View', () => {
  beforeEach(async () => {
    NetworkService.getStudentsInTeacherClass = vi.fn().mockResolvedValue({
      data: {
        students: [
          {
            userId: 'userId1',
            id: 'userId1',
            firstName: 'Student',
            lastName: 'UPchieve',
            email: 'test1@upchieve.org',
          },
          {
            userId: 'userId2',
            id: 'userId2',
            firstName: 'Lis',
            lastName: 'Test',
            email: 'test2@upchieve.org',
          },
        ],
      },
    })

    NetworkService.getStudentSessionDetails = vi.fn().mockResolvedValue({
      data: {
        sessionDetails: [
          {
            id: 'session-1',
            name: 'algebraOne',
            endedAt: '2024-07-23T15:52:16.373Z',
            createdAt: '2024-07-23T15:48:18.088Z',
            firstName: 'Student',
            messageCount: '4',
          },
          {
            id: 'session-2',
            name: 'algebraOne',
            endedAt: '2024-07-26T20:43:31.067Z',
            createdAt: '2024-07-26T20:26:33.060Z',
            firstName: 'Student',
            messageCount: '5',
          },
          {
            id: 'session-3',
            name: 'biology',
            endedAt: '2024-07-27T02:44:57.225Z',
            createdAt: '2024-07-27T02:02:47.728Z',
            firstName: 'Student',
            messageCount: '21',
          },
        ],
      },
    })

    NetworkService.getTeacherClassById = vi.fn().mockResolvedValue({
      data: {
        teacherClass: {
          id: 'class-id',
          userId: 'user-id',
          name: 'Algebra 1',
          code: '4BNK46',
          active: true,
          topicId: 1,
          totalStudents: '2',
        },
      },
    })

    NetworkService.getTeacherClasses = vi.fn().mockResolvedValue({
      data: { teacherClasses: [] },
    })

    await router.push(`/dashboard/teacher/class/class-id`)
  })

  test('Show no students message if no students', async () => {
    NetworkService.getStudentsInTeacherClass = vi.fn().mockResolvedValue([])
    const wrapper = await getWrapper({ data: { students: [] } })
    const noStudentMsg = wrapper.find('[data-testid="no-students-msg"]')
    expect(noStudentMsg.exists()).toBe(true)
  })

  test('Show students in table', async () => {
    const students = [
      {
        userId: 'userId1',
        id: 'userId1',
        firstName: 'Student',
        lastName: 'UPchieve',
        email: 'student1@upchieve.org',
        // Following session details calculate to the following:
        // numSessions: 3,
        // timeTutored: '1 hr and 3 m' (63 min total),
        // lastSession: '07/26/2024',
        sessionDetails: [
          {
            name: 'Math',
            startedAt: new Date('2024-07-20T10:00:00Z'),
            endedAt: new Date('2024-07-20T10:20:00Z'), // 20 min
          },
          {
            name: 'Math',
            startedAt: new Date('2024-07-24T10:00:00Z'),
            endedAt: new Date('2024-07-24T10:20:00Z'), // 20 min
          },
          {
            name: 'Math',
            startedAt: new Date('2024-07-26T10:00:00Z'),
            endedAt: new Date('2024-07-26T10:23:00Z'), // 23 min, latest
          },
        ],
      },
      {
        userId: 'userId2',
        id: 'userId2',
        firstName: 'Another',
        lastName: 'Test',
        email: 'test2@upchieve.org',
        sessionDetails: [],
      },
    ]

    const wrapper = await getWrapper({
      data: {
        unfilteredStudents: students,
        filters: {
          topic: { name: 'Math' },
          sessionActivityFrom: '2024-01-01',
          sessionActivityTo: '2024-12-31',
        },
      },
    })

    const studentRows = wrapper.findAll('[data-testid="student-row"]')
    expect(studentRows.length).toBe(students.length)
    const firstRowCells = studentRows[0].findAll('td')
    expect(firstRowCells[0].text()).toBe(
      students[0].firstName + ' ' + students[0].lastName
    )
    expect(firstRowCells[1].text()).toBe(String(3))
    expect(firstRowCells[2].text()).toBe('1 hr and 3 m')
    expect(firstRowCells[3].text()).toBe('07/26/2024')
  })

  test('Click student details', async () => {
    const routerPushSpy = vi.spyOn(router, 'push')

    const wrapper = await getWrapper({
      data: {
        unfilteredStudents: [
          {
            userId: 'userId1',
            id: 'userId1',
            firstName: 'Student',
            lastName: 'UPchieve',
            email: 'student1@upchieve.org',
            sessionDetails: [
              { name: 'English', startedAt: new Date(), endedAt: new Date() },
              { name: 'Science', startedAt: new Date(), endedAt: new Date() },
            ],
          },
        ],
        classData: {
          id: 'class-id',
          userId: 'user-id',
          name: 'Algebra 1',
          code: '4BNK46',
          active: true,
          topicId: 1,
          totalStudents: '2',
        },
      },
    })

    const detailsButton = wrapper.find(
      '[data-testid="view-details-btn-userId1"]'
    )
    expect(detailsButton.exists()).toBe(true)

    await detailsButton.trigger('click')
    expect(routerPushSpy).toHaveBeenCalledWith(
      `/dashboard/teacher/class/class-id/student/userId1`
    )
  })
})

describe('Assignments View', () => {
  const assignments = [
    {
      id: 'assignment-1',
      classId: 'class-id',
      title: 'Assignment 1',
      numberOfSessions: 1,
      minDurationInMinutes: 10,
      dueDate: dayjs.utc('2024-09-30T04:00:00.000Z'),
      startDate: '2024-09-23T04:00:00.000Z',
      isRequired: false,
      subjectId: 2,
      createdAt: '2024-09-23T18:11:15.318Z',
      updatedAt: '2024-09-23T18:11:15.318Z',
    },
  ]
  const assignmentsCompletion = {
    'assignment-1': {
      studentsCompletion: [
        {
          first_name: 'Student',
          last_name: 'UPchieve',
          submitted_at: null,
        },
        {
          first_name: 'Student',
          last_name: 'UPchieve',
          submitted_at: '2024-09-23T20:31:44.156Z',
        },
      ],
      totalStudents: 2,
      completedStudents: 1,
    },
  }
  beforeEach(async () => {
    await router.push(`/dashboard/teacher/class/class-id/assignments`)
    vi.resetAllMocks()

    NetworkService.getStudentsInTeacherClass = vi.fn().mockResolvedValue({
      data: {
        students: [],
      },
    })

    NetworkService.getStudentSessionDetails = vi.fn().mockResolvedValue({
      data: {
        sessionDetails: [],
      },
    })

    NetworkService.getAssignmentsByClassId = vi.fn().mockResolvedValue({
      data: {
        assignments,
      },
    })
    NetworkService.getStudentAssignmentCompletion = vi
      .fn()
      .mockImplementation(() => {
        return Promise.resolve({
          data: {
            studentAssignments: [
              {
                first_name: 'Student',
                last_name: 'UPchieve',
                submitted_at: null,
              },
              {
                first_name: 'Student',
                last_name: 'UPchieve',
                submitted_at: '2024-09-23T20:31:44.156Z',
              },
            ],
          },
        })
      })

    NetworkService.getTeacherClassById = vi.fn().mockResolvedValue({
      data: {
        teacherClass: {
          id: 'class-id',
          userId: 'user-id',
          name: 'Algebra 1',
          code: '4BNK46',
          active: true,
          topicId: 1,
          totalStudents: '2',
        },
      },
    })

    NetworkService.getTeacherClasses = vi.fn().mockResolvedValue({
      data: { teacherClasses: [] },
    })
  })

  test('Show no assignments', async () => {
    NetworkService.getAssignmentsByClassId = vi.fn().mockResolvedValue({
      data: { assignments: [] },
    })
    const wrapper = await getWrapper({ data: { assignments: [] } })
    const noAssignments = wrapper.find('[data-testid="no-assignments"]')
    expect(noAssignments.exists()).toBe(true)
  })

  test('Shows assignments', async () => {
    const wrapper = await getWrapper({ data: { assignments } })

    const hasAssignments = wrapper.find('[data-testid="has-assignments"]')
    expect(hasAssignments.exists()).toBe(true)
  })

  describe('Open tabs', () => {
    test('Click class details tab', async () => {
      await router.push(`/class/123123/assignments`)
      const wrapper = await getWrapper({
        data: { classData: { id: '123123' } },
      })
      expect(wrapper.vm.isSelected).toBe('assignments-tab')
      const classDetailsBtn = wrapper.find('[data-testid="students-tab"]')
      await classDetailsBtn.trigger('click')
      await flushPromises()
      expect(wrapper.vm.isSelected).toBe('students-tab')
    })

    test('Click assignments tab', async () => {
      await router.push(`/dashboard/teacher/class/class-id`)
      const wrapper = await getWrapper()
      expect(wrapper.vm.isSelected).toBe('students-tab')
      const assignmentsTab = wrapper.find('[data-testid="assignments-tab"]')
      await assignmentsTab.trigger('click')
      await flushPromises()
      expect(wrapper.vm.isSelected).toBe('assignments-tab')
    })
  })

  describe('View assignment info', () => {
    test('See assignment title and due date', async () => {
      const wrapper = await getWrapper({
        data: { assignments, assignmentsCompletion },
      })
      const assignmentTitle = wrapper.find(
        '[data-testid="assignment-title-assignment-1"]'
      )
      const assignmentDueDate = wrapper.find(
        '[data-testid="assignment-due-date-assignment-1"]'
      )
      expect(assignmentTitle.text()).toBe('Assignment 1')
      expect(assignmentDueDate.text()).toBe('Due date: 09/30/2024')
    })

    test('See no students assigned text', async () => {
      const wrapper = await getWrapper({
        data: {
          assignments,
          assignmentsCompletion: {},
        },
      })
      const noStudentsAssigned = wrapper.find(
        '[data-testid="no-students-assigned"]'
      )
      expect(noStudentsAssigned.exists()).toBe(true)
    })

    test('See correct student completion text', async () => {
      const wrapper = await getWrapper({
        data: { assignments, assignmentsCompletion },
      })
      const studentCompletion = wrapper.find(
        '[data-testid="student-completion"]'
      )

      expect(studentCompletion.exists()).toBe(true)
      expect(studentCompletion.text()).toBe('Student completion 1/2')
    })
  })
})
