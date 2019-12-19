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
        class="whiteboard-container"
        id="whiteboard-container"
        v-bind:class="{
          'whiteboard-container--hidden': shouldHideWhiteboardSection
        }"
      >
        <whiteboard />
      </div>
      <div
        class="chat-container"
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
import { mapState, mapGetters } from "vuex";
import base64url from "base64url";

import SessionService from "@/services/SessionService";

import SessionHeader from "./SessionHeader";
import Whiteboard from "./Whiteboard";
import SessionChat from "./SessionChat";

import SessionFulfilledModal from "./SessionFulfilledModal";

const headerData = {
  component: "SessionHeader"
};

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
    } else {
      this.$store.dispatch("app/header/show", headerData);
      this.$store.dispatch("app/sidebar/hide");
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
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({
      mobileMode: "app/mobileMode"
    }),

    shouldHideWhiteboardSection() {
      // Never hide whiteboard section on desktop
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
    }
  },
  mounted() {
    const id =
      this.$route.path.indexOf("/s/") === -1
        ? this.$route.params.sessionId
        : base64url
            .toBuffer(this.$route.params.sessionIdBase64)
            .toString("hex");
    let promise;

    if (!id) {
      let type = this.$route.params.topic;
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
    bump: function(data) {
      this.$store.dispatch("app/modal/show", {
        component: SessionFulfilledModal,
        data: {
          acceptText: "Return to Dashboard",
          alertModal: true,
          isSessionEnded: !!data.endedAt
        }
      });
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
        this.$store.dispatch("app/header/show", headerData);
        this.$store.dispatch("app/sidebar/hide");
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
        user: this.user
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
  position: fixed;
  z-index: 3;
  top: 0;
  left: 0;
  width: 100%;
  background: #fff;

  @include breakpoint-above("medium") {
    position: absolute;
    top: 20px;
    left: unset;
    right: 20px;
    width: 400px;
    height: 70px;
    background: #fff;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    overflow: hidden;
  }
}

.session-contents-container {
  height: 100%;
  padding-top: 100px;
  display: flex;
  background: $c-background-grey;

  @include breakpoint-above("medium") {
    padding: 20px;
    @include child-spacing(right, 15px);
  }

  @include breakpoint-below("medium") {
    padding-top: 80px;
  }
}

.whiteboard-container,
.chat-container {
  @include breakpoint-above("medium") {
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
  }

  @include breakpoint-below("medium") {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: calc(100vh - 80px);
    z-index: 2;
  }
}

.whiteboard-container {
  padding: 0;
  flex-grow: 1;
  overflow: hidden;

  // Hide with z-index (not display: none) so canvas is accessible in DOM
  &--hidden {
    z-index: 0;
  }

  @include breakpoint-below("medium") {
    background: #fff;
  }
}

.chat-container {
  padding: 0;

  &--hidden {
    // Hide with z-index (not display: none) so canvas is accessible in DOM
    z-index: 0;
  }

  @include breakpoint-above("medium") {
    min-width: 400px;
    flex-basis: 400px;
    position: relative;
  }

  @include breakpoint-below("medium") {
    max-width: 100%;
  }
}

.toggleButton {
  position: fixed;
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
  bottom: calc(100% - 140px);
}
</style>
