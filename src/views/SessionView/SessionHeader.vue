<template>
  <div class="session-header-wrapper">
    <div :class="{ inactive: !isSessionInProgress }" class="session-header">
      <div class="avatar-info-container">
        <component
          v-if="!isSessionOver"
          :is="partnerAvatar"
          class="avatar"
          :class="!isSessionAlive && 'avatar--hidden'"
        />

        <div class="info">
          <loading-message v-if="isSessionEnding" message="Ending session" />
          <loading-message
            v-else-if="isSessionWaitingForVolunteer"
            message="Contacting coaches"
          />
          <div v-else-if="isSessionInProgress" class="volunteer-info">
            <span class="volunteer-name">{{ sessionPartner.firstname }}</span>
            <div class="partner-status" v-if="isSessionPresenceActive">
              <activity-dot
                :class="{
                  'partner-status__icon--online': isPartnerOnline,
                  'partner-status__icon--offline': !isPartnerOnline,
                }"
              />
              <p class="partner-status__text">
                {{ isPartnerOnline ? 'In session' : 'Away' }}
              </p>
            </div>
            <span class="in-session-label" v-else>In Session</span>
          </div>
          <div class="session-ended" v-else-if="isSessionOver">
            Session ended
          </div>
          <loading-message v-else message="Loading" />
        </div>
      </div>
      <div class="session-control-buttons" v-if="mobileMode">
        <report-session-button :variant="'tertiary'" class="report-button" />
        <end-session-button
          class="end-button"
          :variant="'secondary'"
          :end-text="'End'"
        />
      </div>
    </div>
    <trouble-matching-modal
      v-if="showTroubleMatchingModal"
      :closeModal="toggleTroubleMatchingModal"
      :endSession="endAndExitSession"
      :sessionId="session._id"
    />
    <unmatched-modal v-if="showUnmatchedModal" :sessionId="session._id" />
  </div>
</template>

<script>
// TODO: This file needs to be refactored to remove session logic from this component
import { mapState, mapGetters } from 'vuex'
import StudentIcon from '@/assets/student-icon.svg'
import VolunteerIcon from '@/assets/volunteer-icon.svg'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import LoadingMessage from '@/components/LoadingMessage.vue'
import TroubleMatchingModal from '@/views/SessionView/TroubleMatchingModal.vue'
import UnmatchedModal from '@/views/SessionView/UnmatchedModal.vue'
import sendWebNotification from '@/utils/send-web-notification'
import { socket } from '@/socket'
import sound from '@/assets/audio/alert.mp3'
import ActivityDot from '@/components/ActivityDot.vue'
import ReportSessionButton from '@/components/ReportSessionButton.vue'
import EndSessionButton from '@/components/EndSessionButton.vue'
import SessionService from '@/services/SessionService'
/**
 * @todo {1} Refactoring candidate: use a modal instead.
 */
export default {
  data() {
    return {
      connectionMsg: '',
      connectionMsgType: '',
      reconnectAttemptMsg: '',
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
    ActivityDot,
    ReportSessionButton,
    EndSessionButton,
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
    if (this.isStudent) {
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
  beforeUnmount() {
    socket.emit('sessions/partner:online', false)
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      session: (state) => state.user.session,
      isConnected: (state) => state.socket.isConnected,
      isPartnerOnline: (state) => state.session.isPartnerOnline,
    }),
    ...mapGetters({
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      sessionPartner: 'user/sessionPartner',
      isSessionAlive: 'user/isSessionAlive',
      isSessionWaitingForVolunteer: 'user/isSessionWaitingForVolunteer',
      isSessionEnding: 'user/isSessionEnding',
      isSessionInProgress: 'user/isSessionInProgress',
      isSessionOver: 'user/isSessionOver',
      isSessionPresenceActive: 'featureFlags/isSessionPresenceActive',
      mobileMode: 'app/mobileMode',
    }),

    partnerAvatar() {
      if (this.isSessionWaitingForVolunteer) return ChatBotIcon
      // show the current user their partner's avatar
      if (this.isVolunteer) return StudentIcon
      if (this.isStudent) return VolunteerIcon
      return ''
    },
  },
  emits: ['try-clicked'],
  methods: {
    endAndExitSession() {
      SessionService.endAndExitSession({
        store: this.$store,
        router: this.$router,
      })
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
  flex-grow: 1;
}
.session-header {
  position: relative;
  background-color: $c-information-blue;
  padding: 8px 20px;
  text-align: left;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  min-height: 64px;
  border-radius: 8px 8px 0 0;
  @include breakpoint-below('medium') {
    border-radius: 0;
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
  display: block;
}

.session-header.inactive {
  background-color: #7a91a8;
}

.avatar-info-container {
  display: flex;
  align-items: center;
}

.partner-status {
  @include flex-container(row, initial, center);

  &__text {
    margin-bottom: 0;
    margin-left: 0.2em;

    @include breakpoint-above('medium') {
      font-size: 12px;
    }
    @include breakpoint-above('large') {
      font-size: 16px;
    }
  }

  &__icon {
    &--online {
      background-color: $c-success-green;
    }
    &--offline {
      background-color: $c-disabled-grey;
    }
  }
}

.session-control-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.report-button {
  background-color: transparent;
  color: white;
  border: none;
  &:hover {
    background-color: #fff3;
  }
}
.end-button {
  background-color: transparent;
  color: white;
  border-color: white;
  &:hover {
    border-color: white;
    background-color: #fff3;
  }
}
.session-ended {
  padding: 10px 0;
}
</style>
