export const initialState = () => ({
  hideHeader: false,
  hideSidebar: false
});

export default {
  namespaced: true,
  state: initialState(),
  mutations: {
    setHideHeader: (state, b) => (state.hideHeader = !!b),
    setHideSidebar: (state, b) => (state.hideSidebar = !!b)
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
    }
  }
};
