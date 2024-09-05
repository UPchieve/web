import ClassDetailsView from '@/views/DashboardView/TeacherDashboard/ClassDetailsView.vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import store from '@/store'
import router from '@/router'
import NetworkService from '@/services/NetworkService'

const getWrapper = async (data = {}) => {
  const wrapper = mount(ClassDetailsView, {
    global: {
      plugins: [store, router],
    },
    props: {
      classInfo: {
        id: 'class-id',
        userId: 'user-id',
        name: 'Algebra 1',
        code: '4BNK46',
        active: true,
        topicId: 1,
        totalStudents: '2',
      },
      classId: 'class-id',
    },
  })

  wrapper.setData({
    ...wrapper.vm.$data,
    isLoading: false,
    ...data,
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
    await router.push(`/dashboard/teacher/class/class-id`)
  })

  test('Show no students message if no students', async () => {
    NetworkService.getStudentsInTeacherClass = vi.fn().mockResolvedValue([])
    const wrapper = await getWrapper({ students: [] })
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

    const wrapper = await getWrapper({ students })

    const studentRows = wrapper.findAll('[data-testid="student-row"]')
    expect(studentRows.length).toBe(students.length)
    const firstRowCells = studentRows[0].findAll('td')
    expect(firstRowCells[0].text()).toBe(students[0].firstName)
    expect(firstRowCells[1].text()).toBe(String(students[0].numSessions))
    expect(firstRowCells[2].text()).toBe(students[0].timeTutored)
    expect(firstRowCells[3].text()).toBe(students[0].lastSession)
  }),
    test('Click student details', async () => {
      const routerPushSpy = vi.spyOn(router, 'push')

      const wrapper = await getWrapper({
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
