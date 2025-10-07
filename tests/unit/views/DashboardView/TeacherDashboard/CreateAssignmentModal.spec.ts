import { createStore } from 'vuex'
import featureFlagsModule from '@/store/modules/feature-flags'
import subjectsModule from '@/store/modules/subjects'
import { mount } from '@vue/test-utils'
import CreateAndEditAssignmentModal from '@/components/CreateAndEditAssignmentModal.vue'
import { describe, expect, test, vi } from 'vitest'
import router from '@/router'

const classes = [
  {
    id: 'class-1',
    userId: 'teacher',
    name: 'Class 1',
    code: 'FYAEI1',
    topicId: 1,
    active: true,
    totalStudents: 1,
    createdAt: '2024-09-20T19:06:50.014Z',
    updatedAt: '2024-09-20T19:06:50.014Z',
  },
  {
    id: 'class-2',
    userId: 'teacher',
    name: 'Class 2',
    code: '7531PV',
    topicId: 2,
    active: true,
    totalStudents: 0,
    createdAt: '2024-09-23T18:19:21.059Z',
    updatedAt: '2024-09-23T18:19:21.059Z',
  },
]

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
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const getWrapper = async (data: {}) => {
  const store = createStore({
    modules: {
      featureFlags: featureFlagsModule,
      subjects: {
        state: {
          ...subjectsModule,
          subjects: {
            algebraOne: {
              id: 2,
              name: 'algebraOne',
              displayName: 'Algebra 1',
              topicId: 1,
            },
            biology: {
              id: 10,
              name: 'biology',
              displayName: 'Biology',
              topicId: 2,
            },
          },
        },
      },
    },
  })

  const onAssignmentCreatedMock = vi.fn()

  const wrapper = mount(CreateAndEditAssignmentModal, {
    global: {
      plugins: [store, router],
    },
    props: {
      modalData: {
        classes,
        currentClass: classes[0],
        topics,
        onAssignmentCreated: onAssignmentCreatedMock,
      },
    },
  })

  wrapper.setData({
    ...wrapper.vm.$data,
    ...data,
  })

  return wrapper
}

describe('Create Assignment Modal', () => {
  test.each([
    [{ assignmentName: '', classes }, true],
    [{ assignmentName: 'Assignment', classes }, true],
    [
      {
        assignmentName: 'Assignment',
        classes,
        selectedClasses: classes,
      },
      true,
    ],
    [
      {
        assignmentName: 'Assignment',
        selectedClasses: classes,
        classes,
        selectedSessionToComplete: {
          id: 2,
          name: 'algebra',
          displayName: 'Algebra',
          topicId: 1,
        },
      },
      false,
    ],
  ])(
    'Assign button should be disabled if missing required input',
    async (data, disabled) => {
      const wrapper = await getWrapper(data)
      const assignButton = wrapper.find('[data-testid="create-assignment-btn"]')

      if (disabled) {
        expect(assignButton.attributes('disabled')).toBeDefined()
        expect(assignButton.attributes('disabled')).toBe('')
      } else {
        expect(assignButton.attributes('disabled')).toBeUndefined()
      }
    }
  )

  test('onAssignmentCreated is called', async () => {
    const data = {
      assignmentName: 'Assignment',
      selectedClasses: classes,
      classes,
      selectedSessionToComplete: {
        id: 2,
        name: 'algebra',
        displayName: 'Algebra',
        topicId: 1,
      },
    }

    await router.push(`/dashboard/teacher`)
    const wrapper = await getWrapper(data)
    const assignButton = wrapper.find('[data-testid="create-assignment-btn"]')

    assignButton.trigger('click')
    expect(wrapper.props().modalData.onAssignmentCreated).toHaveBeenCalledTimes(
      1
    )
  })
})
