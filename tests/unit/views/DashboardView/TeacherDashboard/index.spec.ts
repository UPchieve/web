import TeacherDashboard from '@/views/DashboardView/TeacherDashboard/index.vue'
import router from '@/router'
import { createStore } from 'vuex'
import {
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest'
import { mount } from '@vue/test-utils'
import userModule from '@/store/modules/user'
import NetworkService from '@/services/NetworkService'

const getWrapper = async (overrides = {}) => {

  const store = createStore({
    modules: {
      user: {
        ...userModule,
        state: {
          user: {
            ...userModule.state,
            id: 'userId',
            firstName: 'Teacher',
            userType: 'teacher',
          },
        },
      },
    },
  })

  const wrapper = mount(TeacherDashboard, {
    global: { plugins: [store, router] }
  })

  const formattedTopics = await TeacherDashboard.methods.formatTopics()

  wrapper.setData({
    ...wrapper.vm.$data,
    isLoading: false,
    formattedTopics,
    ...overrides,
  })

  return wrapper
}

const topics = [
  {
    id: 1,
    name: 'math',
    displayName: 'Math',
    iconLink: 'https://cdn.upchieve.org/site-images/topic-icons/math.svg',
    dashboardOrder: 1,
    trainingOrder: 1,
  },
  {
    id: 2,
    name: 'science',
    displayName: 'Science',
    iconLink: 'https://cdn.upchieve.org/site-images/topic-icons/science.svg',
    dashboardOrder: 3,
    trainingOrder: 2,
  },
  {
    id: 3,
    name: 'college',
    displayName: 'College Counseling',
    iconLink: 'https://cdn.upchieve.org/site-images/topic-icons/college.svg',
    dashboardOrder: 5,
    trainingOrder: 5,
  },
  {
    id: 5,
    name: 'readingWriting',
    displayName: 'English',
    iconLink: 'https://cdn.upchieve.org/site-images/topic-icons/english.svg',
    dashboardOrder: 2,
    trainingOrder: 3,
  },
  {
    id: 6,
    name: 'socialStudies',
    displayName: 'Social Studies',
    iconLink:
      'https://cdn.upchieve.org/site-images/topic-icons/social-studies.svg',
    dashboardOrder: 4,
    trainingOrder: 4,
  },
  {
    id: 4,
    name: 'sat',
    displayName: 'SAT & ACT Prep',
    iconLink: 'https://cdn.upchieve.org/site-images/topic-icons/sat.svg',
    dashboardOrder: 6,
    trainingOrder: 6,
  },
]


describe('Teacher Dashboard', () => {

  const classes = [
    {
      id: 'class-id',
      userId: 'user-id',
      name: 'Algebra 1',
      code: '4BNK46',
      topicId: 1,
      active: true,
      totalStudents: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  beforeEach(async () => {
    vi.restoreAllMocks()
    await router.push(`/dashboard/teacher`)
    NetworkService.getTopics = vi.fn().mockResolvedValue({ data: { topics } })
  })

  describe('Show teacher dash', () => {
    test('with no classes', async () => {
      NetworkService.getTeacherClasses = vi
        .fn()
        .mockResolvedValue({ data: { teacherClasses: [] } })
      const wrapper = await getWrapper()
      const noClassesMsg = wrapper.find('[data-testid="empty-classes-msg"]')
      expect(noClassesMsg.exists()).toBe(true)
    })

    test('with classes', async () => {
      NetworkService.getTeacherClasses = vi
        .fn()
        .mockResolvedValue({ data: { teacherClasses: classes } })
      const wrapper = await getWrapper({ classes })
      const classesContainer = wrapper.find('[data-testid="classes-container"]')
      expect(classesContainer.exists()).toBe(true)
    })
  })

  test('goes to class details page when class is selected', async () => {
    let routerPushSpy = vi.spyOn(router, 'push')

    NetworkService.getTeacherClasses = vi
      .fn()
      .mockResolvedValue({ data: { teacherClasses: classes } })
    const wrapper = await getWrapper({ classes })
    const classDetailsBtn = wrapper.find(`[data-testid="class-details-btn-${classes[0].id}"]`)
    classDetailsBtn.trigger('click')
    expect(routerPushSpy).toHaveBeenCalledOnce()
    expect(routerPushSpy).toHaveBeenCalledWith(
      `/dashboard/teacher/class/${classes[0].id}`
    )
  })
})