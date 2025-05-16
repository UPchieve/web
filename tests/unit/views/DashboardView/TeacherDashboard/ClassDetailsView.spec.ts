import ClassDetailsView from '@/views/DashboardView/TeacherDashboard/ClassDetailsView.vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import router from '@/router'
import NetworkService from '@/services/NetworkService'
import { createStore } from 'vuex'
import userModule from '@/store/modules/user'
import subjectsModule from '@/store/modules/subjects'
import featureFlagsModule from '@/store/modules/feature-flags'

type Overrides = {
  data?: Record<string, any>
}

const getWrapper = async (overrides: Overrides = {}) => {
  const store = createStore({
    modules: {
      user: {
        ...userModule,
      },
      featureFlags: {
        ...featureFlagsModule,
      },
      subjects: {
        ...subjectsModule,
      },
    },
  })
  const wrapper = mount(ClassDetailsView, {
    global: {
      plugins: [store, router],
    },
    props: {
      classes: [],
      classId: 'class-id',
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
        numSessions: 3,
        timeTutored: '1 hour(s) and 3 minute(s)',
        lastSession: '07/26/2024',
      },
      {
        userId: 'userId2',
        id: 'userId2',
        firstName: 'Another',
        lastName: 'Test',
        email: 'test2@upchieve.org',
        numSessions: 0,
        timeTutored: '0 minutes',
        lastSession: 'Has not completed a session.',
      },
    ]

    const wrapper = await getWrapper({ data: { students } })

    const studentRows = wrapper.findAll('[data-testid="student-row"]')
    expect(studentRows.length).toBe(students.length)
    const firstRowCells = studentRows[0].findAll('td')
    expect(firstRowCells[0].text()).toBe(
      students[0].firstName + ' ' + students[0].lastName
    )
    expect(firstRowCells[1].text()).toBe(String(students[0].numSessions))
    expect(firstRowCells[2].text()).toBe(students[0].timeTutored)
    expect(firstRowCells[3].text()).toBe(students[0].lastSession)
  }),
    test('Click student details', async () => {
      const routerPushSpy = vi.spyOn(router, 'push')

      const wrapper = await getWrapper({
        data: {
          students: [
            {
              userId: 'userId1',
              id: 'userId1',
              firstName: 'Student',
              lastName: 'UPchieve',
              email: 'student1@upchieve.org',
              numSessions: 3,
              timeTutored: '1 hour(s)',
              lastSession: '07/26/2024',
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
      dueDate: '2024-09-30T04:00:00.000Z',
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
  })

  test('Show no assignments', async () => {
    NetworkService.getAssignmentsByClassId = vi.fn().mockResolvedValue({
      data: { assignments: [] },
    })
    const wrapper = await getWrapper({
      data: { assignments: [], isSelected: 'assignments' },
    })
    const noAssignments = wrapper.find('[data-testid="no-assignments"]')
    expect(noAssignments.exists()).toBe(true)
  })

  test('Shows assignments', async () => {
    const wrapper = await getWrapper({
      data: { isSelected: 'assignments', assignments },
    })

    const hasAssignments = wrapper.find('[data-testid="has-assignments"]')
    expect(hasAssignments.exists()).toBe(true)
  })

  describe('Open tabs', () => {
    test('Click class details tab', async () => {
      const wrapper = await getWrapper({
        data: { isSelected: 'assignments' },
      })
      const classDetailsBtn = wrapper.find('[data-testid="class-details-tab"]')
      classDetailsBtn.trigger('click')
      expect(wrapper.vm.isSelected).toBe('classDetails')
    })

    test('Click assignments tab', async () => {
      const wrapper = await getWrapper({
        data: { isSelected: 'classDetails' },
      })
      const classDetailsBtn = wrapper.find('[data-testid="assignments-tab"]')
      classDetailsBtn.trigger('click')
      expect(wrapper.vm.isSelected).toBe('assignments')
    })
  })

  describe('View assignment info', () => {
    test('See assignment title and due date', async () => {
      const wrapper = await getWrapper({
        data: { isSelected: 'assignments', assignments, assignmentsCompletion },
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
          isSelected: 'assignments',
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
        data: { isSelected: 'assignments', assignments, assignmentsCompletion },
      })
      const studentCompletion = wrapper.find(
        '[data-testid="student-completion"]'
      )

      expect(studentCompletion.exists()).toBe(true)
      expect(studentCompletion.text()).toBe('Student completion 1/2')
    })
  })
})
