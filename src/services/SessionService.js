import router from '../router';

import NetworkService from './NetworkService';
import UserService from './UserService';


export default {
  loading: false,
  currentSession: {
    sessionId: null,
    data: {
      volunteerJoinTime: null,
      sessionEndTime: null,
    },
  },

  getPartner() {
    const user = UserService.getUser();
    const session = this.currentSession.data;
    if (user.isVolunteer) {
      this.currentSession.data.volunteerJoinTime = new Date();
      return session.student;
    }
    return session.volunteer;
  },

  endSession(options = {}) {
    this.session.sessionEndTime = new Date();
    this.currentSession.sessionId = null;
    this.currentSession.data = {};
    if (!options.skipRoute) {
      router.replace('/feedback');
    }
  },

  newSession(context, sessionType, sessionSubTopic) {
    return NetworkService.newSession(context, { sessionType, sessionSubTopic })
      .then((res) => {
        const data = res.data || {};
        const { sessionId } = data;

        this.currentSession.sessionId = sessionId;

        console.log('here', sessionId);
        if (sessionId) {
          router.replace(`/session/${sessionType}/${sessionSubTopic}/${sessionId}`);
        }
        else {
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
};
