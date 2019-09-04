<template>
  <div class="session">
    <div class="session-header-container">
      <session-header @try-clicked="tryClicked" />
    </div>
    <div
      v-if="currentSession.sessionId"
      class="session-contents-container"
      v-bind:class="{
        'session-contents-container--mobile': mobileMode
      }"
    >
      <div
        class="col-sm-8 whiteboard-container"
        id="whiteboard-container"
        v-bind:class="{
          'whiteboard-container--hidden': shouldHideWhiteboardSection
        }"
      >
        <whiteboard />
      </div>
      <div
        class="col-sm-4 chat-container"
        id="chat-container"
        v-bind:class="{
          'chat-container--hidden': shouldHideChatSection
        }"
      >
        <session-chat />
      </div>
    </div>
    <div
      v-if="mobileMode"
      class="toggleButton"
      id="toggleButton"
      @click="toggleWhiteboard"
    >
      <img id="toggleIcon" :src="getIconUrl()" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

import SessionService from "@/services/SessionService";
import UserService from "@/services/UserService";

import SessionHeader from "./SessionHeader";
import Whiteboard from "./Whiteboard";
import SessionChat from "./SessionChat";

export default {
  name: "session-view",
  components: {
    SessionHeader,
    Whiteboard,
    SessionChat
  },
  created() {
    if (this.mobileMode) {
      this.$store.dispatch("app/hideNavigation");
    }

    window.addEventListener("resize", this.handleResize);
  },
  /*
   * @notes
   * [1] Refactoring candidate: it'd be awesome if Dashboard could pass
   *     the topic directly
   */
  data() {
    return {
      currentSession: SessionService.currentSession,
      whiteboardOpen: false,
      icon: "Pencil.png",
      sessionReconnecting: false
    };
  },
  computed: {
    ...mapGetters({ mobileMode: "app/mobileMode" }),

    shouldHideWhiteboardSection() {
      // Never hide chat section on desktop
      if (!this.mobileMode) {
        return false;
      }

      return !this.whiteboardOpen;
    },
    shouldHideChatSection() {
      // Never hide chat section on desktop
      if (!this.mobileMode) {
        return false;
      }

      return this.whiteboardOpen;
    },
  },
  mounted() {
    const id = this.$route.params.sessionId;
    let promise;

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
        this.$socket.connect();
        this.joinSession(sessionId);
      })
      .catch(() => {
        window.alert("Could not start new help session");
        this.$router.replace("/");
      });
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
  methods: {
    handleResize() {
      if (this.mobileMode) {
        this.$store.dispatch("app/hideNavigation");
      } else {
        this.$store.dispatch("app/showNavigation");
      }
    },
    getIconUrl() {
      return require("@/assets/" + this.icon);
    },
    toggleWhiteboard() {
      if (!this.whiteboardOpen) {
        document.getElementById("toggleButton").classList.add("back");
        this.icon = "Chat.png";
        this.whiteboardOpen = true;
      } else {
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
  z-index: 3;
  top: 0;
  left: 0;
  width: 100%;
  background: #fff;
}

.session-contents-container {
  height: 100%;
  padding-top: 100px;

  &--mobile {
    padding-top: 80px;

    .whiteboard-container,
    .chat-container {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: calc(100vh - 80px);
      z-index: 2;
    }

    .whiteboard-container {
      border: 0;

      // Hide with z-index (not display: none) so canvas is accessible in DOM
      &--hidden {
        z-index: 0;
      }
    }

    .chat-container {
      // Hide with z-index (not display: none) so canvas is accessible in DOM
      &--hidden {
        z-index: 0;
      }
    }
  }
}

.whiteboard-container {
  height: 100%;
  padding: 0;
  border: 25px solid #e5e5e5;
  background: #e5e5e5;
}

.toggleButton {
  position: absolute;
  z-index: 3;
  bottom: 10px;
  right: 20px;
  border-radius: 20px;
  background: #16d2aa;
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
</style>
