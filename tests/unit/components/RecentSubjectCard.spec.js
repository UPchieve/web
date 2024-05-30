import { shallowMount } from '@vue/test-utils'

import RecentSubjectCard from '../../../src/views/DashboardView/StudentDashboard/SubjectSelection/RecentSubjectCard.vue'

//import ArrowIcon from '../../../src/assets/arrow.svg';

//👇 Imports a specific story for the test
import {
  DefaultCard,
  HoveredCard,
  ActiveCard,
  DisabledCard,
} from '../../../src/stories/RecentSubjectCard.stories'

describe('RecentSubjectCard', () => {
  it('renders recent subject card in default state', () => {
    const wrapper = shallowMount(RecentSubjectCard, {
      props: DefaultCard.args,
    })

    expect(wrapper.findComponent(RecentSubjectCard))
    expect(wrapper.props('title')).toBe('Algebra 1')
    expect(wrapper.props('disableSubjectCard')).toBe(false)
    expect(wrapper.find('.SubjectCard').exists()).toBe(true)

    /* SVGs not rendered in tests. Refer to README.md here for further explanation: https://gitlab.com/upchieve/subway
    expect(wrapper.contains('ArrowIcon')).toBe(true);
    const arrow = wrapper.find('ArrowIcon');
    expect(arrow.exists()).toBe(true);
    expect(arrow.isVisible()).toBe(true);
    expect(wrapper.find('svg')).toBe('MathSVG');
    */
  })

  //
  it('renders the recent subject card in the hovered state', () => {
    const wrapper = shallowMount(RecentSubjectCard, {
      props: HoveredCard.args,
    })

    expect(wrapper.props('title')).toBe('Algebra 2')
    expect(wrapper.props('disableSubjectCard')).toBe(false)
  })

  //unable to test SVGs and classes on SVG elements
  it('renders the recent subject card in the active state', () => {
    const wrapper = shallowMount(RecentSubjectCard, {
      props: ActiveCard.args,
    })

    expect(wrapper.props('title')).toBe('Calc 1')
    expect(wrapper.props('disableSubjectCard')).toBe(false)
  })

  //test for disabled recent subject card
  it('renders the recent subject card in the disabled state', () => {
    const wrapper = shallowMount(RecentSubjectCard, {
      props: DisabledCard.args,
    })

    expect(wrapper.props('title')).toBe('Calc 2')
    expect(wrapper.props('disableSubjectCard')).toBe(true)
  })
})
