<template>
  <div
    class="session"
    :class="{ 'session--whiteboard': auxiliaryType === 'WHITEBOARD' }"
  >
    <div class="session-header-container">
      <session-header @try-clicked="tryClicked" />
    </div>
    <div
      v-if="sessionId"
      class="session-contents-container"
      v-bind:class="{
        'session-contents-container--mobile': mobileMode,
      }"
    >
      <div
        class="auxiliary-container"
        id="auxiliary-container"
        v-bind:class="{
          'auxiliary-container--hidden': shouldHideAuxiliarySection,
        }"
      >
        <whiteboard
          ref="whiteboard"
          v-if="auxiliaryType === 'WHITEBOARD'"
          :sessionId="sessionId"
          :isWhiteboardOpen="auxiliaryOpen"
          :toggleWhiteboard="toggleAuxiliary"
          :isSessionOver="isSessionOver"
        />
        <document-editor v-else />
      </div>
      <div
        class="chat-container"
        id="chat-container"
        v-bind:class="{
          'chat-container--hidden': shouldHideChatSection,
        }"
      >
        <div
          v-if="user.isVolunteer && isLoadingPresessionResponse"
          class="about-session-container"
        >
          <loading-message message="Loading" class="about-session-loader" />
        </div>
        <div
          v-else-if="user.isVolunteer && studentPresessionResponses.length > 0"
          class="about-session-container"
        >
          <div class="about-session-button" @click="handleAboutSessionClick">
            About the session
            <caret-icon class="caret" />
          </div>
        </div>
        <div
          v-else-if="
            user.isVolunteer &&
              (showNoPresessionSurveyResponse ||
                studentPresessionResponses.length === 0)
          "
          class="about-session-container"
        >
          <div class="about-session-no-responses">
            No goal found for this session
          </div>
        </div>
        <session-chat
          :shouldHideChatSection="shouldHideChatSection"
          :setHasSeenNewMessage="setHasSeenNewMessage"
        />
      </div>
    </div>
    <div
      v-if="mobileMode"
      class="toggleButton"
      id="toggleButton"
      @click="toggleAuxiliary"
    >
      <div class="toggleButton__wrapper">
        <span
          class="toggleButton__message-indicator"
          v-if="!hasSeenNewMessage"
        ></span>
        <img id="toggleIcon" :src="toggleIconSrc" alt="toggle icon" />
      </div>
    </div>
    <div
      v-if="showPhotoUpload"
      class="toggleButton toggleButton__photo-upload"
      :class="shouldHideChatSection ? 'photo-upload--hidden' : ''"
      @click="openFileDialog"
    >
      <photo-upload-icon class="photo-upload--icon" />
    </div>
    <web-notifications-modal
      v-if="showNotificationModal"
      :closeModal="() => setShowNotificationModal(false)"
    />
    <about-session-modal
      v-if="showAboutSessionModal"
      :closeModal="toggleAboutSessionModal"
      :responses="studentPresessionResponses"
      :totalStudentSessions="totalStudentSessions"
    />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import * as Sentry from '@sentry/browser'
import NetworkService from '@/services/NetworkService'
import SessionService from '@/services/SessionService'
import AnalyticsService from '@/services/AnalyticsService'
import SessionHeader from './SessionHeader'
import SessionChat from './SessionChat'
import Whiteboard from './Whiteboard'
import DocumentEditor from './DocumentEditor'
import SessionFulfilledModal from './SessionFulfilledModal'
import ConnectionTroubleModal from './ConnectionTroubleModal'
import PhotoUploadIcon from '@/assets/whiteboard_icons/photo-upload.svg'
import isOutdatedMobileAppVersion from '@/utils/is-outdated-mobile-app-version'
import CaretIcon from '@/assets/caret.svg'
import WebNotificationsModal from '@/components/WebNotificationsModal'
import AboutSessionModal from './AboutSessionModal'
import getNotificationPermission from '@/utils/get-notification-permission'
import { EVENTS, SESSION_TOOL_TYPES } from '@/consts'
import Gleap from 'gleap'
import { backOff } from 'exponential-backoff'
import LoadingMessage from '@/components/LoadingMessage'
import LoggerService from '@/services/LoggerService'

const activeHeaderData = {
  component: 'SessionHeader',
}

