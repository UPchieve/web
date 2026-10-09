import { mount } from '@vue/test-utils'

import Cell from '@/components/AvailabilityGrid/Cell.vue'

it('renders the cell in the unselectable state', () => {
  const wrapper = mount(Cell, {
    props: {
      selectable: false,
      content: 'Cell content',
    },
  })
  expect(wrapper.classes()).toContain('Cell-unselectable')
})

it('renders the cell in the selectable + unselected state', () => {
  const wrapper = mount(Cell, {
    props: {
      selectable: true,
      selected: false,
    },
  })
  expect(wrapper.classes()).toContain('Cell-selectable')
})

it('renders the cell in the selectable + selected state', () => {
  const wrapper = mount(Cell, {
    props: {
      selectable: true,
      selected: true,
    },
  })
  expect(wrapper.classes()).toContain('Cell-selectable--selected')
})

// TODO: test flagged state via query selector for clock in wrapper.find()
// TODO: test full grid via wrapper.findAll() to find child cells
