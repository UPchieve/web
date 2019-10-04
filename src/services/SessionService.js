import NetworkService from "./NetworkService";
import UserService from "./UserService";
import AnalyticsService from "./AnalyticsService";

export default {
  loading: false,
  currentSession: {
    sessionId: null,
    data: {}
  },

  getPartner() {
    return UserService.getUser().then(user => {
      const session = this.currentSession.data || {};

      if (user.isVolunteer) {
        return session.student;
      }
      return session.volunteer;
    });
  },

  endSession(context, sessionId) {
    return NetworkService.endSession(context, { sessionId }).then(() => {
      context.$store.dispatch("user/clearSession");

      // analytics: track when a help session has ended
      AnalyticsService.trackSessionEnded(
        context,
        this.currentSession.data,
        context.$store.state.user.isFakeUser
      );

      this.currentSession.sessionId = null;
      this.currentSession.data = {};
    });
  },

  newSession(context, sessionType, sessionSubTopic) {
    return NetworkService.newSession(context, {
      sessionType,
      sessionSubTopic
    }).then(res => {
      const data = res.data || {};
      const { sessionId } = data;

      this.currentSession.sessionId = sessionId;

      if (sessionId) {
        const sessionData = {
          type: sessionType,
          subTopic: sessionSubTopic,
          _id: sessionId
        };
        context.$store.dispatch("user/updateSession", sessionData);
        context.$router.replace(context.$store.getters["user/sessionPath"]);
      } else {
        context.$router.replace("/");
      }
      // analytics: track when a session has started
      AnalyticsService.trackSessionStarted(
        context,
        this.currentSession,
        sessionType,
        sessionSubTopic,
        context.$store.state.user.isFakeUser
      );

      return sessionId;
    });
  },

  useExistingSession(context, sessionId) {
    return NetworkService.checkSession(context, { sessionId }).then(res => {
      const data = res.data || {};
      const { sessionId } = data;

      this.currentSession.sessionId = sessionId;

      if (!sessionId) {
        context.$router.replace("/");
      }

      return sessionId;
    });
  },

  getCurrentSession(context, user) {
    return NetworkService.currentSession(context, {
      user_id: user._id,
      is_volunteer: user.isVolunteer
    }).then(resp => {
      if (resp.data.err) {
        this.currentSession.sessionId = null;
        this.currentSession.data = {};

        return Promise.reject(resp.data.err);
      }

      const { sessionId, data } = resp.data || {};
      const { type, subTopic } = data;

      if (type && subTopic && sessionId) {
        this.currentSession.sessionId = sessionId;
        this.currentSession.data = data;

        return Promise.resolve({ sessionData: data });
      }
    });
  }
};