export default {
  name: 'session-view',
  components: {
    SessionHeader,
    SessionChat,
    Whiteboard,
    PhotoUploadIcon,
    DocumentEditor,
    WebNotificationsModal,
    CaretIcon,
    AboutSessionModal,
    LoadingMessage,
  },
  created() {
    if (this.mobileMode) {
      this.$store.dispatch('app/hideNavigation')
    } else {
      this.$store.dispatch('app/header/show', activeHeaderData)
      this.$store.dispatch('app/sidebar/hide')
    }

    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    Gleap.removeCustomData('sessionId')
    window.removeEventListener('resize', this.handleResize)
  },
  /*
   * @notes
   * [1] Refactoring candidate: it'd be awesome if Dashboard could pass
   *     the topic directly
   */
  data() {
    return {
      auxiliaryOpen: false,
      sessionId: null,
      hasSeenNewMessage: true,
      showNotificationModal: false,
      showAboutSessionModal: false,
      studentPresessionResponses: [],
      totalStudentSessions: 0,
      showNoPresessionSurveyResponse: false,
      isLoadingPresessionResponse: false,
    }
  },
  beforeRouteEnter(to, from, next) {
    next(vm => {
      vm.prevRoute = from
    })
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      session: state => state.user.session,
      isSessionConnectionAlive: state => state.user.isSessionConnectionAlive,
      isMobileApp: state => state.app.isMobileApp,
      presessionSurvey: state => state.user.presessionSurvey,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      isAuthenticated: 'user/isAuthenticated',
      isVolunteer: 'user/isVolunteer',
      isSessionOver: 'user/isSessionOver',
    }),

    auxiliaryType() {
      if (this.session.toolType === SESSION_TOOL_TYPES.DOCUMENT_EDITOR)
        return 'DOCUMENT'
      else return 'WHITEBOARD'
    },

    toggleIconSrc() {
      if (this.auxiliaryOpen) return require(`@/assets/Chat.png`)
      else if (this.auxiliaryType === 'WHITEBOARD')
        return require(`@/assets/Pencil.png`)
      else return require(`@/assets/doc_editor_icon.png`)
    },

    shouldHideAuxiliarySection() {
      // Never hide auxiliary section (whiteboard/document) on desktop
      if (!this.mobileMode) {
        return false
      }

      return !this.auxiliaryOpen
    },
    shouldHideChatSection() {
      // Never hide chat section on desktop
      if (!this.mobileMode) {
        return false
      }

      return this.auxiliaryOpen
    },
    showPhotoUpload() {
      if (this.auxiliaryType !== 'WHITEBOARD') return false

      if (!this.isVolunteer && this.mobileMode) {
        if (this.isMobileApp && isOutdatedMobileAppVersion()) return false
        return true
      }

      return false
    },
  },
  async mounted() {
    const {
      body: { isValid },
    } = await NetworkService.getIsSubjectValid(
      this.$route.params.subTopic,
      this.$route.params.topic
    )
    if (!isValid) return this.$router.push('/dashboard')

    const id = this.$route.params.sessionId

    let promise

    if (!id) {
      let type = this.$route.params.topic
      promise = SessionService.newSession(
        this,
        type,
        this.$route.params.subTopic,
        {
          onRetry: (res, abort) => {
            this.showTroubleStartingModal(abort)
          },
        }
      )
    } else {
      promise = SessionService.useExistingSession(this, id, {
        onRetry: (res, abort) => {
          this.showTroubleJoiningModal(abort)
        },
      })
    }

    promise
      .then(async sessionId => {
        this.sessionId = sessionId
        if (!id && !this.isVolunteer)
          AnalyticsService.captureEvent(EVENTS.SESSION_REQUESTED, {
            event: EVENTS.SESSION_REQUESTED,
            sessionId,
            subject: this.$route.params.subTopic,
          })

        // If we have a pre-session survey, submit it now
        if (Object.keys(this.presessionSurvey).length) {
          try {
            await backOff(() =>
              NetworkService.submitSurvey(
                Object.assign({}, this.presessionSurvey, { sessionId })
              )
            )
          } catch (err) {
            Sentry.captureException(err)
          }
          this.$store.dispatch('user/clearPresessionSurvey')
        }

        // ensure we restore user when we get a successful response
        if (!this.isAuthenticated) {
          this.$store.dispatch('user/fetchUser')
        }

        if (!this.$socket.connected) await this.$socket.connect()
        this.joinSession(sessionId)
        Gleap.setCustomData('sessionId', sessionId)
        this.$store.dispatch('user/sessionConnected')

        if (this.user.isVolunteer) {
          await this.getSessionContext(sessionId)
        }

        if (
          (this.user.isVolunteer &&
            (!this.user.isOnboarded || !this.user.isApproved)) ||
          this.isMobileApp
        )
          this.showNotificationModal = false

        if (getNotificationPermission() === 'default')
          this.showNotificationModal = true
      })
      .catch(err => {
        if (err.status !== 0 && err.code !== 'EUSERABORTED') {
          window.alert('Could not start new help session')
          Sentry.captureException(err)
        }
        this.$router.replace('/')
      })
  },
  sockets: {
    bump: function(data) {
      this.$store.dispatch('app/modal/show', {
        component: SessionFulfilledModal,
        data: {
          acceptText: 'Return to Dashboard',
          alertModal: true,
          isSessionEnded: !!data.endedAt,
          volunteerJoined: !!data.volunteer,
          isSessionVolunteer: this.user._id === data.volunteer,
          isSessionStudent: this.user._id === data.student,
        },
      })
    },
    reconnect_attempt() {
      this.$store.dispatch('user/sessionDisconnected')
      if (!this.session || !this.session._id) {
        const abort = () => this.$router.push('/')
        this.showTroubleStartingModal(abort)
      }
    },
    // https://socket.io/docs/v2/client-api/#event-disconnect
    async disconnect(reason) {
      const userType = this.isVolunteer ? 'volunteer' : 'student'
      const err = new Error(
        `Chat socket for the ${userType} in session ${this.sessionId} for reason: ${reason}`
      )
      LoggerService.noticeError(err)

      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        if (!this.$socket.connected) await this.$socket.connect()
        this.joinSession(this.sessionId)
        this.$store.dispatch('user/sessionConnected')
      }
    },
    connect() {
      this.$store.dispatch('user/sessionConnected')
    },
  },
  methods: {
    handleResize() {
      if (this.mobileMode) {
        this.$store.dispatch('app/hideNavigation')
      } else {
        this.$store.dispatch('app/header/show', activeHeaderData)
        this.$store.dispatch('app/sidebar/hide')
      }
    },
    toggleAuxiliary() {
      if (!this.auxiliaryOpen) {
        document.getElementById('toggleButton').classList.add('back')
        this.auxiliaryOpen = true
      } else {
        document.getElementById('toggleButton').classList.remove('back')
        this.auxiliaryOpen = false
      }

      if (this.shouldHideAuxiliarySection) this.hasSeenNewMessage = true
    },
    async joinSession(sessionId) {
      // await nextTick to get access to this.prevRoute and avoid a race condition
      await this.$nextTick()
      this.$socket.emit(
        'join',
        {
          sessionId,
          user: this.user,
          // helps track where volunteers are joining a session from
          // if a volunteer joins using a URL from a text notification, resolve to an empty string
          joinedFrom:
            this.prevRoute && this.prevRoute.name ? this.prevRoute.name : '',
        },
        1
      )
    },
    showTroubleStartingModal(abort) {
      const TROUBLE_STARTING_MESSAGE = `
        The system seems to be having a problem starting your new session.
        Please check your Internet connection.
      `

      this.showConnectionTroubleModal(abort, TROUBLE_STARTING_MESSAGE)
    },
    showTroubleJoiningModal(abort) {
      const TROUBLE_JOINING_MESSAGE = `
        The system seems to be having a problem joining your session.
        Please check your Internet connection.
      `

      this.showConnectionTroubleModal(abort, TROUBLE_JOINING_MESSAGE)
    },
    showConnectionTroubleModal(abort, message) {
      this.$store.dispatch('app/modal/show', {
        component: ConnectionTroubleModal,
        data: {
          message,
          acceptText: 'Abort Session',
          alertModal: true,
          abortFunction: abort,
        },
      })
    },
    tryClicked() {
      this.sessionReconnecting = true
    },
    openFileDialog(event) {
      this.$refs.whiteboard.openFileDialog(event)
    },
    setHasSeenNewMessage(value) {
      this.hasSeenNewMessage = value
    },
    setShowNotificationModal(value) {
      this.showNotificationModal = value
    },
    handleAboutSessionClick() {
      AnalyticsService.captureEvent(EVENTS.VOLUNTEER_CLICKED_ABOUT_SESSION)
      this.toggleAboutSessionModal()
    },
    toggleAboutSessionModal() {
      this.showAboutSessionModal = !this.showAboutSessionModal
    },
    async getSessionContext(sessionId) {
      try {
        this.isLoadingPresessionResponse = true
        const presessionSurveyResponse = await NetworkService.getPresessionSurveyResponse(
          sessionId
        )
        this.totalStudentSessions =
          presessionSurveyResponse.data.totalStudentSessions
        this.studentPresessionResponses =
          presessionSurveyResponse.data.responses
      } catch (err) {
        this.showNoPresessionSurveyResponse = true
      } finally {
        this.isLoadingPresessionResponse = false
      }
    },
  },
  watch: {
    isSessionConnectionAlive(newValue, oldValue) {
      if (newValue && !oldValue) {
        this.$store.dispatch('app/modal/hide')
      }
    },
  },
}
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

  &--whiteboard {
    .toggleButton.back {
      bottom: calc(100% - 140px);
      right: 35px;
    }
  }
}

