import { RouterLinkStub, shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import DefaultHeader from '@/components/App/AppHeader/DefaultHeader.vue'

const getWrapper = (mobileMode = false) => {
  const store = createStore({
    modules: {
      app: { getters: { mobileMode: () => mobileMode } },
    },
  })

  return shallowMount(DefaultHeader, {
    global: {
      plugins: [store],
      stubs: {
        RouterLink: RouterLinkStub,
      },
    },
  })
}

test('renders the UPchieve logo in mobileMode', () => {
  const wrapper = getWrapper(true)
  expect(wrapper.classes()).toEqual(['DefaultHeader'])

  const logo = wrapper.find('.DefaultHeader-logo')
  expect(logo.exists()).toBe(true)
  expect(logo.element.tagName).toBe('IMG')
  expect(logo.attributes('src')).toBeDefined()
})

it('renders the UPchieve logo when not in mobileMode', () => {
  const wrapper = getWrapper()
  const logo = wrapper.find('.DefaultHeader-logo')
  expect(logo.exists()).toBe(true)
  expect(logo.element.tagName).toBe('IMG')
  expect(logo.attributes('src')).toBeDefined()
})
