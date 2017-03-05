<template>
  <div class="session">
    <div class="session-header-container">
      <session-header></session-header>
    </div>
    <div v-if="currentSession.sessionId" class="session-contents-container">
      <div class="col-sm-8 whiteboard-container">
        <whiteboard></whiteboard>
      </div>
      <div class="col-sm-4 chat-container">
        <chat></chat>
      </div>
    </div>
  </div>
</template>

<script>

import SessionService from 'src/services/SessionService';
import UserService from 'src/services/UserService';

import SessionHeader from './Session/Header';
import Whiteboard from './Session/Whiteboard';
import Chat from './Session/Chat';

export default {
  components: {
    SessionHeader,
    Whiteboard,
    Chat
  },
  data(){
    return {
      currentSession: SessionService.currentSession
    }
  },
  mounted(){
    var id = this.$route.params.sessionId,
        promise;

    if (!id){
      var type;
      if (this.$route.path.indexOf('session/college') !== -1){
        type = 'college'
      } else {
        type = 'math'
      }
      promise = SessionService.newSession(this, type)
    } else {
      promise = SessionService.useExistingSession(this, id);
    }

    promise.then( (sessionId) => {
      this.$socket.connect();
      this.$socket.emit('join', {
  			sessionId: sessionId,
  			user: UserService.getUser()
  		});
    });
  },
  beforeRouteLeave(to, from, next){
    this.$socket.disconnect();
    SessionService.endSession({ skipRoute: true });
    next();
  }
}
</script>

<style scoped>

.session {
  height: 100%;
}

.session-header-container {
  position: absolute;
  left: 300px;
  right: 0;
  z-index: 1;
}

.session-contents-container {
  height: 100%;
  padding-top: 100px;
}

.whiteboard-container {
  height: 100%;
  padding: 0;
}

.chat-container {
  height: 100%;
  padding: 0;
  border-left: 1px solid #979797;
}
</style>
