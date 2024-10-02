import { createStore } from 'vuex'
import subjectsModule from '@/store/modules/subjects'
import { mount } from '@vue/test-utils'
import CreateAssignmentModal from '@/components/CreateAssignmentModal.vue'
import { describe, expect, test, vi } from 'vitest'

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
const getWrapper = async (data: {}) => {
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

  const wrapper = mount(CreateAssignmentModal, {
    global: {
      plugins: [store],
    },
    props: {
      modalData: { classes, onAssignmentCreated: onAssignmentCreatedMock },
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

    const wrapper = await getWrapper(data)
    const assignButton = wrapper.find('[data-testid="create-assignment-btn"]')

    assignButton.trigger('click')
    expect(wrapper.props().modalData.onAssignmentCreated).toHaveBeenCalledTimes(
      1
    )
  })
})
