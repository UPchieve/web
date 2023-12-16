import { shallowMount, createLocalVue } from '@vue/test-utils'
import { merge } from 'lodash'
import Vuex from 'vuex'
import { storeOptions } from '@/store'
import AppHeader from '@/components/App/AppHeader/index.vue'
import HeaderTemplate from '@/components/App/AppHeader/HeaderTemplate.vue'
import DefaultHeader from '@/components/App/AppHeader/DefaultHeader/index.vue'
import RejoinSessionHeader from '@/components/App/AppHeader/RejoinSessionHeader.vue'
import BannedHeader from '@/components/App/AppHeader/BannedHeader.vue'
import WaitingPeriodHeader from '@/components/App/AppHeader/WaitingPeriodHeader.vue'
import VerificationHeader from '@/components/App/AppHeader/VerificationHeader.vue'
import { VERIFICATION_METHOD } from '@/consts'

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
    const modal = wrapper.find(HeaderTemplate)
    expect(modal.exists()).toBe(true)
  })

  it('renders DefaultHeader', () => {
    const state = { component: 'DefaultHeader', data: {} }
    const wrapper = getWrapper(state).find(HeaderTemplate)
    const modal = wrapper.find(DefaultHeader)
    expect(modal.exists()).toBe(true)
    expect(modal.attributes('header-data')).toBeDefined()
  })

  it('renders RejoinSessionHeader', () => {
    const state = { component: 'RejoinSessionHeader', data: {} }
    const wrapper = getWrapper(state).find(HeaderTemplate)
    const modal = wrapper.find(RejoinSessionHeader)
    expect(modal.exists()).toBe(true)
    expect(modal.attributes('header-data')).toBeDefined()
  })

  it('renders BannedHeader', () => {
    const state = { component: 'BannedHeader', data: {} }
    const wrapper = getWrapper(state).find(HeaderTemplate)
    const modal = wrapper.find(BannedHeader)
    expect(modal.exists()).toBe(true)
    expect(modal.attributes('header-data')).toBeDefined()
  })

  it('renders WaitingPeriodHeader', () => {
    const state = {
      component: 'WaitingPeriodHeader',
      data: { timeLeft: 1000 * 60 * 4 },
    }
    const wrapper = getWrapper(state).find(HeaderTemplate)
    const modal = wrapper.find(WaitingPeriodHeader)
    expect(modal.exists()).toBe(true)
    expect(modal.props().headerData).toEqual(state.data)
  })

  it('renders VerificationHeader', () => {
    const state = {
      component: 'VerificationHeader',
      data: {
        verificationMethod: VERIFICATION_METHOD.EMAIL,
        phoneOrEmailToVerify: 'myTestEmail@gmail.com',
      },
    }
    const wrapper = getWrapper(state)
    expect(wrapper.find(VerificationHeader).isVisible()).toBeTruthy()
  })
})
