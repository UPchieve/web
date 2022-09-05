import { mount } from '@vue/test-utils'

import Cell from '../../../src/components/AvailabilityGrid/Cell.vue'
import {
  Unselectable,
  Selectable_Unselected,
  Selectable_Selected,
} from '../../../src/stories/Cell.stories'

it('renders the cell in the unselectable state', () => {
  const wrapper = mount(Cell, {
    propsData: Unselectable.args,
  })
  expect(wrapper.classes()).toContain('Cell-unselectable')
})

it('renders the cell in the selectable + unselected state', () => {
  const wrapper = mount(Cell, {
    propsData: Selectable_Unselected.args,
  })
  expect(wrapper.classes()).toContain('Cell-selectable')
})

it('renders the cell in the selectable + selected state', () => {
  const wrapper = mount(Cell, {
    propsData: Selectable_Selected.args,
  })
  expect(wrapper.classes()).toContain('Cell-selectable--selected')
})

// TODO: test flagged state via query selector for clock in wrapper.find()
// TODO: test full grid via wrapper.findAll() to find child cells
