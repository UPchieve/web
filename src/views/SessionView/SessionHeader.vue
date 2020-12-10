<template>
  <div class="session-header-wrapper">
    <div :class="{ inactive: !isSessionInProgress }" class="session-header">
      <div class="avatar-info-container">
        <div :style="partnerAvatar" class="avatar" />
        <div class="info">
          <template v-if="isSessionEnding">
            <loading-message message="Ending session" />
          </template>
          <template v-else-if="isSessionWaitingForVolunteer">
            <loading-message message="Contacting coaches" />
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
            <loading-message message="Loading" />
          </template>
        </div>
      </div>
      <div class="button-container">
        <div v-if="user.isVolunteer" class="report-btn" @click="reportSession">
          Report
        </div>

        <span
          v-if="isSessionWaitingForVolunteer"
          @click="end"
          class="end-session-btn"
        >
          Cancel
        </span>
        <span
          v-else-if="isSessionOver"
          @click="goToFeedbackPage"
          class="end-session-btn"
        >
          Finish
        </span>
        <span v-else @click="end" class="end-session-btn"> End session </span>
      </div>
    </div>
    <trouble-matching-modal
      v-if="showTroubleMatchingModal"
      :closeModal="toggleTroubleMatchingModal"
      :endSession="endSession"
      :sessionId="session._id"
    />
    <unmatched-modal
      v-if="showUnmatchedModal"
      :endSession="endSession"
      :sessionId="session._id"
    />
    <audio
      class="audio__volunteer-joined"
      src="@/assets/audio/alert.mp3"
      muted
    />
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
import LoadingMessage from "@/components/LoadingMessage";
import TroubleMatchingModal from "@/views/SessionView/TroubleMatchingModal";
import UnmatchedModal from "@/views/SessionView/UnmatchedModal";
import sendWebNotification from "@/utils/send-web-notification";

/**
 * @todo {1} Refactoring candidate: use a modal instead.
 */
export default {
  data() {
    return {
      connectionMsg: "",
      connectionMsgType: "",
      reconnectAttemptMsg: "",
      isSessionEnding: false,
      showTroubleMatchingModal: false,
      showUnmatchedModal: false,
      hasSeenTroubleMatchingModal: false,
      isWaitingIntervalId: null
    };
  },
  components: {
    LoadingMessage,
    TroubleMatchingModal,
    UnmatchedModal
  },
  mounted() {
    // Show a modal if a student has been waiting too long to get matched with a volunteer
    if (!this.user.isVolunteer) {
      /**
       * There's a re-render that is triggered when fetching for the current session.
       * If the modal is shown before this re-render occurs it will not display on
       * the screen. Set a timeout to display the modal after those initial re-renders
       **/
      setTimeout(() => {
        this.isWaitingTooLong();
      }, 500);

      this.isWaitingIntervalId = setInterval(() => {
        this.isWaitingTooLong();
      }, 1000 * 60);
    }
  },
  beforeDestroy() {
    this.$socket.disconnect();
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      session: state => state.user.session
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
      if (this.isSessionWaitingForVolunteer) {
        const shouldEndSession = window.confirm(
          "Are you sure you want to cancel this request? If you've been waiting less than 5 minutes, you won't be able to make another request right away."
        );

        if (!shouldEndSession) {
          return;
        }
      } else {
        // Only ask for confirmation if session hasn't been ended by other user
        const shouldEndSession = this.isSessionAlive
          ? window.confirm("Do you really want to end the session?")
          : true;

        // Early exit if user didn't confirm
        if (!shouldEndSession) {
          return;
        }
      }

      if (this.isSessionEnding) {
        return;
      }
      this.isSessionEnding = true;
      this.endSession();
    },
    endSession() {
      const sessionId = this.session._id;

      SessionService.endSession(this, sessionId)
        .then(() => {
          this.$store.dispatch("user/sessionDisconnected");
          this.goToFeedbackPage();
        })
        .catch(this.alertCouldNotEnd);
    },
    reportSession() {
      this.$store.dispatch("app/modal/show", {
        component: "ReportSessionModal",
        data: {
          showTemplateButtons: false
        }
      });
    },
    alertCouldNotEnd() {
      this.isSessionEnding = false;
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
    },
    goToFeedbackPage() {
      const sessionId = this.session._id;
      let studentId = "";
      let volunteerId = null;
      let subTopic = null;
      let topic = null;

      if (this.session.student) studentId = this.session.student._id;
      if (this.session.volunteer) volunteerId = this.session.volunteer._id;
      if (this.session.type) topic = this.session.type;
      if (this.session.subTopic) subTopic = this.session.subTopic;

      const url = volunteerId
        ? "/feedback/" +
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
          volunteerId
        : "/";
      router.push(url);
    },
    toggleTroubleMatchingModal() {
      this.showTroubleMatchingModal = !this.showTroubleMatchingModal;
    },
    toggleUnmatchedModal() {
      this.showUnmatchedModal = !this.showUnmatchedModal;
    },
    isWaitingTooLong() {
      if (this.session.volunteer) {
        clearInterval(this.isWaitingIntervalId);
        this.showTroubleMatchingModal = false;
        this.showUnmatchedModal = false;
        return;
      }

      const fifteenMins = 1000 * 60 * 15;
      const fifteenMinsFromSessionStart =
        new Date(this.session.createdAt).getTime() + fifteenMins;
      const fortyFiveMinsFromSessionStart =
        fifteenMinsFromSessionStart + fifteenMins * 2;

      if (Date.now() >= fortyFiveMinsFromSessionStart) {
        // Students must end their session after 45 minutes of waiting
        this.toggleUnmatchedModal();
        clearInterval(this.isWaitingIntervalId);
      } else if (
        Date.now() >= fifteenMinsFromSessionStart &&
        !this.hasSeenTroubleMatchingModal
      ) {
        this.toggleTroubleMatchingModal();
        this.hasSeenTroubleMatchingModal = true;
      }
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
  },
  watch: {
    // Close possibly open modals that are triggered by a long waiting period
    // and clear the isWaiting interval when a volunteer joins the session
    async isSessionWaitingForVolunteer(value, prevValue) {
      if (!value && prevValue) {
        this.showTroubleMatchingModal = false;
        this.showUnmatchedModal = false;
        clearInterval(this.isWaitingIntervalId);
        try {
          const volunteerJoinedAudio = document.querySelector(
            ".audio__volunteer-joined"
          );
          // Unmuting the audio allows us to bypass the need for user interaction with the DOM before playing a sound
          volunteerJoinedAudio.muted = false;
          await volunteerJoinedAudio.play();
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log("Unable to play audio");
        }
        sendWebNotification("We found a coach!", {
          body: `Start chatting with ${this.sessionPartner.firstname} now.`
        });
      }
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

.button-container {
  display: flex;
  align-items: center;
}

.report-btn {
  font-weight: 500;
  cursor: pointer;
  color: #fff;
  padding: 0 5px;
  margin-right: 10px;

  &:hover {
    color: #e8e8e8;
  }
}

.end-session-btn {
  font-weight: 500;
  cursor: pointer;
  border: solid 1px #fff;
  color: #fff;
  font-size: 14px;
  padding: 5px 10px;
  border-radius: 5px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
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

.audio__volunteer-joined {
  display: none;
}
</style>
