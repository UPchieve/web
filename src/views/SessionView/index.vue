<template>
  <div class="session">
    <div class="session-header-container">
      <session-header @try-clicked="tryClicked" />
    </div>
    <div v-if="currentSession.sessionId" class="session-contents-container">
      <div class="col-sm-8 whiteboard-container" id="whiteboard-container">
        <whiteboard />
      </div>
      <div class="col-sm-4 chat-container" id="chat-container">
        <session-chat/>
      </div>
    </div>

    <div class="toggleButton" id="toggleButton" @click="toggleWhiteboard">
      <img id="toggleIcon" :src="getIconUrl()"/>
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
import SessionService from "@/services/SessionService";
import UserService from "@/services/UserService";

import SessionHeader from "./SessionHeader";
import Whiteboard from "./Whiteboard";
import SessionChat from "./SessionChat";
import Modal from "@/components/Modal";

export default {
  name: "session-view",
  components: {
    SessionHeader,
    Whiteboard,
    SessionChat,
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
      sessionReconnecting: false,
      showModal: false,
      whiteboardOpen: false,
      icon: "Pencil.png",
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
      promise = SessionService.useExistingSession(this, id);
    }

    promise
      .then(sessionId => {
        this.sessionId = this.currentSession.sessionId;
        this.$socket.connect();
        this.joinSession(sessionId);
      })
      .catch(() => {
        window.alert("Could not start new help session");
        this.$router.replace("/");
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
  },
  sockets: {
    bump: function() {
      this.$router.push("/");
    },
    reconnect_attempt() {
      this.sessionReconnecting = true;
    },
    connect() {
      if (this.sessionReconnecting) {
        if (this.currentSession && this.currentSession.sessionId) {
          // we still need to re-join the room after Socket.IO re-establishes the connection
          this.joinSession(this.currentSession.sessionId);
        } else {
          location.reload();
        }
      }
    }
  },
  computed: {
    partnerName() {
      const partner = SessionService.getPartner();
      return partner && partner.firstname;
    }
  },
  methods: {
    getIconUrl() {
      return require('@/assets/'+this.icon);
    },
    toggleWhiteboard() {
      if (!this.whiteboardOpen) {
        document.getElementById("whiteboard-container").style.display = "block";
        document.getElementById("chat-container").style.display = "none";
        document.getElementById("toggleButton").classList.add("back");
        this.icon = "Chat.png";
        this.whiteboardOpen = true;
      } else {
        document.getElementById("whiteboard-container").style.display = "none";
        document.getElementById("chat-container").style.display = "block";
        document.getElementById("toggleButton").classList.remove("back");
        this.icon = "Pencil.png";
        this.whiteboardOpen = false;
      }
    },
    joinSession(sessionId) {
      this.$socket.emit("join", {
        sessionId,
        user: UserService.getUser()
      });
    },
    tryClicked() {
      this.sessionReconnecting = true;
    }
    
  }
};
</script>

<style lang="scss" scoped>
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
  border: 25px solid #E5E5E5;
  background: #E5E5E5;
}

.toggleButton {
  display: none;
  position: absolute;
  bottom: 10px;
  right: 20px;
  border-radius: 20px;
  background: #16D2AA;
  width: 40px;
  height: 40px;
  transition: 0.4s;

  img {
    margin-top: 7px;
    width: 26px;
    height: 26px;
  }
}

.toggleButton.back {
  bottom: calc(100vh - 140px);
}

.chat-container {
  height: 100%;
  padding: 0;
}

@media screen and (max-width: 700px) {
  .session-contents-container {
    height: 100%;
    padding-top: 80px;
  }
  .whiteboard-container {
    width: 100%;
    height: calc(100vh-80px);
    border: 0;
    display: none;
  }
  .toggleButton {
    display: block;
  }
  .chat-container {
    width: 100%;
    height: calc(100vh-80px);
  }
}
</style>
