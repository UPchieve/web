import router from '../router';

import NetworkService from './NetworkService';
import UserService from './UserService';


export default {
  loading: false,
  currentSession: {
    sessionId: null,
    data: {},
  },

  getPartner() {
    const user = UserService.getUser();
    const session = this.currentSession.data || {};

    if (user.isVolunteer) {
      return session.student;
    }
    return session.volunteer;
  },

  endSession(context, sessionId, options = {}) {
    return NetworkService
      .endSession(context, { sessionId })
      .then(res => {
        const data = res.data || {};
        const { sessionId } = data;

        console.log(`ended session: ${sessionId}`);
        this.currentSession.sessionId = null;
        this.currentSession.data = {};
        localStorage.removeItem('currentSessionPath');

        if (!options.skipRoute) {
          router.replace('/feedback');
        }
      })
  },

  newSession(context, sessionType, sessionSubTopic) {
    return NetworkService.newSession(context, { sessionType, sessionSubTopic })
      .then((res) => {
        const data = res.data || {};
        const { sessionId } = data;

        this.currentSession.sessionId = sessionId;

        if (sessionId) {
          const path = `/session/${sessionType}/${sessionSubTopic}/${sessionId}`;
          localStorage.setItem('currentSessionPath', path);
          router.replace(path);
        } else {
          router.replace('/');
        }

        return sessionId;
      });
  },

  useExistingSession(context, sessionId) {
    return NetworkService.checkSession(context, { sessionId }).then((res) => {
      const data = res.data || {};
      const { sessionId } = data;

      this.currentSession.sessionId = sessionId;

      console.log(sessionId);
      if (!sessionId) {
        router.replace('/');
      }

      return sessionId;
    });
  },

  getCurrentSession(context, user) {
    return NetworkService
      .currentSession(context, { userId: user._id })
      .then(resp => {
        const { sessionId, data } = resp.data || {};
        const { type, subTopic } = data

        this.currentSession.sessionId = sessionId
        this.currentSession.data = data

        if (type && subTopic && sessionId) {
          const path = `/session/${type}/${subTopic}/${sessionId}`
          localStorage.setItem('currentSessionPath', path);
        } else {
          localStorage.removeItem('currentSessionPath');
	}
      });
  }
};
