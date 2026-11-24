import ResourceIcon from '@/components/NTHS/HQ/ResourceIcon.vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

describe('ResourceIcon', () => {
  it.each([
    ['user-plus', true],
    ['document', true],
    ['no-such-icon', false],
    ['toString', false],
  ])('renders an icon for %s: %s', (name, exists) => {
    const wrapper = mount(ResourceIcon, { props: { name } })
    expect(wrapper.find('[data-testid="resource-icon"]').exists()).toBe(exists)
  })
})
