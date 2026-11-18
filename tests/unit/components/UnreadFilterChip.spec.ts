import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UnreadFilterChip from '@/components/UnreadFilterChip.vue'

function mountChip(value: boolean, count = 7) {
  return mount(UnreadFilterChip, { props: { value, count } })
}

describe('UnreadFilterChip', () => {
  it('shows the label and count', () => {
    const wrapper = mountChip(false)

    expect(wrapper.text()).toContain('Unread')
    expect(wrapper.find('[data-testid="unread-count"]').text()).toBe('7')
    expect(wrapper.attributes('aria-label')).toBe('Unread, 7')
  })

  it('is not pressed while off', () => {
    const wrapper = mountChip(false)

    expect(wrapper.attributes('aria-pressed')).toBe('false')
    expect(wrapper.classes()).not.toContain('toggle-chip--active')
    expect(
      wrapper.find('[data-testid="unread-count"]').classes()
    ).not.toContain('unread-chip__count--active')
  })

  it('is pressed and blue while on', () => {
    const wrapper = mountChip(true)

    expect(wrapper.attributes('aria-pressed')).toBe('true')
    expect(wrapper.classes()).toContain('toggle-chip--active')
    expect(wrapper.find('[data-testid="unread-count"]').classes()).toContain(
      'unread-chip__count--active'
    )
  })

  it('emits the opposite value when clicked', async () => {
    const off = mountChip(false)
    await off.trigger('click')
    expect(off.emitted('change')).toEqual([[{ value: true }]])

    const on = mountChip(true)
    await on.trigger('click')
    expect(on.emitted('change')).toEqual([[{ value: false }]])
  })
})
