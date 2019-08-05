export const initialState = () => ({
  hideHeader: false,
  hideSidebar: false
});

export default {
  namespaced: true,
  state: initialState(),
  mutations: {
    setHideHeader: (state, b = true) => (state.hideHeader = b),
    setHideSidebar: (state, b = true) => (state.hideSidebar = b)
  },
  actions: {
    showHeader: ({ commit }) => commit("setHideHeader", false),
    hideHeader: ({ commit }) => commit("setHideHeader"),

    showSidebar: ({ commit }) => commit("setHideSidebar", false),
    hideSidebar: ({ commit }) => commit("setHideSidebar"),

    showNavigation: ({ commit }) => {
      commit("setHideHeader", false);
      commit("setHideSidebar", false);
    },
    hideNavigation: ({ commit }) => {
      commit("setHideHeader");
      commit("setHideSidebar");
    }
  }
};
