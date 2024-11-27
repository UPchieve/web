import StudentDetailsView from '@/views/DashboardView/TeacherDashboard/StudentDetailsView.vue'
import NetworkService from '@/services/NetworkService'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import router from '@/router'
import { createStore } from 'vuex'
import subjectsModule from '@/store/modules/subjects'
import moment from 'moment'

const topics = [
  {
    id: 1,
    name: 'math',
    displayName: 'Math',
  },
  {
    id: 2,
    name: 'science',
    displayName: 'Science',
  },
]

const classInfo = {
  id: 'classId',
  userId: 'userId',
  name: 'Algebra 1',
  code: '4BNK46',
  topicId: 1,
  active: true,
  totalStudents: 2,
  createdAt: '2024-07-22T22:31:36.124Z',
  updatedAt: '2024-07-22T22:31:36.124Z',
}

function getDates(daysAgo: number) {
  const currentDate = new Date()
  const dateBefore = new Date(currentDate)
  dateBefore.setDate(currentDate.getDate() - daysAgo)

  const oneHourAfter = new Date(dateBefore)
  oneHourAfter.setHours(dateBefore.getHours() + 1)

  return [dateBefore.toISOString(), oneHourAfter.toISOString()]
}

const twoDaysAgo = getDates(2)
const tenDaysAgo = getDates(10)

const sessionDetails = [
  {
    id: 'session-1',
    name: 'algebraOne',
    endedAt: twoDaysAgo[1],
    createdAt: twoDaysAgo[0],
    firstName: 'Student',
    messageCount: '4',
  },
  {
    id: 'session-2',
    name: 'algebraOne',
    endedAt: tenDaysAgo[1],
    createdAt: tenDaysAgo[0],
    firstName: 'Student',
    messageCount: '5',
  },
  {
    id: 'session-3',
    name: 'biology',
    endedAt: twoDaysAgo[1],
    createdAt: twoDaysAgo[0],
    firstName: 'Student',
    messageCount: '21',
  },
]

const getWrapper = async ({ data = {} }) => {
  const store = createStore({
    modules: {
      subjects: {
        state: {
          ...subjectsModule,
          subjects: {
            algebraOne: {
              id: 2,
              name: 'algebraOne',
              displayName: 'Algebra 1',
              topicId: 1,
              topicName: 'math',
            },
            biology: {
              id: 10,
              name: 'biology',
              displayName: 'Biology',
              topicId: 2,
              topicName: 'science',
            },
          },
        },
      },
    },
  })

  const wrapper = mount(StudentDetailsView, {
    global: {
      plugins: [store, router],
    },
    props: {
      className: 'Algebra 1',
      classInfo,
      topics,
    },
  })

  wrapper.setData({
    ...wrapper.vm.$data,
    isLoading: false,
    ...data,
  })

  return wrapper
}

describe('Student Details View', () => {
  beforeEach(() => {
    NetworkService.getStudentSessionDetails = vi.fn().mockResolvedValue({
      data: {
        sessionDetails,
      },
    })
  })

  test('Shows student sessions for default filters', async () => {
    const wrapper = await getWrapper({})
    await wrapper.vm.getStudentSessionDetails()
    expect(wrapper.vm.sessions).toHaveLength(1)
    expect(wrapper.vm.sessions[0].id).toEqual(sessionDetails[0].id)
  })

  test('Filters sessions with just biology', async () => {
    const wrapper = await getWrapper({
      data: { filters: { topic: { name: 'science' } } },
    })
    await wrapper.vm.submitFilter()

    expect(wrapper.vm.sessions).toHaveLength(1)
    expect(wrapper.vm.sessions[0].id).toEqual('session-3')
    expect(wrapper.vm.sessions[0].sessionSubject).toEqual('Biology')
  })

  test('Filter session with earlier dates', async () => {
    const wrapper = await getWrapper({
      data: {
        filters: {
          sessionActivityFrom: moment()
            .subtract(11, 'days')
            .format('YYYY-MM-DD'),
        },
      },
    })
    await wrapper.vm.submitFilter()

    expect(wrapper.vm.sessions).toHaveLength(2)
    expect(wrapper.vm.sessions[0].id).toEqual('session-1')
    expect(wrapper.vm.sessions[0].sessionSubject).toEqual('Algebra 1')
    expect(wrapper.vm.sessions[1].id).toEqual('session-2')
    expect(wrapper.vm.sessions[1].sessionSubject).toEqual('Algebra 1')
  })

  test('Error when fetching student sessions', async () => {
    NetworkService.getStudentSessionDetails = vi.fn().mockRejectedValue({
      response: {
        data: {
          err: 'Something went wrong',
        },
      },
    })

    const wrapper = await getWrapper({})
    expect(wrapper.vm.sessions).toHaveLength(0)
    expect(wrapper.vm.isLoading).toBe(false)
  })
})
