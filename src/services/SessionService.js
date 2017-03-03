import Validator from 'validator';
import Socket from 'socket.io-client';

import {router} from '../main'

import NetworkService from './NetworkService'
import UserService from './UserService'

const SOCKET_ADDRESS = 'http://localhost:3001';


export default {
  socket: null,
  loading: false,
  currentSession: {
    sessionId: null
  },

  startChatSocket(){
    this.socket = Socket(SOCKET_ADDRESS);

    this.socket.on('connect', () => {
			this.socket.emit('join', {
				sessionId: this.currentSession.sessionId,
				user: UserService.getUser()
			});
		});
    return this.socket;

  },



  newSession(context, sessionType){
    return NetworkService.newSession(context, { sessionType }).then((res) => {
      let data = res.data || {},
          sessionId = data.sessionId;

      this.currentSession.sessionId = sessionId;

      console.log(sessionId);

      router.replace(`/session/${sessionId}`);

      return sessionId;
    })
  },

  useExistingSession(context, sessionId){
    return NetworkService.checkSession(context, { sessionId }).then((res) => {
      let data = res.data || {},
          sessionId = data.sessionId;

      this.currentSession.sessionId = sessionId;

      console.log(sessionId);
      if (sessionId){
        router.replace(`/session/${sessionId}`);
      } else {
        router.replace('/');
      }

      return sessionId;
    })
    this.currentSession.sessionId = sessionId;
  }
};
