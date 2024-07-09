import { shallowMount } from '@vue/test-utils'
import RecentSubjectCard from '../../../src/views/DashboardView/StudentDashboard/SubjectSelection/RecentSubjectCard.vue'

const subject = {
  id: 2,
  displayName: 'Algebra 1',
  topicIconLink: 'https://path.com/to/images/math.svg',
}

describe('RecentSubjectCard', () => {
  it('renders subject card with subject data', () => {
    const wrapper = shallowMount(RecentSubjectCard, {
      props: {
        subject,
        disabled: false,
      },
    })

    expect(wrapper.findComponent(RecentSubjectCard))
    expect(wrapper.find('.subject-card').exists()).toBe(true)
    expect(wrapper.find('.subject-card-title').text()).toBe('Algebra 1')
  })

  it('emits clicked event to parent', async () => {
    const wrapper = shallowMount(RecentSubjectCard, {
      props: {
        subject,
        disabled: false,
      },
    })

    await wrapper.find('.subject-card').trigger('click')
    expect(wrapper.emitted('subject-clicked')).toBeTruthy()
  })
})
