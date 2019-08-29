import UserService from "@/services/UserService";
import SessionService from "@/services/SessionService";
import StudentAvatarUrl from "@/assets/defaultavatar3.png";
import VolunteerAvatarUrl from "@/assets/defaultavatar4.png";

export default {
  namespaced: true,
  state: {
    user: {},
    sessionPath: null,
    session: {}
  },
  mutations: {
    setUser: (state, user = {}) => (state.user = user),
    setSessionPath: (state, path = null) => (state.sessionPath = path),
    setSession: (state, session = {}) => (state.session = session)
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
    },

    fetchSession: ({ commit }) => {
      commit("setSession", SessionService.currentSession.data);
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
    isAdmin: state => state.user.isAdmin,

    sessionPartner: state => {
      if (
        typeof state.session.volunteer !== "object" ||
        typeof state.session.student !== "object"
      ) {
        return {};
      }

      if (state.isVolunteer) {
        return state.session.student;
      } else {
        return state.session.volunteer;
      }
    }
  }
};
