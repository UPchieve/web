import { MAX_MOBILE_MODE_WIDTH } from '@/consts'
import sidebar from './sidebar'
import modal from './modal'
import banner from './banner'
import { useAppHeaderStore } from '@/stores/app/header'

export default {
  namespaced: true,
  modules: {
    sidebar,
    modal,
    banner,
  },
  state: {
    windowWidth: 0,
    windowHeight: 0,
    isMobileApp: false,
    isWebPageHidden: false,
    version: '',
    prefersReducedMotion: false,
    isLoading: true,
    fromRoute: '',
    fadeInContent: false,
  },
  mutations: {
    setWindowWidth: (state, width = 0) =>
      (state.windowWidth = Math.max(0, width)),
    setWindowHeight: (state, height = 0) =>
      (state.windowHeight = Math.max(0, height)),
    setIsMobileApp: (state, isMobileApp) => (state.isMobileApp = isMobileApp),
    setVersion: (state, version) => (state.version = version),
    isWebPageHidden: (state, isVisible) => (state.isWebPageHidden = isVisible),
    setPrefersReducedMotion: (state, val) => (state.prefersReducedMotion = val),
    setIsLoading: (state, val) => (state.isLoading = val),
    setFromRoute: (state, route) => (state.fromRoute = route),
    setFadeInContent: (state, val) => (state.fadeInContent = val),
  },
  actions: {
    showNavigation: ({ dispatch }) => {
      useAppHeaderStore().setIsShown(true)
      dispatch('sidebar/show')
    },
    hideNavigation: ({ dispatch }) => {
      useAppHeaderStore().setIsShown(false)
      dispatch('sidebar/hide')
    },

    windowResize: ({ commit }, { width, height }) => {
      commit('setWindowWidth', width)
      commit('setWindowHeight', height)
    },

    checkEnvironment: ({ commit }) => {
      const mobileAppDetectionString = 'upchieve/'
      const isMobileApp =
        navigator.userAgent.indexOf(mobileAppDetectionString) !== -1

      commit('setIsMobileApp', isMobileApp)
    },

    updateWebPageVisibility: ({ commit }, hiddenProperty) => {
      let isHidden = false
      if (document[hiddenProperty]) isHidden = true

      commit('isWebPageHidden', isHidden)
    },
  },
  getters: {
    mobileMode: (state) => state.windowWidth <= MAX_MOBILE_MODE_WIDTH,
    widthLessThanPx: (state) => (px) => {
      return state.windowWidth < px
    },
    isMobileLandscape: (state, getters) =>
      getters.mobileMode && state.windowWidth > state.windowHeight,
    isMobilePortrait: (state, getters) =>
      getters.mobileMode && state.windowWidth < state.windowHeight,
  },
}
