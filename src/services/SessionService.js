import router from "@/router";

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
      return UserService.getUser(context).then(user => {
        context.$store.dispatch("user/clearSession");

        // analytics: track when a help session has ended
        AnalyticsService.trackSessionEnded(
          this.currentSession.data,
          user.isFakeUser
        );

        this.currentSession.sessionId = null;
        this.currentSession.data = {};
      });
    });
  },

  newSession(context, sessionType, sessionSubTopic) {
    return NetworkService.newSession(context, {
      sessionType,
      sessionSubTopic
    }).then(res => {
      return UserService.getUser(context).then(user => {
        const data = res.data || {};
        const { sessionId } = data;

        this.currentSession.sessionId = sessionId;

        if (sessionId) {
          const sessionData = { type: sessionType, subTopic: sessionSubTopic, _id: sessionId };
          context.$store.dispatch("user/updateSession", sessionData);
          router.replace(context.$store.state.user.sessionPath);
        } else {
          router.replace("/");
        }
        // analytics: track when a session has started
        AnalyticsService.trackSessionStarted(
          this.currentSession,
          sessionType,
          sessionSubTopic,
          user.isFakeUser
        );

        return sessionId;
      });
    });
  },

  useExistingSession(context, sessionId) {
    return NetworkService.checkSession(context, { sessionId }).then(res => {
      const data = res.data || {};
      const { sessionId } = data;

      this.currentSession.sessionId = sessionId;

      if (!sessionId) {
        router.replace("/");
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

        const path = `/session/${type}/${subTopic}/${sessionId}`;
        return Promise.resolve({ sessionPath: path, sessionData: data });
      }
    });
  }
};
