import router from "@/router";

import NetworkService from "./NetworkService";
import UserService from "./UserService";
import AnalyticsService from "./AnalyticsService";

import errorFromServer from "@/utils/error-from-server";

export default {
  loading: false,
  currentSession: {
    sessionId: null,
    data: {}
  },

  getPartner() {
    const user = UserService.getUser();
    const session = this.currentSession.data || {};

    if (user.isVolunteer) {
      return session.student;
    }
    return session.volunteer;
  },

  endSession(context, sessionId) {
    return NetworkService.endSession(context, { sessionId }).then(() => {
      localStorage.removeItem("currentSessionPath");

      // analytics: track when a help session has ended
      AnalyticsService.trackSessionEnded(
        this.currentSession.data,
        UserService.getUser().isFakeUser
      );

      this.currentSession.sessionId = null;
      this.currentSession.data = {};
    });
  },

  newSession(context, sessionType, sessionSubTopic) {
    return NetworkService.newSession(context, {
      sessionType,
      sessionSubTopic
    })
      .then(res => {
        const data = res.data || {};
        const { sessionId } = data;

        this.currentSession.sessionId = sessionId;

        if (sessionId) {
          const path = `/session/${sessionType}/${sessionSubTopic}/${sessionId}`;
          localStorage.setItem("currentSessionPath", path);
          router.replace(path);
        } else {
          router.replace("/");
        }
        // analytics: track when a session has started
        AnalyticsService.trackSessionStarted(
          this.currentSession,
          sessionType,
          sessionSubTopic,
          UserService.getUser().isFakeUser
        );

        return sessionId;
      })
      .catch(res => {
        return errorFromServer(res);
      });
  },

  useExistingSession(context, sessionId) {
    return NetworkService.checkSession(context, { sessionId })
      .then(res => {
        const data = res.data || {};
        const { sessionId } = data;

        this.currentSession.sessionId = sessionId;

        if (!sessionId) {
          router.replace("/");
        }

        return sessionId;
      })
      .catch(res => {
        throw errorFromServer(res);
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

          const path = `/session/${type}/${subTopic}/${sessionId}`;
          localStorage.setItem("currentSessionPath", path);
          return path;
        }
      })
      .catch(err => {
        if ((!err.data || !err.data.err) && err.status !== 0) {
          throw err;
        }

        this.currentSession.sessionId = null;
        this.currentSession.data = {};

        localStorage.removeItem("currentSessionPath");
        throw err.data.err;
      });
  }
};
