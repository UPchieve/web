import router from "@/router";

import NetworkService from "./NetworkService";
import UserService from "./UserService";

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
    localStorage.removeItem("currentSessionPath");

    return NetworkService.endSession(context, { sessionId }).then(() => {
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
        const path = `/session/${sessionType}/${sessionSubTopic}/${sessionId}`;
        localStorage.setItem("currentSessionPath", path);
        router.replace(path);
      } else {
        router.replace("/");
      }

      return sessionId;
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

        localStorage.removeItem("currentSessionPath");
        return;
      }

      const { sessionId, data } = resp.data || {};
      const { type, subTopic } = data;

      if (type && subTopic && sessionId) {
        this.currentSession.sessionId = sessionId;
        this.currentSession.data = data;

        const path = `/session/${type}/${subTopic}/${sessionId}`;
        localStorage.setItem("currentSessionPath", path);
      }
    });
  }
};
