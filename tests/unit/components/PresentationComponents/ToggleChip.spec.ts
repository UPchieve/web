import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ToggleChip from '@/components/PresentationComponents/ToggleChip.vue'

describe('ToggleChip', () => {
  it('renders the icon and label slots in a button', () => {
    const wrapper = mount(ToggleChip, {
      slots: {
        icon: '<span data-testid="icon" />',
        default: 'Favorites',
      },
    })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.find('[data-testid="icon"]').exists()).toBe(true)
    expect(wrapper.text()).toBe('Favorites')
  })

  it('is not pressed by default', () => {
    const wrapper = mount(ToggleChip)

    expect(wrapper.attributes('aria-pressed')).toBe('false')
    expect(wrapper.classes()).not.toContain('toggle-chip--active')
  })

  it('is pressed and highlighted when active', () => {
    const wrapper = mount(ToggleChip, { props: { active: true } })

    expect(wrapper.attributes('aria-pressed')).toBe('true')
    expect(wrapper.classes()).toContain('toggle-chip--active')
  })

  it('passes attributes and clicks through to the button', async () => {
    const wrapper = mount(ToggleChip, {
      attrs: { 'data-testid': 'my-chip' },
    })

    await wrapper.trigger('click')

    expect(wrapper.attributes('data-testid')).toBe('my-chip')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
