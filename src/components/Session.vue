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

    <modal warn v-if="showModal"
      :labels="btnLabels"
      :message="message"
      :clickHandlers="clickHandlers"
    ></modal>
  </div>
</template>


<script>
import SessionService from 'src/services/SessionService';
import UserService from 'src/services/UserService';

import SessionHeader from './Session/Header';
import Whiteboard from './Session/Whiteboard';
import Chat from './Session/Chat';
import Modal from './molecules/Modal';

export default {
  components: {
    SessionHeader,
    Whiteboard,
    Chat,
    Modal
  },
  data(){
    return {
      currentSession: SessionService.currentSession,
      showModal: false,
      btnLabels: [
        'Exit session',
        'Submit question'
      ],
      message: `
        We don’t have any Academic Coaches
        available right now, but you can submit a
        written question, and we will try to get
        back to you within 24 hours! Would you
        like to submit a question now?
      `,
      clickHandlers: {
        main: () => {
          this.$router.push('/submit-question');
        },
        second: () => {
          this.$router.push('/');
        }
      }
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

    // Offer the option to ask a question
    setTimeout(() => {
      if (
        !UserService.getUser().isVolunteer && 
        SessionService.getPartner() === undefined
      ) {
        this.showModal = true;
      }
    }, 0);//600000);
  },
  beforeRouteLeave(to, from, next) {
    if (
      to.path.indexOf('/feedback') !== -1 ||
      to.path.indexOf('/submit-question') !== -1
    ) {
      next();
      return;
    }
    else {
      let result = window.confirm('Do you really want to end the session?');
      if (result) {
        this.$socket.disconnect();
        SessionService.endSession({ skipRoute: true });
        next('/feedback');
      }
    }
  }
}
</script>


<style scoped>
  /*
  * @notes
  * [1] Refactoring candidate: these styles should be placed in the container
  *     (we need to rethink the containing model in order to do so)
  */
  .session {
    position: relative; /*[1]*/
    height: 100%; /*[1]*/
  }

  .session-header-container {
    position: absolute;
    left: 0;
    width: 100%;
  }

  .session-contents-container {
    height: 100%;
    padding-top: 100px;
  }

  .whiteboard-container {
    height: 100%;
    padding: 0;
    border-top: 25px solid #EAEAEB;
    border-left: 25px solid #EAEAEB;
    border-right: 25px solid #EAEAEB;
  }

  .chat-container {
    height: 100%;
    padding: 0;
  }
</style>
