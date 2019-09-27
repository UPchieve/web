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
      dispatch("fetchSession", context);
    },

    fetchUser: ({ commit }) => {
      return UserService.getUser().then(user => commit("setUser", user));
    },

    fetchSession: ({ commit, state }, context) => {
      SessionService.getCurrentSession(context, state.user)
        .then(({ sessionPath, sessionData }) => {
          commit("setSessionPath", sessionPath);
          commit("setSession", sessionData);
        })
        .catch(() => {
          commit("setSessionPath", null);
          commit("setSession", {});
        });
    },

    updateSession: ({ commit }, sessionData) => {
      const { type, subTopic, _id } = sessionData;
      const sessionPath = `/session/${type}/${subTopic}/${_id}`;

      commit("setSessionPath", sessionPath);
      commit("setSession", sessionData);
    },

    clearSession: ({ commit }) => {
      commit("setSessionPath", null);
      commit("setSession", {});
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

    isAuthenticated: state => !!(state.user && state.user._id),

    sessionPartner: (state, getters) => {
      if (
        typeof state.session.volunteer !== "object" ||
        typeof state.session.student !== "object"
      ) {
        return {};
      }

      if (getters.isVolunteer) {
        return state.session.student;
      } else {
        return state.session.volunteer;
      }
    },

    isSessionAlive: state => {
      // Early exit if the session doesn't exist
      if (!state.session.createdAt) {
        return false;
      }

      // True if the session hasn't ended
      return !state.session.endedAt;
    },

    isSessionWaitingForVolunteer: state => {
      // Early exit if the session doesn't exist
      if (!state.session.createdAt) {
        return false;
      }

      // True if volunteer hasn't joined
      return !state.session.volunteerJoinedAt;
    },

    isSessionInProgress: state => {
      // Early exit if the session doesn't exist
      if (!state.session.createdAt) {
        return false;
      }

      // True if volunteer has joined and the session hasn't ended
      return !!state.session.volunteerJoinedAt && !state.session.endedAt;
    },

    isSessionOver: state => {
      // Early exit if the session doesn't exist
      if (!state.session.createdAt) {
        return false;
      }

      // True if the session has ended
      return !!state.session.endedAt;
    }
  }
};
