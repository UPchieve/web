import HyperlinkButton from '../components/HyperlinkButton.vue'

export default {
  title: 'Example/HyperlinkButton',
  component: HyperlinkButton,
  argTypes: {}
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { HyperlinkButton },
  template: '<hyperlink-button v-bind="$props">Button</hyperlink-button>'
})

export const Vanilla = Template.bind({})

export const Primary = Template.bind({})
Primary.args = {
  primary: true
}

export const Reverse = Template.bind({})
Reverse.args = {
  reverse: true
}
Reverse.parameters = {
  backgrounds: { default: 'upchieve green' }
}

export const RouteTo = Template.bind({})
RouteTo.args = {
  primary: true,
  routeTo: '/signup'
}

export const Dark = Template.bind({})
Dark.args = {
  dark: true
}