.session-header-container {
  position: fixed;
  z-index: 3;
  top: 0;
  left: 0;
  width: 100%;
  background: #fff;

  @include breakpoint-above('medium') {
    position: absolute;
    top: 20px;
    left: unset;
    right: 20px;
    width: 300px;
    height: 70px;
    background: #fff;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    overflow: hidden;
  }

  @include breakpoint-above('large') {
    width: 400px;
  }
}

.session-contents-container {
  height: 100%;
  padding-top: 100px;
  display: flex;
  background: $c-background-grey;

  @include breakpoint-above('medium') {
    padding: 20px;
    @include child-spacing(right, 15px);
  }

  @include breakpoint-below('medium') {
    padding-top: 80px;
  }
}

.about-session {
  &-container {
    background-color: $light-blue-background;
    z-index: 1;
    padding: 0.75em 0.6em;
    width: 100%;
    @include flex-container(row);
  }

  &-button {
    @include font-category('subheading');
    background-color: $light-blue-background;

    &:hover {
      background-color: rgba(196, 196, 196, 0.2);
      cursor: pointer;
    }

    border-radius: 4px;
    padding: 0.4rem 0.5rem;
  }

  &-no-responses {
    @include font-category('subheading');
    padding: 0.4rem 0.5rem;
  }

  &-loader {
    @include font-category('subheading');
    padding: 0.4rem 0.5rem;
  }
}

