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
      <ai-widget-tool
        v-if="showAiWidget"
        @minimize="minimizeAiWidget"
        @dragging="draggingAiWidget"
        @resizing="resizingAiWidget"
      />
      <div
        class="auxiliary-container"
        id="auxiliary-container"
        v-bind:class="{
          'auxiliary-container--hidden': shouldHideAuxiliarySection,
        }"
      >
        <whiteboard
          ref="whiteboard"
          v-if="auxiliaryType === sessionToolTypes.WHITEBOARD"
          :sessionId="sessionId"
          :isWhiteboardOpen="auxiliaryOpen"
          :toggleWhiteboard="toggleAuxiliary"
          :isSessionOver="isSessionOver"
          :aiWidgetHidden="aiWidgetHidden"
          @toggleAiWidget="toggleAiWidget"
          :aiWidgetEnabled="aiWidgetEnabled"
          :showHasAiMessageIndicator="hasUnreadAiTutorMessage"
          :aiWidgetMoving="aiWidgetDragging || aiWidgetResizing"
        />
        <document-editor-v2
          v-else-if="
            auxiliaryType === sessionToolTypes.DOCUMENT_EDITOR &&
            docEditorVersion === 2
          "
          :sessionId="this.sessionId"
        />
        <document-editor
          v-else-if="auxiliaryType === sessionToolTypes.DOCUMENT_EDITOR"
          :sessionId="this.sessionId"
        />
      </div>
      <div
        class="chat-container"
        id="chat-container"
        v-bind:class="{
          'chat-container--hidden': shouldHideChatSection,
        }"
      >
        <div
          v-if="showSessionMetadataContainer"
          class="about-session-container"
        >
          <loading-message
            v-if="isLoadingSessionMetadata"
            message="Loading"
            class="about-session-loader"
          />
          <div v-else>
            <div
              v-if="isStudent && showReviewWarning"
              class="about-session-button"
              @click="handleReviewWarningClick"
              role="button"
            >
              Session will be reviewed
              <caret-icon class="caret" />
            </div>
            <div
              v-if="studentAssignment"
              class="about-session-button"
              @click="showAssignmentDetail"
              role="button"
            >
              Assignment details
              <caret-icon class="caret" />
            </div>
            <div
              v-else-if="isVolunteer && studentPresessionResponses.length > 0"
              class="about-session-button"
              @click="handleAboutSessionClick"
            >
              About the session
              <caret-icon class="caret" />
            </div>
            <div
              v-else-if="isVolunteer && studentPresessionResponses.length === 0"
              class="about-session-no-responses"
            >
              No goal found for this session
            </div>
          </div>
          <question-mark-icon
            v-if="mobileMode"
            @click="openHelp"
            class="help-icon"
          />
        </div>
        <session-chat
          :aiWidgetPresent="aiWidgetEnabled"
          :currentSession="session"
          :shouldHideChatSection="shouldHideChatSection"
          :setHasSeenNewMessage="setHasSeenNewMessage"
          :isSessionConnectionAlive="isSessionConnectionAlive"
          :isSessionAlive="isSessionAlive"
          :sessionHasEnded="sessionHasEnded"
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
        <img
          v-if="auxiliaryOpen"
          id="toggleIcon"
          src="@/assets/Chat.png"
          alt="toggle icon"
        />
        <img
          v-else-if="auxiliaryType === sessionToolTypes.WHITEBOARD"
          id="toggleIcon"
          src="@/assets/Pencil.png"
          alt="toggle icon"
        />
        <img
          v-else
          id="toggleIcon"
          src="@/assets/doc_editor_icon.png"
          alt="toggle icon"
        />
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
    <ai-assisted-tutoring-modal
      v-if="showAiAssistedTutoringModal"
      :isVolunteer="user.isVolunteer"
      :closeModal="() => setShowAiAssistedTutoringModal(false)"
    />
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
    <assignment-detail-modal
      v-if="showAssignmentDetailModal"
      :closeModal="toggleAssignmentDetailModal"
      :assignment="studentAssignment"
    />
    <fall-incentive-review-warning-modal
      v-if="showFallIncentiveReviewWarningModal"
      :closeModal="toggleFallIncentiveReviewWarningModal"
    />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import NetworkService from '@/services/NetworkService'
