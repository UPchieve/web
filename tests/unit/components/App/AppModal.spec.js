import { mount } from '@vue/test-utils'
import { merge } from 'lodash-es'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import AppModal from '@/components/App/AppModal/index.vue'
import ModalTemplate from '@/components/App/AppModal/ModalTemplate.vue'
import SubjectSelectionModal from '@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectSelectionModal.vue'

const getWrapper = (state = {}) => {
  state = { component: null, data: {}, ...state }

  const store = createStore(
    merge({}, storeOptions, {
      modules: {
        app: {
          modules: { modal: { state } },
          getters: { mobileMode: () => false },
        },
      },
    })
  )

  return mount(AppModal, { global: { plugins: [store] } })
}

describe('AppModal', () => {
  it('renders ModalTemplate', () => {
    const state = { data: { backText: 'Back', acceptText: 'Okay' } }
    const wrapper = getWrapper(state)
    const modal = wrapper.findComponent(ModalTemplate)
    expect(modal.exists()).toBe(true)
    expect(modal.props().backText).toEqual(state.data.backText)
    expect(modal.props().acceptText).toEqual(state.data.acceptText)
  })

  it('renders SubjectSelectionModal', () => {
    const state = { component: 'SubjectSelectionModal', data: {} }
    const wrapper = getWrapper(state).findComponent(ModalTemplate)
    const modal = wrapper.findComponent(SubjectSelectionModal)
    expect(modal.exists()).toBe(true)
    expect(modal.props().modalData).toEqual(state.data)
  })
})
