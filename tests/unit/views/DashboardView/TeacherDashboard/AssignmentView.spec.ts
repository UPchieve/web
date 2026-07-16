import AssignmentView from '@/views/DashboardView/TeacherDashboard/AssignmentView.vue'
import { mount } from '@vue/test-utils'
import store from '@/store'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import NetworkService from '@/services/NetworkService'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/dashboard/teacher/class/:classId/assignments/:assignmentId',
      name: 'AssignmentView',
      component: AssignmentView,
    },
  ],
})

const getWrapper = async (data = {}, assignmentsCompletion = {}) => {
  const wrapper = mount(AssignmentView, {
    global: {
      plugins: [store, router],
      provide: {
        classData: {},
        assignmentsCompletion,
      },
    },
  })

  wrapper.setData({
    ...wrapper.vm.$data,
    ...data,
    isLoading: false,
  })

  return wrapper
}

const assignment = {
  id: 'assignment-1',
  classId: 'class-id',
  title: 'AssignmentOne',
  numberOfSessions: 1,
  minDurationInMinutes: 10,
  dueDate: '2024-09-30T04:00:00.000Z',
  startDate: '2024-09-23T04:00:00.000Z',
  isRequired: false,
  subjectId: 2,
  createdAt: '2024-09-23T18:11:15.318Z',
  updatedAt: '2024-09-23T18:11:15.318Z',
  subjectName: 'algebraOne',
}

const studentAssignments = [
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
]
describe('Assignment View', () => {
  beforeEach(async () => {
    NetworkService.getAssignmentById = vi.fn().mockResolvedValue({
      data: { assignment },
    })
    NetworkService.getAssignmentDocuments = vi.fn().mockResolvedValue({
      data: { assignmentDocuments: [] },
    })
    await router.push(
      `/dashboard/teacher/class/class-id/assignments/assignment-1`
    )
    await router.isReady()
  })
  test('Show instructions message', async () => {
    const assignmentWithDirections = {
      ...assignment,
      description: 'Directions go here.',
    }
    const wrapper = await getWrapper({
      assignmentInfo: assignmentWithDirections,
    })

    expect(wrapper.find('[data-testid="description-text"]').text()).toBe(
      'Directions go here.'
    )
  })

  test('Show no instructions', async () => {
    const wrapper = await getWrapper({
      assignmentInfo: assignment,
    })

    expect(wrapper.find('[data-testid="description-text"]').text()).toBe(
      'No instructions provided.'
    )
  })

  test('Show correct number for students completed', async () => {
    const wrapper = await getWrapper(
      { assignmentInfo: assignment },
      {
        'assignment-1': {
          studentsCompletion: studentAssignments,
          totalStudents: 2,
          completedStudents: 1,
        },
      }
    )

    expect(wrapper.find('[data-testid="student-completion"').text()).toBe(
      'Student Completion 1/2'
    )
  })
})
