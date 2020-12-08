import { MAX_MOBILE_MODE_WIDTH } from "@/consts";
import header from "./header";
import sidebar from "./sidebar";
import modal from "./modal";
import banner from "./banner";

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
    isWebPageHidden: false
  },
  mutations: {
    setWindowWidth: (state, width = 0) =>
      (state.windowWidth = Math.max(0, width)),
    setWindowHeight: (state, height = 0) =>
      (state.windowHeight = Math.max(0, height)),
    setIsMobileApp: (state, isMobileApp) => (state.isMobileApp = isMobileApp),
    isWebPageHidden: (state, isVisible) => (state.isWebPageHidden = isVisible)
  },
  actions: {
    showNavigation: ({ dispatch }) => {
      dispatch("header/show");
      dispatch("sidebar/show");
    },
    hideNavigation: ({ dispatch }) => {
      dispatch("header/hide");
      dispatch("sidebar/hide");
    },

    windowResize: ({ commit }, { width, height }) => {
      commit("setWindowWidth", width);
      commit("setWindowHeight", height);
    },

    checkEnvironment: ({ commit }) => {
      const mobileAppDetectionString = "upchieve/";
      const isMobileApp =
        navigator.userAgent.indexOf(mobileAppDetectionString) !== -1
          ? true
          : false;

      commit("setIsMobileApp", isMobileApp);
    },

    updateWebPageVisibility: ({ commit }, hiddenProperty) => {
      let isHidden = false;
      if (document[hiddenProperty]) isHidden = true;

      commit("isWebPageHidden", isHidden);
    }
  },
  getters: {
    mobileMode: state => state.windowWidth <= MAX_MOBILE_MODE_WIDTH
  }
};
