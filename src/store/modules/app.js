import { MAX_MOBILE_MODE_WIDTH } from "@/consts";

export default {
  namespaced: true,
  state: {
    hideHeader: false,
    hideSidebar: false,
    windowWidth: 0,
    windowHeight: 0
  },
  mutations: {
    setHideHeader: (state, b) => (state.hideHeader = !!b),
    setHideSidebar: (state, b) => (state.hideSidebar = !!b),

    setWindowWidth: (state, width = 0) =>
      (state.windowWidth = Math.max(0, width)),
    setWindowHeight: (state, height = 0) =>
      (state.windowHeight = Math.max(0, height))
  },
  actions: {
    showHeader: ({ commit }) => commit("setHideHeader", false),
    hideHeader: ({ commit }) => commit("setHideHeader", true),

    showSidebar: ({ commit }) => commit("setHideSidebar", false),
    hideSidebar: ({ commit }) => commit("setHideSidebar", true),

    showNavigation: ({ commit }) => {
      commit("setHideHeader", false);
      commit("setHideSidebar", false);
    },
    hideNavigation: ({ commit }) => {
      commit("setHideHeader", true);
      commit("setHideSidebar", true);
    },

    windowResize: ({ commit }, { width, height }) => {
      commit("setWindowWidth", width);
      commit("setWindowHeight", height);
    }
  },
  getters: {
    mobileMode: state => state.windowWidth <= MAX_MOBILE_MODE_WIDTH
  }
};
