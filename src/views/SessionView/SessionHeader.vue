<template>
  <div class="session-header-wrapper">
    <div :class="{ inactive: !isSessionInProgress }" class="session-header">
      <div class="avatar-info-container">
        <div :style="partnerAvatar" class="avatar" />
        <div class="info">
          <template v-if="isSessionWaitingForVolunteer">
            <span>
              Contacting coaches<span class="loading-ellipsis"></span>
            </span>
          </template>
          <template v-else-if="isSessionInProgress">
            <span class="volunteer-name">{{ sessionPartner.firstname }}</span>
          </template>
          <template v-else-if="isSessionOver">
            <template v-if="sessionPartner.firstname">
              <span
                >Your session with {{ sessionPartner.firstname }} has
                ended</span
              >
            </template>
            <template v-else>
              <span>Your session has ended</span>
            </template>
          </template>
          <template v-else>
            Loading...
          </template>
        </div>
      </div>
      <div class="button-container">
        <div class="end-session">
          <button class="btn btn-lg btn-block" @click.prevent="end">
            <span v-if="isSessionWaitingForVolunteer">
              Cancel
            </span>
            <span v-else-if="isSessionOver">
              Finish
            </span>
            <span v-else>
              End session
            </span>
          </button>
        </div>
      </div>
    </div>
    <!-- <div
      :class="[connectionMsgType]"
      class="connection-message"
      v-if="connectionMsg || reconnectAttemptMsg"
    >
      {{ connectionMsg }} {{ reconnectAttemptMsg }}
      <template v-if="reconnectAttemptMsg">
        <button class="connection-try-again" @click.prevent="tryReconnect">
          Try Now
        </button>
      </template>
    </div> -->
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";

import SessionService from "@/services/SessionService";
import router from "@/router";
import StudentAvatarUrl from "@/assets/defaultavatar3.png";
import VolunteerAvatarUrl from "@/assets/defaultavatar4.png";

/**
 * @todo {1} Refactoring candidate: use a modal instead.
 */
export default {
  data() {
    return {
      currentSession: SessionService.currentSession,
      connectionMsg: "",
      connectionMsgType: "",
      reconnectAttemptMsg: ""
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({
      sessionPartner: "user/sessionPartner",
      isSessionAlive: "user/isSessionAlive",
      isSessionWaitingForVolunteer: "user/isSessionWaitingForVolunteer",
      isSessionInProgress: "user/isSessionInProgress",
      isSessionOver: "user/isSessionOver"
    }),

    partnerAvatar() {
      let picture = "";
      if (this.user.isVolunteer === false) {
        picture = VolunteerAvatarUrl;
      } else {
        picture = StudentAvatarUrl;
      }
      return {
        backgroundImage: `url(${picture})`
      };
    }
  },
  methods: {
    end() {
      // Only ask for confirmation if session hasn't been ended by other user
      const shouldEndSession = this.isSessionAlive
        ? window.confirm("Do you really want to end the session?")
        : true;

      // Early exit if user didn't confirm
      if (!shouldEndSession) {
        return;
      }

      this.$store.dispatch("user/clearSession");

      let studentId = "";
      let volunteerId = null;
      let subTopic = null;
      let topic = null;
      let sessionId = SessionService.currentSession.sessionId;

      if (
        SessionService.currentSession &&
        SessionService.currentSession.data.student
      ) {
        studentId = SessionService.currentSession.data.student._id;
      }

      if (
        SessionService.currentSession &&
        SessionService.currentSession.data.volunteer
      ) {
        volunteerId = SessionService.currentSession.data.volunteer._id;
      }

      if (
        SessionService.currentSession &&
        SessionService.currentSession.data.type
      ) {
        topic = SessionService.currentSession.data.type;
      }

      if (
        SessionService.currentSession &&
        SessionService.currentSession.data.subTopic
      ) {
        subTopic = SessionService.currentSession.data.subTopic;
      }

      if (volunteerId) {
        SessionService.endSession(this, sessionId)
          .then(() => {
            this.$socket.disconnect();
            const url =
              "/feedback/" +
              sessionId +
              "/" +
              topic +
              "/" +
              subTopic +
              "/" +
              (this.user.isVolunteer ? "volunteer" : "student") +
              "/" +
              studentId +
              "/" +
              volunteerId;
            router.push(url);
          })
          .catch(this.alertCouldNotEnd);
      } else {
        SessionService.endSession(this, sessionId)
          .then(() => {
            this.$socket.disconnect();
            router.push("/");
          })
          .catch(this.alertCouldNotEnd);
      }
    },
    alertCouldNotEnd() {
      window.alert("Could not end session");
    },
    tryReconnect() {
      // socket must be closed before reopening for automatic reconnections
      // to resume
      this.$socket.close();
      this.$socket.open();
      this.reconnectAttemptMsg = "Waiting for server response.";
      this.$emit("try-clicked");
    },
    connectionSuccess() {
      this.connectionMsg = "";
      this.reconnectAttemptMsg = "";
      this.connectionMsgType = "";
    }
  },
  sockets: {
    connect_error() {
      this.connectionMsg =
        "The system seems to be having a problem reaching the server.";
      this.connectionMsgType = "warning";
    },
    connect_timeout() {
      this.connectionMsg =
        "The system seems to be having a problem reaching the server.";
      this.connectionMsgType = "warning";
    },
    reconnect_attempt() {
      this.reconnectAttemptMsg = "Trying periodically to reconnect.";
    },
    connect() {
      this.connectionSuccess();
    }
  }
};
</script>

<style lang="scss" scoped>
.session-header-wrapper {
  height: 100%;
}

.session-header {
  position: relative;
  height: 100%;
  background-color: $c-success-green;
  padding: 0 20px;
  text-align: left;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  @include breakpoint-below("medium") {
    border-radius: 0px 0px 20px 20px;
    height: 80px;
  }
}

h1 {
  margin: 0;
  text-align: left;
  font-size: 36px;
  line-height: 42px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-image: url("~@/assets/defaultAvatar@2x.png");
  background-size: cover;
  flex-shrink: 0;
}

.info {
  padding-left: 15px;
  color: white;
  font-weight: 600;
  font-size: 16px;
  max-width: 600px;
}

.volunteer-name {
  font-weight: 500;
  font-size: 18px;
}

.btn {
  width: auto;
  height: 40px;
  color: #fff;
  border: none;
  font-size: 16px;
  font-weight: 500;
  background-color: inherit;
}

.btn:hover {
  color: #000000;
}

.button-container {
  display: flex;
}

.session-header.inactive {
  background-color: #7a91a8;
}

.connection-message {
  padding: 3px;
  background-color: #858585;
  color: #fff;
  text-align: center;
  font-weight: 600;
  position: absolute;
  width: 100%;
  bottom: 0;
  left: 0;

  &.warning {
    background-color: #ffde5e;
    color: #000;
  }

  &.success {
    background-color: #fff;
    color: #000;
  }

  .connection-try-again {
    border: 0;
    background: none;
    padding: 0;
    margin: 0;
    text-decoration: underline;
  }
}

.avatar-info-container {
  display: flex;
  align-items: center;
}

.loading-ellipsis {
  &:after {
    content: "";
    animation: 2s ellip infinite;
  }
}

@keyframes ellip {
  20% {
    content: ".";
  }

  40% {
    content: "..";
  }

  60% {
    content: "...";
  }

  80% {
    content: "...";
  }
}
</style>
