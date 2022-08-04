import { shallowMount, createLocalVue } from '@vue/test-utils'
import { merge } from 'lodash'
import Vuex from 'vuex'
import { storeOptions } from '@/store'
import SubjectCard from '@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectCard'
import HyperlinkButton from '@/components/HyperlinkButton'
import LargeButton from '@/components/LargeButton'

const localVue = createLocalVue()
localVue.use(Vuex)

const getWrapper = (mobileMode = false, propsData) => {
  const store = new Vuex.Store(
    merge({}, storeOptions, {
      modules: {
        app: {
          getters: {
            mobileMode: () => mobileMode,
          },
        },
        user: {
          getters: {
            isSessionAlive: () => false,
          },
        },
        featureFlags: {
          getters: {
            isSessionHistoryActive: () => true,
            isCoachFavoritingActive: () => true,
            isReferFriendsActive: () => false,
          },
        },
      },
    })
  )

  return shallowMount(SubjectCard, { localVue, store, propsData })
}

describe('SubjectCard', () => {
  describe('layout', () => {
    const propsData = {
      title: 'Test Subject',
      subtitle: 'Fake subtitle.',
      svg: {},
      subtopics: ['Subject 1', 'Subject 2', 'Subject 3'],
      buttonText: 'Test Button',
    }

    describe('mobile', () => {
      test('layout', () => {
        const wrapper = getWrapper(true, propsData)
        expect(wrapper.classes('SubjectCard')).toBe(true)

        // const icon = wrapper.findComponent('.SubjectCard-icon')
        // expect(icon.contains(propsData.svg)).toBe(true)

        const title = wrapper.findComponent('.SubjectCard-title')
        expect(title.exists()).toBe(true)
        expect(title.text()).toBe(propsData.title)

        const subtitle = wrapper.findComponent('.SubjectCard-subtitle')
        expect(subtitle.exists()).toBe(false)
      })

      test('link button', () => {
        const wrapper = getWrapper(true, propsData)

        // No `routeTo`
        wrapper.setProps({ routeTo: null })

        const button = wrapper.findComponent(HyperlinkButton)
        expect(button.exists()).toBe(true)
        expect(button.text()).toBe(propsData.buttonText)
        expect(button.props().routeTo).toBeUndefined()
        button.trigger('click')

        // With `routeTo`
        wrapper.setProps({ routeTo: '/test' })

        const routeButton = wrapper.findComponent(HyperlinkButton)
        expect(routeButton.exists()).toBe(true)
        expect(routeButton.text()).toBe(propsData.buttonText)
        expect(routeButton.props().routeTo).toBe('/test')
      })
    })

    describe('desktop', () => {
      test('layout', () => {
        const wrapper = getWrapper(false, propsData)
        expect(wrapper.classes('SubjectCard')).toBe(true)

        // const icon = wrapper.findComponent('.SubjectCard-icon')
        // expect(icon.contains(propsData.svg)).toBe(true)

        const title = wrapper.findComponent('.SubjectCard-title')
        expect(title.exists()).toBe(true)
        expect(title.text()).toBe(propsData.title)

        const subtitle = wrapper.findComponent('.SubjectCard-subtitle')
        expect(subtitle.exists()).toBe(true)
        expect(subtitle.text()).toBe(propsData.subtitle)
      })

      test('link button', () => {
        const wrapper = getWrapper(false, propsData)

        // No `routeTo`
        wrapper.setProps({ routeTo: null })

        const button = wrapper.findComponent(LargeButton)
        expect(button.exists()).toBe(true)
        expect(button.text()).toBe(propsData.buttonText)
        expect(button.props().routeTo).toBeUndefined()
        button.trigger('click')

        // With `routeTo`
        wrapper.setProps({ routeTo: '/test' })

        const routeButton = wrapper.findComponent(HyperlinkButton)
        expect(routeButton.exists()).toBe(true)
        expect(routeButton.text()).toBe(propsData.buttonText)
        expect(routeButton.props().routeTo).toBe('/test')
        routeButton.trigger('click')
      })
    })
  })
})
