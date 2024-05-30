import appModule from '@/store/modules/app'
import SubjectSelection from '@/views/DashboardView/StudentDashboard/SubjectSelection/index.vue'
import SubjectCard from '@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectCard.vue'
import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'

const getWrapper = (mobileMode = false) => {
  const store = createStore({
    modules: {
      app: {
        ...appModule,
        getters: {
          mobileMode: () => mobileMode,
        },
      },
      user: { state: { latestSession: {} } },
    },
  })

  return shallowMount(SubjectSelection, { global: { plugins: [store] } })
}

// TODO: create a mock file for subjects we move from using topics.js
describe.skip('SubjectSelection', () => {
  const cards = [
    { title: 'Math Tutoring', topic: 'math' },
    { title: 'Reading and Writing Tutoring', topic: 'readingWriting' },
    { title: 'Science Tutoring', topic: 'science' },
    { title: 'Social Studies', topic: 'socialStudies' },
    { title: 'College Counseling', topic: 'college' },
    { title: 'Standardized Testing Tutoring', topic: 'sat' },
    {
      title: 'Give Feedback',
      subtitle:
        'Help us improve by telling us what new subjects and features you want!',
      buttonText: 'Give feedback',
      routeTo: '/contact',
    },
    {
      title: 'Invite Your Friends',
      subtitle: 'Share UPchieve with a friend!',
      buttonText: 'Learn More',
    },
  ]

  describe('layout', () => {
    test('mobile', () => {
      const wrapper = getWrapper(true)
      expect(wrapper.classes('SubjectSelection')).toBe(true)

      const header = wrapper.find('h2')
      expect(header.exists()).toBe(true)
      expect(header.text()).toBe('Explore our subjects')

      const subjectCards = wrapper.findAllComponents(SubjectCard)
      expect(subjectCards.length).toBe(cards.length)

      cards.forEach((card, i) => {
        for (let key in card)
          expect(subjectCards.at(i).props()[key]).toBe(card[key])
      })
    })

    test('desktop', () => {
      const wrapper = getWrapper(false)
      expect(wrapper.classes('SubjectSelection')).toBe(true)

      const p = wrapper.find('p')
      expect(p.exists()).toBe(false)

      const subjectCards = wrapper.findAllComponents(SubjectCard)
      expect(subjectCards.length).toBe(cards.length)

      cards.forEach((card, i) => {
        for (let key in card)
          expect(subjectCards.at(i).props()[key]).toBe(card[key])
      })
    })
  })
})
