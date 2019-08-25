import UserService from "@/services/UserService";
import SessionService from "@/services/SessionService";
import StudentAvatarUrl from "@/assets/defaultavatar3.png";
import VolunteerAvatarUrl from "@/assets/defaultavatar4.png";

export default {
  namespaced: true,
  state: {
    user: {},
    sessionPath: null
  },
  mutations: {
    setUser: (state, user = {}) => (state.user = user),
    setSessionPath: (state, path = null) => (state.sessionPath = path)
  },
  actions: {
    fetch: ({ dispatch }, context) => {
      dispatch("fetchUser");
      dispatch("fetchSessionPath", context);
    },

    fetchUser: ({ commit }) => {
      const user = UserService.getUser();
      commit("setUser", user);
    },

    fetchSessionPath: ({ commit, state }, context) => {
      SessionService.getCurrentSession(context, state.user)
        .then(path => commit("setSessionPath", path))
        .catch(() => commit("setSessionPath", null));
    }
  },
  getters: {
    avatarUrl: state =>
      state.user.picture ||
      (state.user.isVolunteer ? VolunteerAvatarUrl : StudentAvatarUrl),

    firstName: state =>
      state.user.firstname ||
      (state.user.isVolunteer ? "Volunteer" : "Student"),
    lastName: state => state.user.lastname,
    fullName: (state, getters) =>
      [getters.firstName, getters.lastName].join(" "),

    isVolunteer: state => state.user.isVolunteer,
    isAdmin: state => state.user.isAdmin
  }
};
