import { MAX_MOBILE_MODE_WIDTH } from "@/consts";

export default {
  namespaced: true,
  state: {
    hideHeader: false,
    hideSidebar: false,
    isSidebarCollapsed: true,

    modalType: null,
    modalData: null,
    isModalShown: false,

    windowWidth: 0,
    windowHeight: 0
  },
  mutations: {
    setHideHeader: (state, b) => (state.hideHeader = !!b),
    setHideSidebar: (state, b) => (state.hideSidebar = !!b),
    setIsSidebarCollapsed: (state, b) => (state.isSidebarCollapsed = !!b),

    setModalType: (state, modalType = null) => (state.modalType = modalType),
    setModalData: (state, modalData = null) => (state.modalData = modalData),
    setIsModalShown: (state, b) => (state.isModalShown = !!b),

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

    collapseSidebar: ({ commit }) => commit("setIsSidebarCollapsed", true),
    expandSidebar: ({ commit }) => commit("setIsSidebarCollapsed", false),

    showModal: ({ commit }, data) => {
      commit("setIsModalShown", true);
      commit("setModalType", data.modalType);
      commit("setModalData", data.modalData);
    },
    hideModal: ({ commit }) => {
      commit("setIsModalShown", false);
      commit("setModalType", null);
      commit("setModalData", null);
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
