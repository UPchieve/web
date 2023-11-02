import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import SubjectCard from '@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectCard.vue'

const localVue = createLocalVue()
localVue.use(Vuex)

function getWrapper(propsData) {
  return shallowMount(SubjectCard, { localVue, propsData })
}

describe('SubjectCard', () => {
  const propsData = {
    title: 'Test Subject',
    subtitle: 'Fake subtitle.',
    svg: {},
    subtopics: ['Subject 1', 'Subject 2', 'Subject 3'],
  }

  test('layout', () => {
    const wrapper = getWrapper(propsData)
    expect(wrapper.classes('subject-card')).toBe(true)

    const icon = wrapper.find('.icon')
    expect(icon.exists()).toBe(true)

    const title = wrapper.find('.title')
    expect(title.exists()).toBe(true)
    expect(title.text()).toBe(propsData.title)

    const metadata = wrapper.find('.metadata')
    expect(metadata.exists()).toBe(true)
    expect(metadata.text()).toBe('3 Subjects')
  })
})
