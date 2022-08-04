import { shallowMount } from '@vue/test-utils'

import LargeButton from '../../../src/components/LargeButton.vue'

//👇 Imports a specific story for the test
import { Primary, Vanilla } from '../../../src/stories/LargeButton.stories'

it('renders the button in the primary state', () => {
  const wrapper = shallowMount(LargeButton, {
    propsData: Primary.args,
  })
  expect(wrapper.classes()).toContain('LargeButton-primary')
})

it('renders the button in the vanilla state', () => {
  const wrapper = shallowMount(LargeButton, {
    propsData: Vanilla.args,
  })
  expect(wrapper.classes()).toContain('LargeButton-secondary')
})
