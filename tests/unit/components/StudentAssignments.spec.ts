import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import StudentAssignments from '@/components/StudentAssignments.vue'

function getWrapper(assignments: object[]) {
  return mount(StudentAssignments, {
    props: { assignments },
    global: {
      plugins: [
        createStore({
          modules: { user: { state: { user: { userType: 'student' } } } },
        }),
      ],
    },
  })
}

function buildAssignment(overrides: object = {}) {
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 7)
  return {
    id: crypto.randomUUID(),
    classId: crypto.randomUUID(),
    title: 'Homework 1',
    dueDate: dueDate.toISOString(),
    numberOfSessions: 4,
    completedSessions: [{}],
    ...overrides,
  }
}

describe('StudentAssignments', () => {
  test('shows completed session progress', () => {
    const wrapper = getWrapper([buildAssignment()])

    expect(wrapper.find('.assignments-progress-text').text()).toBe(
      '1 / 4 sessions completed'
    )
    expect(
      (wrapper.find('.progress-bar').element as HTMLElement).style.width
    ).toBe('25%')
  })

  test('renders when completedSessions is missing', () => {
    const wrapper = getWrapper([
      buildAssignment({ completedSessions: undefined }),
    ])

    expect(wrapper.find('.assignments-progress-text').text()).toBe(
      '0 / 4 sessions completed'
    )
    expect(
      (wrapper.find('.progress-bar').element as HTMLElement).style.width
    ).toBe('0%')
  })

  test('renders an empty progress bar when numberOfSessions is missing', () => {
    const wrapper = getWrapper([
      buildAssignment({ numberOfSessions: undefined }),
    ])

    expect(
      (wrapper.find('.progress-bar').element as HTMLElement).style.width
    ).toBe('0%')
  })
})
