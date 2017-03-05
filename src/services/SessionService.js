import Validator from 'validator';

import {router} from '../router'

import NetworkService from './NetworkService'
import UserService from './UserService'


export default {
  loading: false,
  currentSession: {
    sessionId: null,
    data: {}
  },

  getPartner(){
    var user = UserService.getUser(),
        session = this.currentSession.data;

    if (user.isVolunteer){
      return session.student;
    } else {
      return session.volunteer;
    }
  },

  endSession(){
    router.replace('/feedback');
  },



  newSession(context, sessionType){
    return NetworkService.newSession(context, {sessionType}).then((res) => {
      let data = res.data || {},
          sessionId = data.sessionId;

      this.currentSession.sessionId = sessionId;

      console.log(sessionId);
      if (sessionId){
        router.replace(`/session/${sessionType}/${sessionId}`);
      } else {
        router.replace('/');
      }

      return sessionId;
    })
  },

  useExistingSession(context, sessionId){
    return NetworkService.checkSession(context, { sessionId }).then((res) => {
      let data = res.data || {},
          sessionId = data.sessionId,
          sessionType = data.type;

      this.currentSession.sessionId = sessionId;

      console.log(sessionId);
      if (!sessionId){
        router.replace('/');
      }

      return sessionId;
    })
  }
};
