import { shallowMount, createLocalVue } from '@vue/test-utils'
import { merge } from 'lodash'
import Vuex from 'vuex'
import { storeOptions } from '@/store'
import AppHeader from '@/components/App/AppHeader'
import HeaderTemplate from '@/components/App/AppHeader/HeaderTemplate'
import DefaultHeader from '@/components/App/AppHeader/DefaultHeader'
import RejoinSessionHeader from '@/components/App/AppHeader/RejoinSessionHeader'
import BannedStudentHeader from '@/components/App/AppHeader/BannedStudentHeader'
import WaitingPeriodHeader from '@/components/App/AppHeader/WaitingPeriodHeader'

const localVue = createLocalVue()
localVue.use(Vuex)

const getWrapper = (state = {}) => {
  const store = new Vuex.Store(
    merge({}, storeOptions, {
      modules: { app: { modules: { header: { state } } } },
    })
  )

  return shallowMount(AppHeader, { localVue, store })
}

describe('AppHeader', () => {
  it('renders HeaderTemplate', () => {
    const state = { data: {} }
    const wrapper = getWrapper(state)
    const modal = wrapper.findComponent(HeaderTemplate)
    expect(modal.exists()).toBe(true)
  })

  it('renders DefaultHeader', () => {
    const state = { component: 'DefaultHeader', data: {} }
    const wrapper = getWrapper(state).findComponent(HeaderTemplate)
    const modal = wrapper.findComponent(DefaultHeader)
    expect(modal.exists()).toBe(true)
    expect(modal.attributes('header-data')).toBeDefined()
  })

  it('renders RejoinSessionHeader', () => {
    const state = { component: 'RejoinSessionHeader', data: {} }
    const wrapper = getWrapper(state).findComponent(HeaderTemplate)
    const modal = wrapper.findComponent(RejoinSessionHeader)
    expect(modal.exists()).toBe(true)
    expect(modal.attributes('header-data')).toBeDefined()
  })

  it('renders BannedStudentHeader', () => {
    const state = { component: 'BannedStudentHeader', data: {} }
    const wrapper = getWrapper(state).findComponent(HeaderTemplate)
    const modal = wrapper.findComponent(BannedStudentHeader)
    expect(modal.exists()).toBe(true)
    expect(modal.attributes('header-data')).toBeDefined()
  })

  it('renders WaitingPeriodHeader', () => {
    const state = {
      component: 'WaitingPeriodHeader',
      data: { timeLeft: 1000 * 60 * 4 },
    }
    const wrapper = getWrapper(state).findComponent(HeaderTemplate)
    const modal = wrapper.findComponent(WaitingPeriodHeader)
    expect(modal.exists()).toBe(true)
    expect(modal.props().headerData).toEqual(state.data)
  })
})
