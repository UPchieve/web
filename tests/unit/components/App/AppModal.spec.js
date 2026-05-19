import { mount } from '@vue/test-utils'
import { merge } from 'lodash-es'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import AppModal from '@/components/App/AppModal/index.vue'
import ModalTemplate from '@/components/App/AppModal/ModalTemplate.vue'
import SubjectSelectionModal from '@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectSelectionModal.vue'
import { afterEach } from 'vitest'

const getWrapper = async (state = {}) => {
  state = { component: null, modalTemplateProps: {}, ...state }

  const store = createStore(
    merge({}, storeOptions, {
      attachTo: window.document.body,
      modules: {
        app: {
          modules: { modal: { state } },
          getters: { mobileMode: () => false },
        },
      },
    })
  )

  return mount(AppModal, {
    attachTo: window.document.body,
    global: { plugins: [store] },
  })
}

describe('AppModal', () => {
  let wrapper
  afterEach(() => {
    if (wrapper) {
      wrapper?.unmount()
    }
  })
  it('renders ModalTemplate', async () => {
    const state = {
      modalTemplateProps: { backText: 'Back', acceptText: 'Okay' },
    }
    wrapper = await getWrapper(state)
    const modal = wrapper.findComponent(ModalTemplate)
    expect(modal.exists()).toBe(true)
    expect(modal.props().backText).toEqual(state.modalTemplateProps.backText)
    expect(modal.props().acceptText).toEqual(
      state.modalTemplateProps.acceptText
    )
  })

  it('renders SubjectSelectionModal', async () => {
    const state = { component: 'SubjectSelectionModal', modalTemplateProps: {} }
    wrapper = await getWrapper(state)
    wrapper.findComponent(ModalTemplate)
    const modal = wrapper.findComponent(SubjectSelectionModal)
    expect(modal.exists()).toBe(true)
    expect(modal.props().modalData).toEqual(state.modalTemplateProps)
  })
})