import SessionService from '@/services/SessionService'
import AnalyticsService from '@/services/AnalyticsService'
import SessionHeader from './SessionHeader.vue'
import SessionChat from './SessionChat/index.vue'
import AiWidgetTool from './AiWidgetTool/index.vue'
import Whiteboard from './Whiteboard.vue'
import DocumentEditor from './DocumentEditor.vue'
import DocumentEditorV2 from './DocumentEditorV2.vue'
import ConnectionTroubleModal from './ConnectionTroubleModal.vue'
import PhotoUploadIcon from '@/assets/whiteboard_icons/photo-upload.svg'
import isOutdatedMobileAppVersion from '@/utils/is-outdated-mobile-app-version'
import CaretIcon from '@/assets/caret.svg'
import QuestionMarkIcon from '@/assets/question-mark-icon.svg'
import WebNotificationsModal from '@/components/WebNotificationsModal.vue'
import AiAssistedTutoringModal from './AiAssistedTutoringModal.vue'
import AboutSessionModal from './AboutSessionModal.vue'
import AssignmentDetailModal from './AssignmentDetailModal.vue'
import FallIncentiveReviewWarningModal from './FallIncentiveReviewWarningModal.vue'
import getNotificationPermission from '@/utils/get-notification-permission'
import { EVENTS, SESSION_TOOL_TYPES } from '@/consts'
import Gleap from 'gleap'
import { backOff } from 'exponential-backoff'
import LoadingMessage from '@/components/LoadingMessage.vue'
import LoggerService from '@/services/LoggerService'
import { socket } from '@/socket'
import FeatureFlagService from '@/services/FeatureFlagService'
import { POSTHOG_FEATURE_FLAGS, AI_TUTOR_SUPPORTED_SUBJECTS } from '@/consts'

const activeHeaderData = {
  component: 'SessionHeader',
}