.auxiliary-container,
.chat-container {
  @include breakpoint-above('medium') {
    border-radius: 8px;
    overflow: hidden;
  }

  @include breakpoint-below('medium') {
    width: 100%;
  }
}

.auxiliary-container {
  background: #fff;
  padding: 0;
  flex-grow: 1;
  overflow: hidden;
  position: relative;

  // TODO: research performance implications of position: absolute
  // vs alternatives and how they impact DOM reflow triggers
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
  max-width: 100%;
  display: flex;
  flex-direction: column;

  &--hidden {
    display: none;
  }

  @include breakpoint-above('medium') {
    min-width: 300px;
    flex-basis: 300px;
    position: relative;
    // offsets the session-header height
    padding-top: 70px;
  }

  @include breakpoint-above('large') {
    min-width: 400px;
    flex-basis: 400px;
  }
}

.toggleButton,
.toggleButton__photo-upload {
  position: fixed;
  z-index: 3;
  bottom: 10px;
  right: 20px;
  border-radius: 20px;
  background-color: #16d2aa;
  width: 40px;
  height: 40px;
  transition: 0.4s;

  @include breakpoint-below('medium') {
    bottom: 40px;
  }

  &__photo-upload {
    background-color: white;
    border: 1px solid $c-border-grey;
    right: 80px;
  }

  img,
  svg {
    margin-top: 7px;
    width: 26px;
    height: 26px;
  }
}

.toggleButton__wrapper {
  position: relative;
}

.toggleButton__message-indicator {
  position: absolute;
  display: inline-block;
  width: 10px;
  height: 10px;
  background-color: $c-error-red;
  top: 0;
  right: 0;
  border-radius: 50%;
}

.photo-upload--hidden {
  display: none !important;
}

.photo-upload--icon {
  margin-top: 5px !important;
}

.caret {
  fill: #000;
}
</style>
