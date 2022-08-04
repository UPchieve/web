import Chip from '../components/Chip.vue'

export default {
  title: 'Components/Chip',
  component: Chip,
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { Chip },
  template: '<Chip v-bind="$props">Chip</Chip>',
})

export const Basic = Template.bind({})
Basic.args = {
  chipContent: 'Chip content',
}
