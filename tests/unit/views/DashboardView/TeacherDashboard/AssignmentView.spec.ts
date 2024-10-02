import AssignmentView from '@/views/DashboardView/TeacherDashboard/AssignmentView.vue'
import { mount } from '@vue/test-utils'
import store from '@/store'
import router from '@/router'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import NetworkService from '@/services/NetworkService'

const getWrapper = async (data = {}) => {
  const wrapper = mount(AssignmentView, {
    global: {
      plugins: [store, router],
    },
  })

  wrapper.setData({
    ...wrapper.vm.$data,
    ...data,
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
    NetworkService.getStudentAssignmentCompletion = vi
      .fn()
      .mockResolvedValue({ data: { studentAssignments } })
    await router.push(
      `/dashboard/teacher/class/class-id/assignment/assignment-1`
    )
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
    const wrapper = await getWrapper({ completedStudents: 1, totalStudents: 2 })

    expect(wrapper.find('[data-testid="student-completion"').text()).toBe(
      'Student Completion 1/2'
    )
  })
})
