import type { RootState } from '@/store'
import type { Component } from 'vue'
import type { ActionContext } from 'vuex'

type AppModalState = {
  component: Component | string | null
  modalTemplateProps: ModalTemplateProps
  componentProps: ComponentProps
  isShown: boolean
}

type AppModalPayload = {
  component?: Component | string
  data?: ModalTemplateProps
  modalTemplateProps?: ModalTemplateProps
  componentProps?: ComponentProps
}

type ModalTemplateProps = any
type ComponentProps = any

export default {
  namespaced: true,
  state: {
    component: null,
    modalTemplateProps: {},
    componentProps: {},
    isShown: false,
  },
  mutations: {
    setComponent: (state: AppModalState, component = null) =>
      (state.component = component),
    setModalTemplateProps: (state: AppModalState, props = {}) =>
      (state.modalTemplateProps = props),
    setIsShown: (state: AppModalState, b: boolean) => (state.isShown = !!b),
    setComponentProps: <T>(state: AppModalState, props: T) =>
      (state.componentProps = props),
  },
  actions: {
    show: (
      { commit }: ActionContext<AppModalState, RootState>,
      payload: AppModalPayload = {}
    ) => {
      commit('setIsShown', true)
      commit('setComponent', payload.component)
      commit('setModalTemplateProps', payload.data)
      commit('setComponentProps', payload.componentProps)
    },
    update: (
      { commit, state }: ActionContext<AppModalState, RootState>,
      payload: AppModalPayload = {}
    ) => {
      commit('setModalTemplateProps', {
        ...state.modalTemplateProps,
        ...(payload.modalTemplateProps ?? {}),
      })
      commit('setComponentProps', {
        ...state.componentProps,
        ...(payload.componentProps ?? {}),
      })
    },
    hide: ({ commit }: ActionContext<AppModalState, RootState>) => {
      commit('setIsShown', false)
      commit('setComponent', null)
      commit('setModalTemplateProps', {})
      commit('setComponentProps', {})
    },
  },
}