export default {
  name: 'session-view',
  components: {
    AiWidgetTool,
    AiAssistedTutoringModal,
    SessionHeader,
    SessionChat,
    Whiteboard,
    PhotoUploadIcon,
    DocumentEditor,
    DocumentEditorV2,
    WebNotificationsModal,
    CaretIcon,
    AboutSessionModal,
    LoadingMessage,
    QuestionMarkIcon,
    FallIncentiveReviewWarningModal,
    AssignmentDetailModal,
  },
  created() {
    if (this.mobileMode) {
      this.$store.dispatch('app/hideNavigation')
      try {
        Gleap.showFeedbackButton(false)
      } catch {
        LoggerService.noticeError('Failed when hiding Gleap feedback button')
      }
    } else {
      this.$store.dispatch('app/header/show', activeHeaderData)
      this.$store.dispatch('app/sidebar/hide')
    }

    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    socket.emit('sessions:leave', {
      sessionId: this.sessionId,
    })
    Gleap.removeCustomData('sessionId')
    Gleap.showFeedbackButton(true)
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
      showAssignmentDetailModal: false,
      studentAssignment: null,
      studentPresessionResponses: [],
      totalStudentSessions: 0,
      isLoadingSessionMetadata: false,
      isFetchingIsSessionRecapEligible: false,
      sessionHasEnded: false,
      showFallIncentiveReviewWarningModal: false,
      unsubscribeFromActionSubscription: () => undefined,
      aiWidgetHidden: true,
      gettingTutorBotConversation: false,
      aiWidgetEnabled: false,
      hasUnreadAiTutorMessage: false,
      showAiAssistedTutoringModal: false,
      aiWidgetDragging: false,
      aiWidgetResizing: false,
      didAutoOpen: false,
    }
  },
  beforeRouteEnter(to, from, next) {
    next((vm) => {
      vm.prevRoute = from
    })
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      session: (state) => state.user.session,
      isSessionConnectionAlive: (state) => state.user.isSessionConnectionAlive,
      isMobileApp: (state) => state.app.isMobileApp,
      presessionSurvey: (state) => state.user.presessionSurvey,
      docEditorVersion: (state) => state.user.session.docEditorVersion,
      auxiliaryType: (state) => state.user.session.toolType,
      isConnected: (state) => state.socket.isConnected,
      productFlags: (state) => state.productFlags.flags,
      isFetchingConversation: (state) =>
        state.botConversations.isFetchingConversation,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      isAuthenticated: 'user/isAuthenticated',
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      isSessionOver: 'user/isSessionOver',
      isSessionAlive: 'user/isSessionAlive',
      isSessionRecapDmsActive: 'featureFlags/isSessionRecapDmsActive',
      shouldUseQuillV2: 'featureFlags/shouldUseQuillV2',
      isTutorBotChatEnabled: 'featureFlags/isTutorBotChatEnabled',
      isFallIncentiveProgramEnabled:
        'featureFlags/isFallIncentiveProgramEnabled',
      currentTutorBotConversation: 'botConversations/currentConversation',
    }),
    aiTutorSetupProps() {
      return {
        currentTutorBotConversationId:
          this.currentTutorBotConversation?.sessionId,
        aiWidgetEnabled: this.aiWidgetEnabled,
        sessionId: this.sessionId,
      }
    },

    sessionToolTypes() {
      return SESSION_TOOL_TYPES
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

      if (this.isStudent && this.mobileMode) {
        if (this.isMobileApp && isOutdatedMobileAppVersion()) return false
        return true
      }

      return false
    },
    isConnectionReady() {
      return [this.isConnected, this.sessionId]
    },
    showAiWidget() {
      return (
        this.currentTutorBotConversation.conversationId &&
        this.aiWidgetEnabled &&
        !this.aiWidgetHidden
      )
    },
    showReviewWarning() {
      return (
        this.isFallIncentiveProgramEnabled &&
        this.productFlags.fallIncentiveEnrollmentAt
      )
    },
    showSessionMetadataContainer() {
      return (
        this.isLoadingSessionMetadata ||
        (this.isStudent && this.showReviewWarning) ||
        this.studentAssignment ||
        this.isVolunteer ||
        this.mobileMode
      )
    },
    maybeShowNewAiTutorIndicator() {
      return {
        aiWidgetHidden: this.aiWidgetHidden,
        messagesLength: this.currentTutorBotConversation?.messages?.length ?? 0,
      }
    },
  },
  async mounted() {
    const {
      data: { isValid },
    } = await NetworkService.getIsSubjectValid(
      this.$route.params.subTopic,
      this.$route.params.topic
    )
    if (!isValid) return this.$router.push('/dashboard')

    const id = this.$route.params.sessionId
    const assignmentId = this.$route.query.assignmentId

    let promise

    if (!id) {
      let type = this.$route.params.topic
      const options = {
        onRetry: (res, abort) => {
          this.showTroubleStartingModal(abort)
        },
      }

      if (this.shouldUseQuillV2) {
        options.docEditorVersion = 2
      }

      if (assignmentId) {
        options.assignmentId = assignmentId
      }

      promise = SessionService.newSession(
        this,
        type,
        this.$route.params.subTopic,
        options
      )
    } else {
      promise = SessionService.useExistingSession(this, id, {
        onRetry: (res, abort) => {
          this.showTroubleJoiningModal(abort)
        },
      })
    }

    promise
      .then(async (sessionId) => {
        this.sessionId = sessionId

        const transferringFromTutorBot = Object.prototype.hasOwnProperty.call(
          this.$route.query,
          'tutorBotConversationId'
        )
        if (transferringFromTutorBot) {
          const tutorBotConversationId =
            this.$route.query.tutorBotConversationId
          await NetworkService.updateTutorBotConversationWithSessionId(
            tutorBotConversationId,
            { conversationId: tutorBotConversationId, sessionId }
          )
        }

        if (!id && this.isStudent)
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
            LoggerService.noticeError(err)
          }
          this.$store.dispatch('user/clearPresessionSurvey')
        }

        // ensure we restore user when we get a successful response
        if (!this.isAuthenticated) {
          this.$store.dispatch('user/fetchUser')
        }

        if (!socket.connected) await socket.connect()
        Gleap.setCustomData('sessionId', sessionId)

        await this.getSessionContext(sessionId)

        if (
          (this.isVolunteer &&
            (!this.user.isOnboarded || !this.user.isApproved)) ||
          this.isMobileApp
        )
          this.showNotificationModal = false

        if (getNotificationPermission() === 'default')
          this.showNotificationModal = true
      })
      .catch((err) => {
        if (err?.response?.status !== 0 && err.code !== 'EUSERABORTED') {
          window.alert('Could not start new help session')
          LoggerService.noticeError(err)
        }
        this.$router.replace('/')
      })
  },
  watch: {
    session({ student, subTopic }) {
      /*
       * Since this is only rolled out to students,
       * we have to check to see if the student involved in this
       * session is elgible, if they are, we can also enable it for
       * the volunteer
       */
      FeatureFlagService.isFeatureEnabledForUser(
        POSTHOG_FEATURE_FLAGS.AI_TUTOR,
        student.id
      ).then((r) => {
        const isValidSubject = AI_TUTOR_SUPPORTED_SUBJECTS.includes(subTopic)
        this.aiWidgetEnabled =
          ['stand-alone-in-session', 'stand-alone-in-session-handoff'].includes(
            r.isEnabled
          ) && isValidSubject
        if (!localStorage.getItem('seen-ai-assisted-modal')) {
          this.setShowAiAssistedTutoringModal(aiWidgetEnabled)
        }
      })
    },

    async aiTutorSetupProps({
      currentTutorBotConversationSessionId,
      aiWidgetEnabled,
      sessionId,
      isFetchingConversation,
    }) {
      if (
        (!currentTutorBotConversationSessionId ||
          currentTutorBotConversationSessionId !== sessionId) &&
        aiWidgetEnabled &&
        !isFetchingConversation &&
        sessionId
      ) {
        this.$store.commit('botConversations/setIsFetchingConversation', true)
        const { data: conversation } =
          await NetworkService.getOrCreateTutorBotConversationWithMessagesBySessionId(
            sessionId
          )
        await this.$store.dispatch(
          'botConversations/setConversation',
          conversation.conversationId
        )

        this.$store.commit('botConversations/setIsFetchingConversation', false)

        if (
          !this.mobileMode &&
          this.aiWidgetEnabled &&
          this.currentTutorBotConversation?.messages?.length > 0 &&
          !this.didAutoOpen
        ) {
          this.aiWidgetHidden = false
          this.didAutoOpen = true
        }
      }
    },
    aiWidgetDragging(dragging) {
      if (!dragging)
        AnalyticsService.captureEvent(EVENTS.AI_TUTOR_WIDGET_DRAGGED)
    },
    aiWidgetResizing(resizing) {
      if (!resizing)
        AnalyticsService.captureEvent(EVENTS.AI_TUTOR_WIDGET_RESIZED)
    },
    auxiliaryOpen(isOpen) {
      if (!isOpen) {
        this.aiWidgetHidden = true
      }
    },
    maybeShowNewAiTutorIndicator(current, prev) {
      if (
        current.aiWidgetHidden &&
        current.messagesLength > prev.messagesLength
      ) {
        this.hasUnreadAiTutorMessage = true
      } else {
        this.hasUnreadAiTutorMessage = false
      }
    },
    reconnectAttempts(prev, current) {
      if (current > prev) {
        this.$store.dispatch('user/sessionDisconnected')
        if (!this.session || !this.session._id) {
          const abort = () => this.$router.push('/')
          this.showTroubleStartingModal(abort)
        }
      }
    },
    isConnectionReady(currentValue, prevValue) {
      const [isConnected, sessionId] = currentValue
      const [prevIsConnected] = prevValue
      if (isConnected && sessionId) {
        this.joinSession(this.sessionId)
        this.$store.dispatch('user/sessionConnected')
      }

      if (isConnected && !prevIsConnected)
        AnalyticsService.captureEvent(
          EVENTS.USER_SOCKET_IS_CONNECTED_IN_SESSION,
          {
            event: EVENTS.USER_SOCKET_IS_CONNECTED_IN_SESSION,
            sessionId: this.sessionId,
          }
        )
      if (!isConnected && prevIsConnected)
        AnalyticsService.captureEvent(
          EVENTS.USER_SOCKET_IS_DISCONNECTED_IN_SESSION,
          {
            event: EVENTS.USER_SOCKET_IS_DISCONNECTED_IN_SESSION,
            sessionId: this.sessionId,
          }
        )
    },
    isSessionConnectionAlive(newValue, oldValue) {
      if (newValue && !oldValue) {
        this.$store.dispatch('app/modal/hide')
      }
    },
    mobileMode(isMobileMode) {
      Gleap.showFeedbackButton(!isMobileMode)
    },
    // Once session has ended, show chatbot to tutor
    async 'session.endedAt'(newValue, oldValue) {
      if (newValue && !oldValue) this.sessionHasEnded = true
    },
  },
  methods: {
    toggleAiWidget() {
      const event = this.aiWidgetHidden
        ? EVENTS.AI_TUTOR_WIDGET_TOOLBAR_BUTTON_OPEN
        : EVENTS.AI_TUTOR_WIDGET_TOOLBAR_BUTTON_CLOSE
      AnalyticsService.captureEvent(event)
      this.aiWidgetHidden = !this.aiWidgetHidden
    },
    minimizeAiWidget() {
      AnalyticsService.captureEvent(EVENTS.AI_TUTOR_WIDGET_MINIMIZE)
      this.aiWidgetHidden = true
    },
    draggingAiWidget(dragging) {
      this.aiWidgetDragging = dragging
    },
    resizingAiWidget(resizing) {
      this.aiWidgetResizing = resizing
    },
    handleResize() {
      if (this.mobileMode) {
        this.$store.dispatch('app/hideNavigation')
        if (!this.auxiliaryOpen) this.aiWidgetHidden = true
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
      socket.emit(
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
    setShowAiAssistedTutoringModal(value) {
      this.showAiAssistedTutoringModal = value
    },
    setShowNotificationModal(value) {
      this.showNotificationModal = value
    },
    showAssignmentDetail() {
      AnalyticsService.captureEvent(
        EVENTS.USER_CLICKED_TO_VIEW_SESSION_ASSIGNMENT_DETAILS,
        {
          userType: this.user.userType,
        }
      )
      this.toggleAssignmentDetailModal()
    },
    handleAboutSessionClick() {
      AnalyticsService.captureEvent(EVENTS.VOLUNTEER_CLICKED_ABOUT_SESSION)
      this.toggleAboutSessionModal()
    },
    handleReviewWarningClick() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_FALL_INCENTIVE_REVIEW_SESSION_INFORMATION_CLICKED
      )
      this.toggleFallIncentiveReviewWarningModal()
    },
    toggleAssignmentDetailModal() {
      this.showAssignmentDetailModal = !this.showAssignmentDetailModal
    },
    toggleAboutSessionModal() {
      this.showAboutSessionModal = !this.showAboutSessionModal
    },
    toggleFallIncentiveReviewWarningModal() {
      this.showFallIncentiveReviewWarningModal =
        !this.showFallIncentiveReviewWarningModal
    },
    async getSessionContext(sessionId) {
      try {
        this.isLoadingSessionMetadata = true

        if (this.isVolunteer) {
          const presessionSurveyResponse =
            await NetworkService.getPresessionSurveyResponse(sessionId)
          this.totalStudentSessions =
            presessionSurveyResponse.data.totalStudentSessions
          this.studentPresessionResponses =
            presessionSurveyResponse.data.responses
        }

        const {
          data: { assignment },
        } = await NetworkService.getAssignmentForSession(sessionId)
        this.studentAssignment = assignment
      } catch (err) {
        this.isLoadingSessionMetadata = false
      } finally {
        this.isLoadingSessionMetadata = false
      }
    },
    openHelp() {
      Gleap.open()
      AnalyticsService.captureEvent(EVENTS.USER_CLICKED_IN_SESSION_HELP)
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
    @include flex-container(row, space-between, center);
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
  text-align: center;

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

.help-icon {
  width: 30px;
  height: 30px;
  margin-left: auto;
  fill: $c-information-blue;
  transition: scale 0.2s ease-in-out;

  &:hover {
    cursor: pointer;
    transform: scale(1.1);
  }
}
</style>
