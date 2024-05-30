<template>
  <div class="session-header-wrapper">
    <div :class="{ inactive: !isSessionInProgress }" class="session-header">
      <div class="avatar-info-container">
        <component
          :is="partnerAvatar"
          class="avatar"
          :class="!isSessionAlive && 'avatar--hidden'"
        />
        <div class="info">
          <template v-if="isSessionEnding">
            <loading-message message="Ending session" />
          </template>
          <template v-else-if="isSessionWaitingForVolunteer">
            <loading-message message="Contacting coaches" />
          </template>
          <template v-else-if="isSessionInProgress">
            <div class="volunteer-info">
              <span class="volunteer-name">{{ sessionPartner.firstname }}</span
              ><br />
              <span class="in-session-label">In Session</span>
            </div>
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
        <button
          v-if="user.isVolunteer"
          class="report-btn"
          @click="reportSession"
          type="button"
        >
          Report
        </button>

        <button
          v-if="isSessionWaitingForVolunteer"
          @click="end"
          class="end-session-btn"
          type="button"
          data-testid="cancel-session-button"
        >
          Cancel
        </button>
        <button
          v-else-if="isSessionOver"
          @click="goToFeedbackPage"
          class="end-session-btn"
          type="button"
        >
          Finish
        </button>
        <button v-else @click="end" class="end-session-btn" type="button">
          End session
        </button>
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
  </div>
</template>

<script>
// TODO: This file needs to be refactored to remove session logic from this component
import { mapState, mapGetters } from 'vuex'
import SessionService from '@/services/SessionService'
import router from '@/router'
import StudentIcon from '@/assets/student-icon.svg'
import VolunteerIcon from '@/assets/volunteer-icon.svg'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import LoadingMessage from '@/components/LoadingMessage.vue'
import TroubleMatchingModal from '@/views/SessionView/TroubleMatchingModal.vue'
import UnmatchedModal from '@/views/SessionView/UnmatchedModal.vue'
import sendWebNotification from '@/utils/send-web-notification'
import { socket } from '@/socket'
import sound from '@/assets/audio/alert.mp3'

/**
 * @todo {1} Refactoring candidate: use a modal instead.
 */
