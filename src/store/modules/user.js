import UserService from "@/services/UserService";
import SessionService from "@/services/SessionService";
import StudentAvatarUrl from "@/assets/defaultavatar3.png";
import VolunteerAvatarUrl from "@/assets/defaultavatar4.png";

export default {
  namespaced: true,
  state: {
    user: {},
    session: {}
  },
  mutations: {
    setUser: (state, user = {}) => (state.user = user),
    setSession: (state, session = {}) => (state.session = session),
    addMessage: (state, message) => {
      if (message) state.session.messages.push(message);
    }
  },
  actions: {
    fetch: ({ dispatch }, context) => {
      dispatch("fetchUser");
      dispatch("fetchSession", context);
    },

    fetchUser: ({ commit }) => {
      return UserService.getUser().then(user => commit("setUser", user));
    },

    clearUser: ({ commit }) => {
      commit("setUser", {});
    },

    fetchSession: ({ commit, state }, context) => {
      SessionService.getCurrentSession(context, state.user)
        .then(({ sessionData }) => {
          commit("setSession", sessionData);
        })
        .catch(() => {
          commit("setSession", {});
        });
    },

    updateSession: ({ commit }, sessionData) => {
      commit("setSession", sessionData);
    },

    addMessage: ({ commit }, message) => {
      commit("addMessage", message);
    },

    clearSession: ({ commit }) => {
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

    isEmailVerified: state => state.user.verified,

    sessionPath: state => {
      const { type, subTopic, _id } = state.session;
      const path = `/session/${type}/${subTopic}/${_id}`;

      return path;
    },

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
