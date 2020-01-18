import NetworkService from "./NetworkService";
import AnalyticsService from "./AnalyticsService";

import errorFromHttpResponse from "../utils/error-from-http-response.js";

export default {
  loading: false,
  currentSession: {
    sessionId: null,
    data: {}
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
    return NetworkService.checkSession(context, { sessionId })
      .then(res => {
        const data = res.data || {};
        const { sessionId } = data;

        this.currentSession.sessionId = sessionId;

        return sessionId;
      })
      .catch(res => {
        if (res.status === 404) {
          context.$router.replace("/");
        } else {
          throw res;
        }
      });
  },

  getCurrentSession(context, user) {
    return NetworkService.currentSession(context, {
      user_id: user._id,
      is_volunteer: user.isVolunteer
    })
      .then(resp => {
        const { sessionId, data } = resp.data || {};
        const { type, subTopic } = data;

        if (type && subTopic && sessionId) {
          this.currentSession.sessionId = sessionId;
          this.currentSession.data = data;

          return Promise.resolve({ sessionData: data });
        }
      })
      .catch(resp => {
        this.currentSession.sessionId = null;
        this.currentSession.data = {};

        throw errorFromHttpResponse(resp);
      });
  }
};