export default {
  data() {
    return {
      connectionMsg: '',
      connectionMsgType: '',
      reconnectAttemptMsg: '',
      isSessionEnding: false,
      showTroubleMatchingModal: false,
      showUnmatchedModal: false,
      hasSeenTroubleMatchingModal: false,
      isWaitingIntervalId: null,
      volunteerJoinedAudio: new Audio(sound),
    }
  },
  components: {
    LoadingMessage,
    TroubleMatchingModal,
    UnmatchedModal,
  },
  created() {
    /*
     * This seems like an anti-pattern.
     * Any events sent before `created()` is called will be missed.
     * Socket listeners should ideally be defined in the socket store.
     */
    // TODO: move this to its own store and have the socket store dispatch an event
    socket.on('connect_error', () => {
      this.connectionMsg =
        'The system seems to be having a problem reaching the server.'
      this.connectionMsgType = 'warning'
    })
    socket.on('connect_timeout', () => {
      this.connectionMsg =
        'The system seems to be having a problem reaching the server.'
      this.connectionMsgType = 'socket/warning'
    })
    socket.on('reconnect_attempt', () => {
      this.reconnectAttemptMsg = 'Trying periodically to reconnect.'
    })
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
        this.isWaitingTooLong()
      }, 500)

      this.isWaitingIntervalId = setInterval(() => {
        this.isWaitingTooLong()
      }, 1000 * 60)
    }
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      session: (state) => state.user.session,
      isConnected: (state) => state.socket.isConnected,
    }),
    ...mapGetters({
      sessionPartner: 'user/sessionPartner',
      isSessionAlive: 'user/isSessionAlive',
      isSessionWaitingForVolunteer: 'user/isSessionWaitingForVolunteer',
      isSessionInProgress: 'user/isSessionInProgress',
      isSessionOver: 'user/isSessionOver',
      isSessionRecapDmsActive: 'featureFlags/isSessionRecapDmsActive',
      isRecapSocketUpdatesActive: 'featureFlags/isRecapSocketUpdatesActive',
    }),

    partnerAvatar() {
      if (this.isSessionWaitingForVolunteer) return ChatBotIcon
      // show the current user their partner's avatar
      if (this.user.isVolunteer) return StudentIcon
      else return VolunteerIcon
    },
  },
  emits: ['try-clicked'],
  methods: {
    end() {
      if (this.isSessionWaitingForVolunteer) {
        const shouldEndSession = window.confirm(
          "Are you sure you want to cancel this request? If you've been waiting less than 5 minutes, you won't be able to make another request right away."
        )

        if (!shouldEndSession) {
          return
        }
      } else {
        // Only ask for confirmation if session hasn't been ended by other user
        const shouldEndSession = this.isSessionAlive
          ? window.confirm('Do you really want to end the session?')
          : true

        // Early exit if user didn't confirm
        if (!shouldEndSession) {
          return
        }
      }

      if (this.isSessionEnding) {
        return
      }
      this.isSessionEnding = true
      this.endSession()
    },
    endSession() {
      const sessionId = this.session._id

      SessionService.endSession(this, sessionId)
        .then(() => {
          this.$store.dispatch('user/sessionDisconnected')
          // Potentially show the ProgressReportModal again to a student
          // to let them decide if they would like to see an analysis for their Reading sessions
          this.$store.dispatch('user/updateHasSeenProgressReportModal', false)
          if (!this.isSessionRecapDmsActive) this.goToFeedbackPage()
          // Do not send the user directly to the feedback page if they can leave DMs
          if (!this.user.isVolunteer) this.goToFeedbackPage()
          //Send students directly to feedback page whether or not volunteers can send DMs.
          this.isSessionEnding = false
        })
        .catch(this.alertCouldNotEnd)
    },
    reportSession() {
      this.$store.dispatch('app/modal/show', {
        component: 'ReportSessionModal',
        data: {
          showTemplateButtons: false,
          currentSession: this.session,
        },
      })
    },
    alertCouldNotEnd() {
      this.isSessionEnding = false
      window.alert('Could not end session')
    },
    tryReconnect() {
      // socket must be closed before reopening for automatic reconnections
      // to resume
      socket.close()
      socket.open()
      this.reconnectAttemptMsg = 'Waiting for server response.'
      this.$emit('try-clicked')
    },
    connectionSuccess() {
      this.connectionMsg = ''
      this.reconnectAttemptMsg = ''
      this.connectionMsgType = ''
    },
    isAbsentUser() {
      const { student, volunteer } = this.session
      if (!volunteer) return true

      const messages = this.getMessagesAfterVolunteerJoined()
      let isAbsentStudent = true
      let isAbsentVolunteer = true
      for (const message of messages) {
        if (message.user === student._id) isAbsentStudent = false
        if (message.user === volunteer._id) isAbsentVolunteer = false
        if (!isAbsentStudent && !isAbsentVolunteer) break
      }
      return isAbsentStudent || isAbsentVolunteer
    },
    getMessagesAfterVolunteerJoined() {
      return this.session.messages.filter(
        (message) =>
          new Date(message.createdAt).getTime() >=
          new Date(this.session.volunteerJoinedAt).getTime()
      )
    },
    goToFeedbackPage() {
      // redirect to the home page if there is an absent user
      // or if the student was not paired with a tutor
      if (this.isAbsentUser()) return this.$router.push('/')

      router.push(`/feedback/${this.session._id}`)
    },
    toggleTroubleMatchingModal() {
      this.showTroubleMatchingModal = !this.showTroubleMatchingModal
    },
    toggleUnmatchedModal() {
      this.showUnmatchedModal = !this.showUnmatchedModal
    },
    isWaitingTooLong() {
      if (this.session.volunteer) {
        clearInterval(this.isWaitingIntervalId)
        this.showTroubleMatchingModal = false
        this.showUnmatchedModal = false
        return
      }

      const fifteenMins = 1000 * 60 * 15
      const fifteenMinsFromSessionStart =
        new Date(this.session.createdAt).getTime() + fifteenMins
      const fortyFiveMinsFromSessionStart =
        fifteenMinsFromSessionStart + fifteenMins * 2

      if (Date.now() >= fortyFiveMinsFromSessionStart) {
        // Students must end their session after 45 minutes of waiting
        this.toggleUnmatchedModal()
        clearInterval(this.isWaitingIntervalId)
      } else if (
        Date.now() >= fifteenMinsFromSessionStart &&
        !this.hasSeenTroubleMatchingModal
      ) {
        this.toggleTroubleMatchingModal()
        this.hasSeenTroubleMatchingModal = true
      }
    },
  },
  watch: {
    isConnected(val) {
      if (val) {
        this.connectionSuccess()
      }
    },
    // Close possibly open modals that are triggered by a long waiting period
    // and clear the isWaiting interval when a volunteer joins the session
    async isSessionWaitingForVolunteer(value, prevValue) {
      if (!value && prevValue && !this.session.endedAt) {
        this.showTroubleMatchingModal = false
        this.showUnmatchedModal = false
        clearInterval(this.isWaitingIntervalId)
        try {
          await this.volunteerJoinedAudio.play()
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('Unable to play audio', error)
        }
        sendWebNotification('We found a coach!', {
          body: `Start chatting with ${this.sessionPartner.firstname} now.`,
        })
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.session-header-wrapper {
  height: 100%;
}

.session-header {
  position: relative;
  height: 100%;
  background-color: $c-information-blue;
  padding: 0 20px;
  text-align: left;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  @include breakpoint-below('medium') {
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
  flex-shrink: 0;

  &--hidden {
    visibility: hidden;

    @include breakpoint-below('large') {
      display: none;
    }
  }
}

.info {
  padding-left: 15px;
  color: white;
  font-weight: 600;
  font-size: 16px;
  max-width: 600px;

  @include breakpoint-below('large') {
    line-height: 1;
  }
}

.volunteer-info {
  display: inline-block;
  line-height: 1.25;
}

.volunteer-name {
  font-weight: 600;
  font-size: 18px;
}

.in-session-label {
  font-weight: 400;
  font-size: 12px;
}

.button-container {
  display: flex;
  align-items: center;
}

.report-btn {
  display: block;
  border: none;
  background-color: inherit;
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
  display: inline;
  background-color: inherit;
  font-weight: 500;
  cursor: pointer;
  border: solid 1px #fff;
  color: #fff;
  font-size: 16px;
  line-height: 125%;
  padding: 12px 24px;
  border-radius: 9999px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  @include breakpoint-below('large') {
    line-height: 1;
    padding: 9px;
    min-height: 46px;
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
</style>
