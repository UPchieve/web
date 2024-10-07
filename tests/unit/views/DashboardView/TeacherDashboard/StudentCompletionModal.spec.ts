import StudentCompletionModal from '@/components/StudentCompletionModal.vue'
import { describe, expect, test } from 'vitest'
import { mount } from '@vue/test-utils'
import store from '@/store'

const getWrapper = async (data = {}) => {
  const wrapper = mount(StudentCompletionModal, {
    global: {
      plugins: [store],
    },
    props: {
      modalData: {
        studentCompletion: [
          {
            first_name: 'Student',
            last_name: 'One',
            submitted_at: null,
          },
          {
            first_name: 'Student',
            last_name: 'Two',
            submitted_at: '2024-09-23T20:31:44.156Z',
          },
        ],
      },
    },
  })

  wrapper.setData({
    ...wrapper.vm.$data,
    ...data,
  })

  return wrapper
}

describe('Student Completion Modal', () => {
  test('Shows correct student completion text', async () => {
    const wrapper = await getWrapper()

    const notSubmittedCheckmark = wrapper.find(
      '[data-testid="StudentOne-checkmark"]'
    )
    const submittedCheckmark = wrapper.find(
      '[data-testid="StudentTwo-checkmark"]'
    )

    const notSubmittedText = wrapper.find('[data-testid="student-StudentOne"]')
    const submittedText = wrapper.find('[data-testid="student-StudentTwo"]')

    expect(notSubmittedCheckmark.exists()).toBe(false)
    expect(submittedCheckmark.exists()).toBe(true)
    expect(notSubmittedText.text()).toContain('Student One not submitted')
    expect(submittedText.text()).toContain('Student Two submitted on')
  })
})
