import LargeButton from '../components/LargeButton.vue'
import StoryRouter from './storybook-router'

export default {
  title: 'Example/LargeButton',
  component: LargeButton
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { LargeButton },
  template: '<large-button v-bind="$props">Button</large-button>'
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

export const WithRoute = Template.bind({})
WithRoute.args = {
  primary: true,
  routeTo: '/signup'
}
WithRoute.decorators = [StoryRouter()]

export const VanillaWithRoute = Template.bind({})
VanillaWithRoute.args = {
  routeTo: '/signup'
}
VanillaWithRoute.decorators = [StoryRouter()]

export const ReverseWithRoute = Template.bind({})
ReverseWithRoute.args = {
  reverse: true,
  routeTo: '/signup'
}
ReverseWithRoute.decorators = [StoryRouter()]
ReverseWithRoute.parameters = {
  backgrounds: { default: 'upchieve green' }
}

export const PrimaryNoArrow = Template.bind({})
PrimaryNoArrow.args = {
  primary: true,
  showArrow: false
}

export const PrimaryWithRouteNoArrow = Template.bind({})
PrimaryWithRouteNoArrow.args = {
  primary: true,
  showArrow: false,
  routeTo: '/signup'
}
PrimaryWithRouteNoArrow.decorators = [StoryRouter()]
