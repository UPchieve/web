import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import userModule from '@/store/modules/user'
import DashboardBanner from '@/views/DashboardView/DashboardBanner.vue'

const getWrapper = (firstName = 'Tester', subheader) => {
  const store = createStore({
    modules: {
      user: {
        ...userModule,
        getters: {
          firstName: () => firstName,
        },
      },
    },
  })

  return shallowMount(DashboardBanner, {
    global: { plugins: [store] },
    props: { subheader },
  })
}

describe('DashboardView', () => {
  test('layout without subheader', () => {
    const wrapper = getWrapper()
    expect(wrapper.classes('DashboardBanner')).toBe(true)

    const greeting = wrapper.find('h1')
    expect(greeting.exists()).toBe(true)
    expect(greeting.text()).toBe('Hello, Tester!')

    const subGreeting = wrapper.find('h2')
    expect(subGreeting.exists()).toBe(false)
  })

  test('layout with subheader', () => {
    const NAME = 'Bob'
    const SUBHEADER = 'This is the subheader'
    const wrapper = getWrapper(NAME, SUBHEADER)
    expect(wrapper.classes('DashboardBanner')).toBe(true)

    const greeting = wrapper.find('h1')
    expect(greeting.exists()).toBe(true)
    expect(greeting.text()).toBe(`Hello, ${NAME}!`)

    const subGreeting = wrapper.find('h2')
    expect(subGreeting.exists()).toBe(true)
    expect(subGreeting.text()).toBe(SUBHEADER)
  })
})
