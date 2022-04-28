import Cell from '../components/AvailabilityGrid/Cell.vue'

export default {
  title: 'Availability/Cell',
  component: Cell
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { Cell },
  template: '<Cell v-bind="$props">Cell</Cell>'
})

export const Vanilla = Template.bind({})

export const Unselectable = Template.bind({})
Unselectable.args = {
  selectable: false,
  content: 'Cell content'
}

export const Selectable_Unselected = Template.bind({})
Selectable_Unselected.args = {
  selectable: true,
  selected: false
}

export const Selectable_Selected = Template.bind({})
Selectable_Selected.args = {
  selectable: true,
  selected: true
}

export const Flagged_Unselected = Template.bind({})
Flagged_Unselected.args = {
  flagged: true,
  selected: false
}

export const Flagged_Selected = Template.bind({})
Flagged_Selected.args = {
  flagged: true,
  selected: true
}
