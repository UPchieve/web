import { MAX_MOBILE_MODE_WIDTH } from '@/consts'
import header from './header'
import sidebar from './sidebar'
import modal from './modal'
import banner from './banner'
import VersionService from '../../../services/VersionService'

export default {
  namespaced: true,
  modules: {
    header,
    sidebar,
    modal,
    banner
  },
  state: {
    windowWidth: 0,
    windowHeight: 0,
    isMobileApp: false,
    isWebPageHidden: false,
    version: '',
    currentServerVersion: '',
    csrfToken: ''
  },
  mutations: {
    setWindowWidth: (state, width = 0) =>
      (state.windowWidth = Math.max(0, width)),
    setWindowHeight: (state, height = 0) =>
      (state.windowHeight = Math.max(0, height)),
    setIsMobileApp: (state, isMobileApp) => (state.isMobileApp = isMobileApp),
    setVersion: (state, version) => (state.version = version),
    setCurrentServerVersion: (state, version) =>
      (state.currentServerVersion = version),
    isWebPageHidden: (state, isVisible) => (state.isWebPageHidden = isVisible),
    setCsrfToken: (state, csrfToken) => (state.csrfToken = csrfToken)
  },
  actions: {
    showNavigation: ({ dispatch }) => {
      dispatch('header/show')
      dispatch('sidebar/show')
    },
    hideNavigation: ({ dispatch }) => {
      dispatch('header/hide')
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

    getCurrentServerVersion: async ({ commit }) => {
      const version = await VersionService.getCurrentServerVersion()
      commit('setCurrentServerVersion', version)
    },

    updateWebPageVisibility: ({ commit }, hiddenProperty) => {
      let isHidden = false
      if (document[hiddenProperty]) isHidden = true

      commit('isWebPageHidden', isHidden)
    }
  },
  getters: {
    mobileMode: state => state.windowWidth <= MAX_MOBILE_MODE_WIDTH,
    csrfToken: state => state.csrfToken
  }
}