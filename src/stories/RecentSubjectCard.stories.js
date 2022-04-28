import RecentSubjectCard from '../views/DashboardView/StudentDashboard/SubjectSelection/RecentSubjectCard.vue'

export default {
  title: 'Example/RecentSubjectCard',
  component: RecentSubjectCard
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { RecentSubjectCard },
  template: '<recent-subject-card @onClick="handleClick" v-bind="$props" />'
})

//default state
export const DefaultCard = Template.bind({})
DefaultCard.args = {
  title: 'Algebra 1'
}

//hovered state
export const HoveredCard = Template.bind({})
HoveredCard.args = {
  title: 'Algebra 2'
}
HoveredCard.parameters = { pseudo: { hover: true } }

//active state
export const ActiveCard = Template.bind({})
ActiveCard.args = {
  title: 'Calc 1'
}

ActiveCard.parameters = { pseudo: { active: true } }

//disabled state
export const DisabledCard = Template.bind({})
DisabledCard.args = {
  title: 'Calc 2',
  disableSubjectCard: true
}
