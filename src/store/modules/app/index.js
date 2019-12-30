import { MAX_MOBILE_MODE_WIDTH } from "@/consts";
import header from "./header";
import sidebar from "./sidebar";
import modal from "./modal";

export default {
  namespaced: true,
  modules: {
    header,
    sidebar,
    modal
  },
  state: {
    windowWidth: 0,
    windowHeight: 0,
    pageHidden: false
  },
  mutations: {
    setWindowWidth: (state, width = 0) =>
      (state.windowWidth = Math.max(0, width)),
    setWindowHeight: (state, height = 0) =>
      (state.windowHeight = Math.max(0, height)),
    setPageHidden: (state, hidden = false) => (state.pageHidden = !!hidden)
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

    documentInactive: ({ commit }) => {
      commit("setPageHidden", true);
    },
    documentActive: ({ commit }) => {
      commit("setPageHidden", false);
    }
  },
  getters: {
    mobileMode: state => state.windowWidth <= MAX_MOBILE_MODE_WIDTH
  }
};
