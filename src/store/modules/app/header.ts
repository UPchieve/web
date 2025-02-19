import type { Component } from 'vue'
import type { ActionContext } from 'vuex'
import type { RootState } from '@/store/index'

export type HeaderState = {
  component: Component | null
  data: Object
  isShown: boolean
}

export default {
  namespaced: true,
  state: {
    component: null,
    data: {},
    isShown: false,
  } as HeaderState,
  mutations: {
    setComponent: (state: HeaderState, component = null) =>
      (state.component = component),
    setData: (state: HeaderState, data = {}) => (state.data = data),
    setIsShown: (state: HeaderState, b: boolean) => (state.isShown = !!b),
  },
  actions: {
    show: (
      { commit }: ActionContext<HeaderState, RootState>,
      payload = { component: null, data: {} }
    ) => {
      commit('setComponent', payload.component)
      commit('setData', payload.data)
      commit('setIsShown', true)
    },
    hide: ({ commit }: ActionContext<HeaderState, RootState>) => {
      commit('setIsShown', false)
      commit('setComponent', null)
      commit('setData', {})
    },
  },
}
