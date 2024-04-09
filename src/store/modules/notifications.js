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
      state.notifications.splice(idx, 1)
    },
  },
  actions: {
    add({ commit }, notification) {
      commit('add', notification)
    },
    remove({ commit }, notificationId) {
      commit('remove', notificationId)
    },
  },
}
