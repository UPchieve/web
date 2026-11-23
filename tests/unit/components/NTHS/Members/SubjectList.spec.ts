import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SubjectList from '@/components/NTHS/Members/SubjectList.vue'

const names = (wrapper: ReturnType<typeof mount>) =>
  wrapper.find('[data-testid="subject-names"]').text()

describe('SubjectList', () => {
  it('says None yet without subjects', () => {
    const wrapper = mount(SubjectList, { props: { subjects: [] } })
    expect(wrapper.text()).toBe('None yet')
  })

  it('shows three or fewer in full with no button', () => {
    const wrapper = mount(SubjectList, { props: { subjects: ['A', 'B', 'C'] } })
    expect(names(wrapper)).toBe('A, B, C')
    expect(wrapper.find('[data-testid="subjects-toggle"]').exists()).toBe(false)
  })

  it('reveals the rest on +N more and hides them on Show less', async () => {
    const wrapper = mount(SubjectList, {
      props: { subjects: ['A', 'B', 'C', 'D', 'E'] },
    })
    expect(names(wrapper)).toBe('A, B, C')
    expect(wrapper.find('[data-testid="subjects-toggle"]').text()).toBe(
      '+2 more'
    )
    expect(
      wrapper
        .find('[data-testid="subjects-toggle"]')
        .attributes('aria-expanded')
    ).toBe('false')

    await wrapper.find('[data-testid="subjects-toggle"]').trigger('click')
    expect(names(wrapper)).toBe('A, B, C, D, E')
    expect(wrapper.find('[data-testid="subjects-toggle"]').text()).toBe(
      'Show less'
    )
    expect(
      wrapper
        .find('[data-testid="subjects-toggle"]')
        .attributes('aria-expanded')
    ).toBe('true')

    await wrapper.find('[data-testid="subjects-toggle"]').trigger('click')
    expect(names(wrapper)).toBe('A, B, C')
  })
})
