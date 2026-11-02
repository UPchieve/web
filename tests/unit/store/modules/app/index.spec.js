import appModule from '@/store/modules/app'
import { useAppHeaderStore } from '@/stores/app/header'
import { useAppSidebarStore } from '@/stores/app/sidebar'
import { beforeEach, vi } from 'vitest'

const { state, mutations, actions } = appModule

describe('`app` store module', () => {
  beforeEach(() => {
    useAppHeaderStore().setIsShown(false)
  })

  it('state', () => {
    expect(state).toEqual({
      fromRoute: '',
      isLoading: true,
      windowWidth: 0,
      windowHeight: 0,
      isMobileMode: false,
      isMobileApp: false,
      isWebPageHidden: false,
      version: '',
      prefersReducedMotion: false,
      fadeInContent: false,
    })
  })

  describe('mutations', () => {
    it('setWindowWidth', () => {
      expect(typeof mutations.setWindowWidth).toBe('function')
      const state = { windowWidth: 0 }

      mutations.setWindowWidth(state, 100)
      expect(state.windowWidth).toBe(100)

      mutations.setWindowWidth(state, -100)
      expect(state.windowWidth).toBe(0)
    })
    it('setWindowHeight', () => {
      expect(typeof mutations.setWindowHeight).toBe('function')
      const state = { windowHeight: 0 }

      mutations.setWindowHeight(state, 100)
      expect(state.windowHeight).toBe(100)

      mutations.setWindowHeight(state, -100)
      expect(state.windowHeight).toBe(0)
    })
  })

  describe('actions', () => {
    it('showNavigation', () => {
      expect(typeof actions.showNavigation).toBe('function')
      actions.showNavigation()
      expect(useAppHeaderStore().isShown).toBe(true)
      expect(useAppSidebarStore().isShown).toBe(true)
    })

    it('hideNavigation', () => {
      expect(typeof actions.hideNavigation).toBe('function')
      useAppHeaderStore().setIsShown(true)
      useAppSidebarStore().show()
      actions.hideNavigation()
      expect(useAppHeaderStore().isShown).toBe(false)
      expect(useAppSidebarStore().isShown).toBe(false)
    })

    it('windowResize', () => {
      expect(typeof actions.windowResize).toBe('function')
      const commit = vi.fn()
      const width = 800
      const height = 600
      actions.windowResize({ commit }, { width, height })
      expect(commit).toHaveBeenNthCalledWith(1, 'setWindowWidth', width)
      expect(commit).toHaveBeenNthCalledWith(2, 'setWindowHeight', height)
    })
  })
})
