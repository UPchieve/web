export default {
  namespaced: true,
  state: {
    notifications: [],
  },
  mutations: {
    add: (state, notification) => {
      state.notifications.push(notification)
    },
    remove: (state, notificationId) => {
      const idx = state.notifications.findIndex(
        ({ id }) => id === notificationId
      )
      if (idx > -1) {
        state.notifications.splice(idx, 1)
      }
    },
    clear: (state) => {
      state.notifications = []
    },
    updateTitle: (state, { notificationId, title }) => {
      const idx = state.notifications.findIndex(
        ({ id }) => id === notificationId
      )
      state.notifications[idx].title = title
    },
  },
  actions: {
    add({ commit }, notification) {
      commit('add', notification)
    },
    remove({ commit }, notificationId) {
      commit('remove', notificationId)
    },
    clear({ commit }) {
      commit('clear')
    },
    updateTitle({ commit }, { notificationId, title }) {
      commit('updateTitle', { notificationId, title })
    },
  },
}
