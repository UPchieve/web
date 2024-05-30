import { shallowMount } from '@vue/test-utils'

import LargeButton from '../../../src/components/LargeButton.vue'

//👇 Imports a specific story for the test
// import { Primary, Vanilla } from '../../../src/stories/LargeButton.stories'

it.skip('renders the button in the primary state', () => {
  const wrapper = shallowMount(LargeButton, {
    props: Primary.args,
  })
  expect(wrapper.classes()).toContain('LargeButton-primary')
})

it.skip('renders the button in the vanilla state', () => {
  const wrapper = shallowMount(LargeButton, {
    props: Vanilla.args,
  })
  expect(wrapper.classes()).toContain('LargeButton-secondary')
})
