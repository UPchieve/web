import Stepper from '../components/Stepper'

export default {
  title: 'Components/Stepper',
  component: Stepper,
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { Stepper },
  template: '<stepper v-bind="$props" />',
})

export const Vanilla = Template.bind({})
Vanilla.args = {
  currentStep: 0,
  totalSteps: 5,
}

export const NoStepsCompleted = Template.bind({})
NoStepsCompleted.args = {
  currentStep: 1,
  totalSteps: 5,
}

export const InProgress = Template.bind({})
InProgress.args = {
  currentStep: 3,
  totalSteps: 5,
}

export const AllStepsCompleted = Template.bind({})
AllStepsCompleted.args = {
  currentStep: 6,
  totalSteps: 5,
}
