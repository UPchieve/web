<template>
  <div class="session">
    <div class="session-header-container">
      <session-header @try-clicked="tryClicked" />
    </div>
    <div
      v-if="session._id"
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
        <whiteboard
          :shouldCreateSession="isNewSession"
          :isVisible="whiteboardOpen"
        />
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
import * as Sentry from "@sentry/browser";

import SessionService from "@/services/SessionService";

import SessionHeader from "./SessionHeader";
import Whiteboard from "./Whiteboard";
import SessionChat from "./SessionChat";

import SessionFulfilledModal from "./SessionFulfilledModal";
import ConnectionTroubleModal from "./ConnectionTroubleModal";

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
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
  },
  /*
   * @notes
   * [1] Refactoring candidate: it'd be awesome if Dashboard could pass
   *     the topic directly
   */
  data() {
    return {
      whiteboardOpen: false,
      icon: "Pencil.png",
      isNewSession: false
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      session: state => state.user.session,
      isSessionConnectionAlive: state => state.user.isSessionConnectionAlive
    }),
    ...mapGetters({
      mobileMode: "app/mobileMode",
      isAuthenticated: "user/isAuthenticated"
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
        this.$route.params.subTopic,
        {
          onRetry: (res, abort) => {
            this.showTroubleStartingModal(abort);
          }
        }
      );
      this.isNewSession = true;
    } else {
      promise = SessionService.useExistingSession(this, id, {
        onRetry: (res, abort) => {
          this.showTroubleJoiningModal(abort);
        }
      });
      this.isNewSession = false;
    }

    promise
      .then(sessionId => {
        // ensure we restore user when we get a successful response
        if (!this.isAuthenticated) {
          this.$store.dispatch("user/fetchUser");
        }

        if (this.$socket.connected) {
          this.joinSession(sessionId);
        } else {
          this.$socket.connect();
        }
      })
      .catch(err => {
        if (err.status !== 0 && err.code !== "EUSERABORTED") {
          window.alert("Could not start new help session");
          Sentry.captureException(err);
        }
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
          isSessionEnded: !!data.endedAt,
          volunteerJoined: !!data.volunteer,
          isSessionVolunteer: this.user._id === data.volunteer,
          isSessionStudent: this.user._id === data.student
        }
      });
    },
    reconnect_attempt() {
      this.$store.dispatch("user/sessionDisconnected");
      if (!this.session || !this.session._id) {
        this.showTroubleStartingModal();
      }
    },
    connect() {
      this.$store.dispatch("user/sessionConnected");

      if (this.session && this.session._id) {
        if (
          (!this.session.student ||
            this.session.student._id !== this.user._id) &&
          (!this.session.volunteer ||
            this.session.volunteer._id !== this.user._id)
        ) {
          // join the session if we haven't done so already
          this.joinSession(this.session._id);
        }
      } else if (this.$route.params.sessionId) {
        this.joinSession(this.$route.params.sessionId);
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
      this.$queuedSocket.emit(
        "join",
        {
          sessionId,
          user: this.user
        },
        1
      );
    },
    showTroubleStartingModal(abort) {
      const TROUBLE_STARTING_MESSAGE = `
        The system seems to be having a problem starting your new session.
        Please check your Internet connection.
      `;

      this.showConnectionTroubleModal(abort, TROUBLE_STARTING_MESSAGE);
    },
    showTroubleJoiningModal(abort) {
      const TROUBLE_JOINING_MESSAGE = `
        The system seems to be having a problem joining your session.
        Please check your Internet connection.
      `;

      this.showConnectionTroubleModal(abort, TROUBLE_JOINING_MESSAGE);
    },
    showConnectionTroubleModal(abort, message) {
      this.$store.dispatch("app/modal/show", {
        component: ConnectionTroubleModal,
        data: {
          message,
          acceptText: "Abort Session",
          alertModal: true,
          abortFunction: abort
        }
      });
    },
    tryClicked() {
      this.sessionReconnecting = true;
    }
  },
  watch: {
    isSessionConnectionAlive(newValue, oldValue) {
      if (newValue && !oldValue) {
        this.$store.dispatch("app/modal/hide");
      }
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
    width: 100%;
    height: 100%;
  }
}

.whiteboard-container {
  background: #fff;
  padding: 0;
  flex-grow: 1;
  overflow: hidden;
  position: relative;

  &--hidden {
    position: absolute;
    width: 100%;
    height: 100%;
    top: -500px;
    left: -500px;
  }
}

.chat-container {
  padding: 0;

  &--hidden {
    display: none;
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

  @include breakpoint-below("medium") {
    bottom: 33px;
  }

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
