import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import userModule from '@/store/modules/user'
import DashboardBanner from '@/views/DashboardView/DashboardBanner.vue'

const localVue = createLocalVue()
localVue.use(Vuex)

function getWrapper(subheader, firstName = 'Tester') {
  const store = new Vuex.Store({
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
    localVue,
    store,
    propsData: {
      subheader,
    },
  })
}

describe('DashboardBanner', () => {
  test('layout without subheader', () => {
    const wrapper = getWrapper()
    expect(wrapper.classes('DashboardBanner')).toBe(true)

    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toBe('Hello, Tester!')

    const h2 = wrapper.find('h2')
    expect(h2.exists()).toBe(false)
  })

  test('layout subheader', () => {
    const subheader = 'This is the subheader'
    const wrapper = getWrapper(subheader)
    expect(wrapper.classes('DashboardBanner')).toBe(true)

    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toBe('Hello, Tester!')

    const h2 = wrapper.find('h2')
    expect(h2.exists()).toBe(true)
    expect(h2.text()).toBe(subheader)
  })
})
