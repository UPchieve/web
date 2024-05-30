import { mount } from '@vue/test-utils'
import { merge } from 'lodash-es'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import SubjectCard from '@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectCard.vue'
import HyperlinkButton from '@/components/HyperlinkButton.vue'
import LargeButton from '@/components/LargeButton.vue'
import { vi } from 'vitest'
// import TestIcon from "@/assets/sidebar_icons/house.svg";

const getWrapper = (mobileMode = false, props) => {
  const store = createStore(
    merge({}, storeOptions, {
      modules: { app: { getters: { mobileMode: () => mobileMode } } },
    })
  )

  return mount(SubjectCard, {
    global: { plugins: [store] },
    slots: { default: props.buttonText },
    props,
  })
}

describe('SubjectCard', () => {
  describe('layout', () => {
    const props = {
      title: 'Test Subject',
      subtitle: 'Fake subtitle.',
      svg: {},
      subtopics: ['Subject 1', 'Subject 2', 'Subject 3'],
      buttonText: 'Test Button',
    }

    describe('mobile', () => {
      test('layout', () => {
        const wrapper = getWrapper(true, props)
        expect(wrapper.classes('SubjectCard')).toBe(true)

        // const icon = wrapper.find(".SubjectCard-icon");
        // expect(icon.contains(props.svg)).toBe(true);

        const title = wrapper.find('.SubjectCard-title')
        expect(title.exists()).toBe(true)
        expect(title.text()).toBe(props.title)

        const subtitle = wrapper.find('.SubjectCard-subtitle')
        expect(subtitle.exists()).toBe(false)
      })

      test('link button', async () => {
        const wrapper = getWrapper(true, props)

        await wrapper.setProps({ routeTo: null })

        const button = wrapper.findComponent(HyperlinkButton)
        expect(button.exists()).toBe(true)
        expect(button.text()).toBe(props.buttonText)
        expect(button.props().routeTo).toBeUndefined()

        await wrapper.setProps({ routeTo: '/test' })
        const routeButton = wrapper.findComponent(HyperlinkButton)
        expect(routeButton.exists()).toBe(true)
        expect(routeButton.text()).toBe(props.buttonText)
        expect(routeButton.props().routeTo).toBe('/test')
      })
    })

    describe('desktop', () => {
      test('layout', () => {
        const wrapper = getWrapper(false, props)
        expect(wrapper.classes('SubjectCard')).toBe(true)

        const title = wrapper.find('.SubjectCard-title')
        expect(title.exists()).toBe(true)
        expect(title.text()).toBe(props.title)

        const subtitle = wrapper.find('.SubjectCard-subtitle')
        expect(subtitle.exists()).toBe(true)
        expect(subtitle.text()).toBe(props.subtitle)
      })

      test('link button', async () => {
        const wrapper = getWrapper(false, props)

        // No `routeTo`
        wrapper.setProps({ routeTo: null })

        const button = wrapper.findComponent(LargeButton)
        expect(button.exists()).toBe(true)
        expect(button.text()).toBe(props.buttonText)
        expect(button.props().routeTo).toBeUndefined()

        // With `routeTo`
        await wrapper.setProps({ routeTo: '/test' })

        const routeButton = wrapper.findComponent(HyperlinkButton)
        expect(routeButton.exists()).toBe(true)
        expect(routeButton.text()).toBe(props.buttonText)
        expect(routeButton.props().routeTo).toBe('/test')
        routeButton.trigger('click')
      })
    })
  })
})
