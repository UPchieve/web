<template>
  <div class="session">
    <div class="session-header-container">
      <session-header/>
    </div>
    <div v-if="currentSession.sessionId" class="session-contents-container">
      <div class="col-sm-8 whiteboard-container">
        <whiteboard/>
      </div>
      <div class="col-sm-4 chat-container">
        <chat/>
      </div>
    </div>

    <modal
      v-if="showModal"
      :labels="btnLabels"
      :message="message"
      :click-handlers="clickHandlers"
      warn
    />
  </div>
</template>

<script>
import SessionService from "src/services/SessionService";
import UserService from "src/services/UserService";

import SessionHeader from "./Session/Header";
import Whiteboard from "./Session/Whiteboard";
import Chat from "./Session/Chat";
import Modal from "./molecules/Modal";

export default {
  components: {
    SessionHeader,
    Whiteboard,
    Chat,
    Modal
  },
  /*
   * @notes
   * [1] Refactoring candidate: it'd be awesome if Dashboard could pass
   *     the topic directly
   */
  data() {
    return {
      currentSession: SessionService.currentSession,
      showModal: false,
      btnLabels: ["Submit question", "Exit session"],
      message: `
        We don’t have any Academic Coaches
        available right now, but you can submit a
        written question, and we will try to get
        back to you within 24 hours! Would you
        like to submit a question now?
      `,
      clickHandlers: {
        main: () => {
          this.$router.push({
            path: "/submit-question",
            query: {
              topic: this.$route.path.split("/")[2], // [1]
              subTopic: this.$route.params.subTopic
            }
          });
        },
        second: () => {
          this.$router.push("/");
        }
      },
      formLoaderOptions: {
        formLoaderTop: "0",
        formLoaderDot1: "a-loader-1 2s ease-out infinite",
        formLoaderDot2: "a-loader-1 1s 2s ease-out infinite"
      }
    };
  },
  mounted() {
    const id = this.$route.params.sessionId;
    let promise;

    this.sessionId = id;

    if (!id) {
      let type;
      if (this.$route.path.indexOf("session/college") !== -1) {
        type = "college";
      } else {
        type = "math";
      }
      promise = SessionService.newSession(
        this,
        type,
        this.$route.params.subTopic
      );
    } else {
      promise = SessionService.useExistingSession(this, id)
     
        if (UserService.getUser().isVolunteer) {
          //console.log(SessionService.getPartner())
          //console.log(this.currentSession.data.volunteer._id)
          //if (!this.currentSession.data.volunteer._id) {
          
        //}
      }
    }

    promise.then(sessionId => {
      this.sessionId = this.currentSession.sessionId;
      this.$socket.connect();

      this.$socket.emit("join", {
        sessionId,
        user: UserService.getUser()
      });
       
    });

    // Offer the option to ask a question
    const MODAL_TIMEOUT_MS = 24 * 60 * 60 * 1000;
    setTimeout(() => {
      if (
        !UserService.getUser().isVolunteer &&
        SessionService.getPartner() === undefined
      ) {
        this.showModal = true;
      }
    }, MODAL_TIMEOUT_MS);
  }
};
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
  border-top: 25px solid #eaeaeb;
  border-left: 25px solid #eaeaeb;
  border-right: 25px solid #eaeaeb;
}

.chat-container {
  height: 100%;
  padding: 0;
}

@media screen and (max-width: 488px) {
  .whiteboard-container {
    width: 100% !important;
    height: 65vh !important;
  }

  .chat-container {
    width: 100% !important;
    height: 60vh !important;
  }
}
</style>
