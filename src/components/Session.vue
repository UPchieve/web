<template>
  <div class="session">
    <div class="session-header-container">
      <session-header></session-header>
    </div>
    <div v-if="currentSession.sessionId" class="session-contents-container">
      <div class="col-sm-8 whiteboard-container">
        <!-- <whiteboard></whiteboard> -->
      </div>
      <div class="col-sm-4 chat-container">
        <chat></chat>
      </div>
    </div>
  </div>
</template>

<script>

import SessionService from 'src/services/SessionService';

import SessionHeader from './Session/Header';
// import Whiteboard from './Whiteboard';
import Chat from './Chat';

export default {
  components: {
    SessionHeader,
    // Whiteboard,
    Chat
  },
  data(){
    return {
      currentSession: SessionService.currentSession
    }
  },
  mounted(){
    var id = this.$route.params.sessionId;
    if (!id){
      SessionService.newSession(this, 'Math')
    } else {
      SessionService.useExistingSession(this, id);
    }
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
  padding: 0;
}

.chat-container {
  height: 100%;
  padding: 0;
  border-left: 1px solid #979797;
}
</style>
