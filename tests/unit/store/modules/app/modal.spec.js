import modalModule from '@/store/modules/app/modal'
import { vi } from 'vitest'

const { state, mutations, actions } = modalModule

describe('`app/modal` store module', () => {
  it('state', () => {
    expect(state).toEqual({
      component: null,
      modalTemplateProps: {},
      componentProps: {},
      isShown: false,
    })
  })

  describe('mutations', () => {
    it('setComponent', () => {
      expect(typeof mutations.setComponent).toBe('function')
      const state = { component: null }
      const expected = 'component'
      mutations.setComponent(state, expected)
      expect(state.component).toBe(expected)
    })

    it('setModalTemplateProps', () => {
      expect(typeof mutations.setModalTemplateProps).toBe('function')
      const state = { modalTemplateProps: null }
      const expected = {}
      mutations.setModalTemplateProps(state, expected)
      expect(state.modalTemplateProps).toBe(expected)
    })

    it('setIsShown', () => {
      expect(typeof mutations.setIsShown).toBe('function')
      const state = { isShown: false }
      mutations.setIsShown(state, true)
      expect(state.isShown).toBe(true)
    })

    it('setComponentProps', () => {
      expect(typeof mutations.setComponentProps).toBe('function')
      const state = { componentProps: {} }
      mutations.setComponentProps(state, { someProp: 1 })
      expect(state.componentProps).toEqual({ someProp: 1 })
    })
  })

  describe('actions', () => {
    it('show', () => {
      expect(typeof actions.show).toBe('function')
      const commit = vi.fn()
      const payload = {
        component: 'component',
        data: {},
        componentProps: { someProp: 1 },
      }
      actions.show({ commit }, payload)
      expect(commit).toHaveBeenNthCalledWith(1, 'setIsShown', true)
      expect(commit).toHaveBeenNthCalledWith(
        2,
        'setComponent',
        payload.component
      )
      expect(commit).toHaveBeenNthCalledWith(
        3,
        'setModalTemplateProps',
        payload.data
      )
      expect(commit).toHaveBeenNthCalledWith(
        4,
        'setComponentProps',
        payload.componentProps
      )
    })

    it('hide', () => {
      expect(typeof actions.hide).toBe('function')
      const commit = vi.fn()
      actions.hide({ commit })
      expect(commit).toHaveBeenNthCalledWith(1, 'setIsShown', false)
      expect(commit).toHaveBeenNthCalledWith(2, 'setComponent', null)
      expect(commit).toHaveBeenNthCalledWith(3, 'setModalTemplateProps', {})
      expect(commit).toHaveBeenNthCalledWith(4, 'setComponentProps', {})
    })
  })
})
