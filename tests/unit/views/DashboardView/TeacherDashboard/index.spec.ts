import { createStore } from 'vuex'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import '@/store'
import userModule from '@/store/modules/user'
import subjectsModule from '@/store/modules/subjects'
import NetworkService from '@/services/NetworkService'
import TeacherDashboard from '@/views/DashboardView/TeacherDashboard/index.vue'

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

const stubTemplate = { template: '<div />' }
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/dashboard/teacher',
      name: 'TeacherDashboard',
      component: TeacherDashboard,
      meta: { breadcrumb: 'Classes' },
      children: [
        {
          path: 'class/:classId',
          name: 'ClassDetailsView',
          component: stubTemplate,
          meta: { breadcrumb: 'Class Details' },
          children: [
            {
              path: 'student/:studentId',
              name: 'StudentDetailsView',
              component: stubTemplate,
              meta: { breadcrumb: 'Student Details' },
            },
          ],
        },
        {
          path: 'class/:classId/assignments',
          name: 'ClassAssignmentsView',
          component: stubTemplate,
          meta: { breadcrumb: 'Class Details' },
          children: [
            {
              path: ':assignmentId',
              name: 'AssignmentView',
              component: stubTemplate,
              meta: { breadcrumb: 'Assignment Details' },
            },
          ],
        },
      ],
    },
  ],
})

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
      subjects: {
        ...subjectsModule,
        state: {
          topics,
        },
      },
    },
  })

  const wrapper = mount(TeacherDashboard, {
    global: { plugins: [store, router] },
  })

  wrapper.setData({
    ...wrapper.vm.$data,
    isLoading: false,
    ...overrides,
  })

  return wrapper
}

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
    const routerPushSpy = vi.spyOn(router, 'push')

    NetworkService.getTeacherClasses = vi
      .fn()
      .mockResolvedValue({ data: { teacherClasses: classes } })
    const wrapper = await getWrapper({ classes })
    const classDetailsBtn = wrapper.find(
      `[data-testid="class-details-${classes[0].id}"]`
    )
    classDetailsBtn.trigger('click')
    expect(routerPushSpy).toHaveBeenCalledOnce()
    expect(routerPushSpy).toHaveBeenCalledWith(
      `/dashboard/teacher/class/${classes[0].id}`
    )
  })

  describe('breadcrumbs', () => {
    beforeEach(async () => {
      vi.restoreAllMocks()
      NetworkService.getTopics = vi.fn().mockResolvedValue({ data: { topics } })
      NetworkService.getTeacherClasses = vi
        .fn()
        .mockResolvedValue({ data: { teacherClasses: [] } })
    })
    async function mountAt(path: string) {
      await router.push(path)
      return getWrapper()
    }

    const labels = (wrapper: any) =>
      wrapper.vm.breadcrumbs.map((crumb: any) => crumb.label)

    test('breadcrumbs do not appear on dashboard page', async () => {
      const wrapper = await mountAt('/dashboard/teacher')
      expect(wrapper.find('[data-testid="breadcrumbs"]').exists()).toBeFalsy()
    })

    test('class details view renders "Class Details" as the current page, not a link', async () => {
      const wrapper = await mountAt('/dashboard/teacher/class/123')
      expect(labels(wrapper)).toEqual(['Classes', 'Class Details'])
      expect(wrapper.find('a[data-testid="Class Details"]').exists()).toBe(
        false
      )
      expect(wrapper.find('span[data-testid="Class Details"]').exists()).toBe(
        true
      )
      expect(wrapper.find('a[data-testid="Classes"]').exists()).toBe(true)
    })

    test('student details view renders "Student Details" as the current page, not a link', async () => {
      const wrapper = await mountAt('/dashboard/teacher/class/123/student/000')
      expect(labels(wrapper)).toEqual([
        'Classes',
        'Class Details',
        'Student Details',
      ])
      expect(wrapper.find('a[data-testid="Student Details"]').exists()).toBe(
        false
      )
      expect(wrapper.find('span[data-testid="Student Details"]').exists()).toBe(
        true
      )
      expect(wrapper.find('a[data-testid="Classes"]').exists()).toBe(true)
      expect(wrapper.find('a[data-testid="Class Details"]').exists()).toBe(true)
    })

    test('assignment details view renders "Assignment Details" as the current page, not a link', async () => {
      const wrapper = await mountAt(
        '/dashboard/teacher/class/123/assignments/999'
      )
      expect(labels(wrapper)).toEqual([
        'Classes',
        'Class Details',
        'Assignment Details',
      ])
      expect(wrapper.find('a[data-testid="Assignment Details"]').exists()).toBe(
        false
      )
      expect(
        wrapper.find('span[data-testid="Assignment Details"]').exists()
      ).toBe(true)
      expect(wrapper.find('a[data-testid="Classes"]').exists()).toBe(true)
      expect(wrapper.find('a[data-testid="Class Details"]').exists()).toBe(true)
    })

    test('student detail links "Class Details" back to the Students tab', async () => {
      const wrapper = await mountAt('/dashboard/teacher/class/123/student/456')
      const link = wrapper.find('[data-testid="Class Details"]')
      await link.trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.name).toBe('ClassDetailsView')
    })

    test('student detail links "Classes" back to the dashboard', async () => {
      const wrapper = await mountAt('/dashboard/teacher/class/123/student/456')
      const link = wrapper.find('[data-testid="Classes"]')
      await link.trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.name).toBe('TeacherDashboard')
    })

    test('assignment detail links "Class Details" back to the Assignments tab', async () => {
      const wrapper = await mountAt(
        '/dashboard/teacher/class/123/assignments/789'
      )
      const link = wrapper.find('[data-testid="Class Details"]')
      await link.trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.name).toBe('ClassAssignmentsView')
    })

    test('assignment detail links "Classes" back to the Assignments tab', async () => {
      const wrapper = await mountAt(
        '/dashboard/teacher/class/123/assignments/789'
      )
      const link = wrapper.find('[data-testid="Classes"]')
      await link.trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.name).toBe('TeacherDashboard')
    })
  })
})
