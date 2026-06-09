<template>
  <div
    class="session"
    :class="{ 'session--whiteboard': auxiliaryType === 'WHITEBOARD' }"
  >
    <div
      v-if="exclusiveVolunteerId && !session?.volunteerId"
      class="exclusive-session-banner"
    >
      <span class="exclusive-session-banner__text">
        Your session is currently visible only to your requested tutor. Tap
        "Open to all tutors" to get help faster from any available tutor.
      </span>
      <large-button
        variant="primary-blue"
        :showArrow="false"
        @click="confirmBreakout('banner')"
      >
        Open to all tutors
      </large-button>
    </div>
    <breakout-prompt-modal
      v-if="showBreakoutPrompt"
      :closeModal="dismissBreakoutPrompt"
      @confirm="confirmBreakout('prompt-modal')"
    />
    <div
      v-if="sessionId"
      class="session-contents-container"
      v-bind:class="{
        'session-contents-container--mobile': mobileMode,
      }"
      ref="sessionContentsContainerMobile"
    >
      <ai-widget-tool
        v-if="showAiWidget"
        @minimize="minimizeAiWidget"
        @dragging="draggingAiWidget"
        @resizing="resizingAiWidget"
      />
      <screen-share
        v-if="
          meetingActor.snapshot.context.sessionId && !!mobileMode
            ? this.$refs.sessionContentsContainerMobile
            : this.$refs.auxiliaryContainer
        "
        :class="{ 'display-none': !screenShareActive }"
        :isViewingPartnerScreenShare="isViewingPartnerScreenShare"
        :firstName="
          isViewingPartnerScreenShare
            ? sessionPartner.firstName
            : user?.firstName
        "
        :meetingActor="meetingActor"
        @dragging="(value) => (draggingScreenShare = value)"
        @resizing="(value) => (resizingScreenShare = value)"
        :screenShareWidth="meetingActor.snapshot.context.screenShareWidth"
        :screenShareHeight="meetingActor.snapshot.context.screenShareHeight"
        :screenShareActive="screenShareActive"
      />
      <ModerationInfractionToast
        :show="showModerationInfractionToast"
        :on-dismiss="dismissModerationInfraction"
        :on-click-more-info="toggleModerationInfractionModal"
      />
      <ModerationInfractionModal
        v-if="showModerationInfractionModal"
        @close="toggleModerationInfractionModal"
        :moderation-infraction="moderationInfraction"
      />

      <PartnerAckScreenShareInfractionModal />
      <AckPartnerIntiatedPotentialBan />

      <div
        class="auxiliary-container"
        ref="auxiliaryContainer"
        id="auxiliary-container"
        :class="{
          'auxiliary-container--hidden': shouldHideAuxiliarySection,
          /*
           * since whiteboard is a sibling to screen share, stopPropagation on mousemove events do not work.
           * we are manually disabling pointer events on the whiteboard when the screen share is being dragged
           * or resized to prevent any stray whiteboard marks from being drawn
           */
          'no-pointer-events':
            draggingScreenShare ||
            resizingScreenShare ||
            aiWidgetDragging ||
            aiWidgetResizing,
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
          @clickedShareScreen="toggleScreenShareWindow"
          :isScreenSharing="isScreenSharing"
          :isViewingPartnerScreenShare="isViewingPartnerScreenShare"
          :isLoadingScreenShareControl="isLoadingScreenShareControl"
          :unableToJoinMediaRoom="unableToJoinMediaRoom"
          :meetingHasNotEnded="meetingHasNotEnded"
          :isZwibserveSession="isZwibserveSession"
        />

        <document-editor-v2
          v-else-if="
            auxiliaryType === sessionToolTypes.DOCUMENT_EDITOR &&
            docEditorVersion === 2
          "
          :sessionId="this.sessionId"
          :isAiWidgetEnabled="aiWidgetEnabled"
          :onWidgetClicked="toggleAiWidget"
          :showHasAiMessageIndicator="hasUnreadAiTutorMessage"
          @clickedShareScreen="toggleScreenShareWindow"
          :isScreenSharing="isScreenSharing"
          :isViewingPartnerScreenShare="isViewingPartnerScreenShare"
          :isLoadingScreenShareControl="isLoadingScreenShareControl"
          :unableToJoinMediaRoom="unableToJoinMediaRoom"
          :hasMeetingEnded="meetingHasNotEnded"
        />
        <!--
        NOTE: this editor is used by the volunteer when the student is using the midtown app
        as midtown is stuck on an older version of Quill
      -->
        <document-editor
          v-else-if="auxiliaryType === sessionToolTypes.DOCUMENT_EDITOR"
          :sessionId="this.sessionId"
        />
      </div>

      <div class="session-header-container">
        <session-chat-header v-if="!isSessionInProgress" />

        <LiveMediaChatHeader
          v-else-if="isSessionInProgress"
          class="live-media-header-container"
          :isMyMicMuted="isMyMicMuted"
          :isSpeakerMuted="isSpeakerMuted"
          :isPartnerSpeaking="isPartnerSpeaking"
          :partnerPresence="partnerPresence"
          :partnerMicStatus="partnerMicStatus"
          :partnerCanUseMic="partnerCanUseMic"
          :unableToJoinMediaRoom="unableToJoinMediaRoom"
          :isBanned="isLiveMediaBanned"
          :isLoadingMicControl="isLoadingMicControl"
          :isLoadingSpeakerControl="isLoadingSpeakerControl"
          :unableToJoinAudio="unableToJoinAudio"
          :isSpeaking="isSpeaking"
          :micState="micState"
          @toggleMuteSelf="toggleMuteSelf"
          @toggleMutePartner="toggleMutePartner"
          @audioUiLoaded="onAudioUiLoaded"
          :isFavoriteVolunteer="isFavoriteVolunteer"
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
              {{ isStudent ? `Your assignment` : `About the session` }}
              <caret-icon class="caret" />
            </div>
            <div
              v-else-if="
                isVolunteer &&
                (studentPresessionResponses.length ||
                  totalStudentSessions ||
                  session.student.gradeLevel)
              "
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
          <router-link
            v-if="
              isVolunteer &&
              previousSessionCountWithStudent > 0 &&
              session.student?.firstName
            "
            class="session-history-link"
            :to="`/sessions/history?studentId=${session.studentId}&volunteerId=${session.volunteerId}`"
            >History with {{ session.student.firstName }}</router-link
          >
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
          :isSocketSessionRoomConnected="isSocketSessionRoomConnected"
          :isSessionAlive="isSessionAlive"
          :sessionHasEnded="sessionHasEnded"
          :isExclusiveSession="!!exclusiveVolunteerId && !session?.volunteerId"
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
    <ModerationDisclaimerModal
      v-if="showScreenShareDisclaimer"
      :isOpen="showScreenShareDisclaimer"
      @accept="onAcceptScreenShareTerms"
      @cancel="onDeclineScreenShareTerms"
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
      :isStudent="isStudent"
    />
    <fall-incentive-review-warning-modal
      v-if="showFallIncentiveReviewWarningModal"
      :closeModal="toggleFallIncentiveReviewWarningModal"
    />
  </div>
</template>

<script>
import { ref, markRaw, onBeforeUnmount } from 'vue'
import { mapState, mapGetters } from 'vuex'
import AnalyticsService from '@/services/AnalyticsService'
import ModalService from '@/services/ModalService'
import NetworkService from '@/services/NetworkService'
import SessionService from '@/services/SessionService'
import SessionChatHeader from './SessionChatHeader.vue'
import SessionChat from './SessionChat/index.vue'
import AiWidgetTool from './AiWidgetTool/index.vue'
import { defineAsyncComponent } from 'vue'
const Whiteboard = defineAsyncComponent(() => import('./Whiteboard.vue'))
const DocumentEditor = defineAsyncComponent(
  () => import('./DocumentEditor.vue')
)
const DocumentEditorV2 = defineAsyncComponent(
  () => import('./DocumentEditorV2.vue')
)
import CaretIcon from '@/assets/caret.svg'
import QuestionMarkIcon from '@/assets/question-mark-icon.svg'
import WebNotificationsModal from '@/components/WebNotificationsModal.vue'
import AboutSessionModal from './AboutSessionModal.vue'
import BreakoutPromptModal from './BreakoutPromptModal.vue'
import LargeButton from '@/components/LargeButton.vue'
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
import { POSTHOG_FEATURE_FLAGS } from '@/consts'
import LiveMediaChatHeader from '@/components/ScreenShare/LiveMediaChatHeader.vue'
import ScreenShare from '@/components/ScreenShare/ScreenShare.vue'
import { useActor } from '@xstate/vue'
import * as MeetingMachine from '@/state-machines/meeting-machine'
import SpeakerFilledIcon from '@/assets/voice_message_icons/speaker-filled.svg'
import ModerationInfractionModal from '@/components/Moderation/ModerationInfractionModal.vue'
import PartnerAckScreenShareInfractionModal from '@/components/Moderation/PartnerAckScreenShareInfractionModal.vue'
import AckPartnerIntiatedPotentialBan from '@/components/Moderation/AckPartnerIntiatedPotentialBan.vue'
import ModerationInfractionToast from '@/components/Moderation/ModerationInfractionToast.vue'
import ModerationDisclaimerModal from '@/views/SessionView/ModerationDisclaimerModal.vue'
import { SessionErrorType } from '@/views/SessionView/SessionErrorModal.vue'
import {
  hasSeenScreenShareDisclaimerThisSession,
  setHasSeenScreenShareDisclaimerThisSession,
} from '@/utils/session'
//import { createBrowserInspector } from '@statelyai/inspect'

const meetingActor = ref(null)
export default {
  name: 'session-view',
  components: {
    ModerationDisclaimerModal,
    ModerationInfractionToast,
    ModerationInfractionModal,
    ScreenShare,
    AiWidgetTool,
    SessionChatHeader,
    SessionChat,
    Whiteboard,
    DocumentEditor,
    DocumentEditorV2,
    WebNotificationsModal,
    CaretIcon,
    AboutSessionModal,
    LoadingMessage,
    QuestionMarkIcon,
    FallIncentiveReviewWarningModal,
    AssignmentDetailModal,
    BreakoutPromptModal,
    LargeButton,
    LiveMediaChatHeader,
    PartnerAckScreenShareInfractionModal,
    AckPartnerIntiatedPotentialBan,
  },

  setup() {
    /**
     * We use the useActor hook from xstate/vue to attach the actor to the component lifecycle.
     * Before we lose the actor, we want to make sure it sends a final meeting_ended event which will
     * trigger any cleanup we need to do (i.e. ending ongoing moderation processes).
     *
     * The problem is useActor() is registered before beforeUnmount, and will therefore drop the actor before
     * we can use it to send that final event.
     * As a workaround, we use onBeforeUnmount which happens to get registered and run before useActor.
     */
    onBeforeUnmount(() => {
      meetingActor.value.actorRef.send({ type: 'meeting_ended' })
    })

    // NOTE: to use xstate live machine inspector:
    // remove comment from inspector import

    // pass the inspector to the actor
    // const options = { inspect: createBrowserInspector().inspect }
    // meetingActor.value = useActor(MeetingMachine.create(), options)

    meetingActor.value = useActor(MeetingMachine.create())
  },

  beforeRouteEnter(_, from, next) {
    next((vm) => {
      vm.prevRoute = from
    })
  },

  async created() {
    try {
      const requestedVolunteerId = this.$route.query?.requestedVolunteerId
      const { session, isZwibserveSession, exclusiveVolunteerId } =
        await SessionService.createOrJoinSession(
          this.$route.params.topic,
          this.$route.params.subTopic,
          this.$route.params.sessionId,
          this.$route.query?.assignmentId,
          this.prevRoute?.name ?? '',
          requestedVolunteerId
        )

      this.sessionId = session.id
      this.isZwibserveSession = isZwibserveSession
      // Prefer the backend-derived value (survives page refresh)
      this.exclusiveVolunteerId = exclusiveVolunteerId || requestedVolunteerId
      if (this.exclusiveVolunteerId) this.handleBreakoutPrompt()
      await this.linkTransferredTutorBotConversation(session.id)

      if (this.journeySessionData) {
        AnalyticsService.captureEvent(EVENTS.GUIDED_JOURNEY_SESSION_REQUESTED, {
          ...this.journeySessionData,
          sessionId: this.sessionId,
        })
        await this.$store.commit('session/setJourneySessionData', undefined)
      }

      if (this.isStudentVolunteer) {
        if (this.isVolunteer) {
          AnalyticsService.captureEvent(
            EVENTS.ROLE_SWITCHING_USER_JOINED_SESSION_AS_VOLUNTEER
          )
        } else if (this.isStudent) {
          AnalyticsService.captureEvent(
            EVENTS.ROLE_SWITCHING_USER_JOINED_SESSION_AS_STUDENT
          )
        }
      }

      this.joinSocketSession()
      Gleap.setCustomData('sessionId', this.sessionId)

      await this.getSessionContext()

      if (getNotificationPermission() === 'default') {
        this.showNotificationModal = true
      }

      this.meetingActor.actorRef.start()
      this.meetingActor.actorRef.send({
        type: 'set_session_id',
        sessionId: this.sessionId,
      })

      this.meetingActor.actorRef.send({
        type: 'session_started',
      })

      /*
       * Since this is only rolled out to students,
       * we have to check to see if the student involved in this
       * session is eligible, if they are, we can also enable it for
       * the volunteer.
       */
      FeatureFlagService.isFeatureEnabledForUser(
        POSTHOG_FEATURE_FLAGS.AI_TUTOR,
        this.session.studentId
      )
        .then((r) => {
          this.aiWidgetEnabled =
            r.isEnabled && r.isEnabled.includes('in-session')
        })
        .catch((err) => {
          LoggerService.noticeError(
            `Failed to check if AI tutor is enabled for user=${session.studentId}`,
            err
          )
        })
    } catch (err) {
      ModalService.showSessionError(err.message)
      LoggerService.noticeError(err)
    }
  },

  async mounted() {
    if (!this.isSocketConnected) {
      socket.connect()
    }

    if (this.mobileMode) {
      try {
        Gleap.showFeedbackButton(false)
      } catch {
        LoggerService.noticeError('Failed when hiding Gleap feedback button')
      }
    }
    window.addEventListener('resize', this.handleResize)
  },

  beforeUnmount() {
    if (this.joinSocketSessionAbortController) {
      this.joinSocketSessionAbortController.abort()
    }
    clearTimeout(this.breakoutPromptTimeout)
    socket.emit('sessions:leave', {
      sessionId: this.sessionId,
    })
    Gleap.removeCustomData('sessionId')
    Gleap.showFeedbackButton(true)
    window.removeEventListener('resize', this.handleResize)
  },

  data() {
    return {
      auxiliaryOpen: false,
      sessionId: null,
      exclusiveVolunteerId: null,
      showBreakoutPrompt: false,
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
      aiWidgetHidden: true,
      aiWidgetEnabled: false,
      hasUnreadAiTutorMessage: false,
      aiWidgetDragging: false,
      aiWidgetResizing: false,
      didAutoOpen: false,
      draggingScreenShare: false,
      resizingScreenShare: false,
      // chime uses getDisplayMedia for screen sharing and iOS safari does not support it
      // so we hide the screen share button on iOS.
      // NOTE: users can still view a shared screen in iOS safari, they just can't share their own screen
      getDisplayMediaSupported:
        typeof navigator.mediaDevices.getDisplayMedia !== 'undefined',
      previousSessionCountWithStudent: 0,
      meetingActor,
      showModerationInfractionModal: false,
      showModerationInfractionToast: false,
      showScreenShareDisclaimer: false,
      joinSocketSessionAbortController: null,
      isSocketSessionRoomConnected: false,
      isZwibserveSession: false,
      breakoutPromptTimeout: null,
    }
  },
  computed: {
    ...mapState({
      moderationInfraction: (state) => state.liveMedia.moderationInfraction,
      potentialPartnerInfraction: (state) =>
        state.liveMedia.potentialPartnerInfraction,
      user: (state) => state.user.user,
      session: (state) => state.user.session,
      docEditorVersion: (state) => state.user.session.docEditorVersion,
      auxiliaryType: (state) => state.user.session.toolType,
      isSocketConnected: (state) => state.socket.isConnected,
      productFlags: (state) => state.productFlags.flags,
      isFetchingConversation: (state) =>
        state.botConversations.isFetchingConversation,
      isPartnerOnline: (state) => state.session.isPartnerOnline,
      everShownDisplayCallStatus: (state) =>
        state.liveMedia.audio.everShownDisplayCallStatus,
      journeySessionData: (state) => state.session.journeySessionData,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      isMobileLandscape: 'app/isMobileLandscape',
      isAuthenticated: 'user/isAuthenticated',
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      isStudentVolunteer: 'user/isStudentVolunteer',
      isSessionOver: 'user/isSessionOver',
      isSessionAlive: 'user/isSessionAlive',
      isTutorBotChatEnabled: 'featureFlags/isTutorBotChatEnabled',
      isFallIncentiveProgramEnabled:
        'featureFlags/isFallIncentiveProgramEnabled',
      currentTutorBotConversation: 'botConversations/currentConversation',
      isSessionInProgress: 'user/isSessionInProgress',
      sessionPartner: 'user/sessionPartner',
      isLiveMediaBanned: 'liveMedia/isBannedFromLiveMedia',
      isPartnerLiveMediaBanned: 'liveMedia/isPartnerBannedFromLiveMedia',
    }),
    micState() {
      if (
        this.meetingActor.snapshot.matches(
          'Active.MicControl.MicPermissionsDenied'
        )
      ) {
        return 'denied'
      }
      if (
        this.meetingActor.snapshot.matches('Active.MicControl.MicUnmuted') ||
        this.meetingActor.snapshot.matches('Active.MicControl.MicMuted')
      ) {
        return 'granted'
      }

      return 'prompt'
    },

    isScreenSharing() {
      return this.meetingActor.snapshot.matches(
        'Active.ScreenShareControl.SharingMyScreen'
      )
    },
    isViewingPartnerScreenShare() {
      return this.meetingActor.snapshot.matches(
        'Active.ScreenShareControl.ViewingPartnerScreenShare'
      )
    },
    isLoadingMicControl() {
      return this.meetingActor?.snapshot?.hasTag('loadingAudioCall')
    },
    isLoadingScreenShareControl() {
      return this.meetingActor?.snapshot?.hasTag('loadingScreenShare')
    },
    isLoadingSpeakerControl() {
      return this.meetingActor?.snapshot?.hasTag('loadingSpeakerControl')
    },
    meetingHasNotEnded() {
      return !this.meetingActor?.snapshot?.matches('Ended')
    },
    unableToJoinMediaRoom() {
      return this.meetingActor?.snapshot?.hasTag('unableToJoinMediaRoom')
    },
    unableToJoinAudio() {
      return this.meetingActor?.snapshot?.hasTag('unableToJoinAudio')
    },
    screenShareActive() {
      return (
        this.meetingActor.snapshot.matches(
          'Active.ScreenShareControl.SharingMyScreen'
        ) ||
        (this.meetingActor.snapshot.matches(
          'Active.ScreenShareControl.ViewingPartnerScreenShare'
        ) &&
          this.meetingActor.snapshot.context.showPartnerScreenShare)
      )
    },
    snapshot() {
      return meetingActor?.value.snapshot
    },
    isMyMicMuted() {
      return !this.snapshot.matches('Active.MicControl.MicUnmuted')
    },
    isSpeakerMuted() {
      return !this.snapshot.matches('Active.SpeakerControl.SpeakerUnmuted')
    },
    isPartnerSpeaking() {
      return this.snapshot.context.isPartnerSpeaking
    },
    isSpeaking() {
      const activeSpeakerIds = this.snapshot.context.activeSpeakerIds
      const myId = this.snapshot.context.attendee?.AttendeeId ?? ''
      const isSpeaking = activeSpeakerIds.includes(myId)
      if (isSpeaking) {
        AnalyticsService.captureEvent(
          EVENTS.VOICE_CHAT_USER_SPOKE_IN_AUDIO_CHANNEL
        )
      }
      return isSpeaking
    },
    partnerPresence() {
      if (!this.isPartnerOnline) return 'is away'

      return this.snapshot.context.isPartnerMicMuted
        ? 'has their mic off'
        : this.isPartnerSpeaking
          ? `is speaking`
          : 'is in session'
    },
    partnerCanUseMic() {
      return !this.isPartnerLiveMediaBanned
    },
    partnerMicStatus() {
      const name = this.sessionPartner.firstname
      const isMuted = this.snapshot.context.isPartnerMicMuted
      if (this.isPartnerLiveMediaBanned) return `${name}'s mic is censored`
      else if (isMuted) return `${name} has muted their mic`
      else return ''
    },
    aiTutorSetupProps() {
      return {
        currentTutorBotConversationSessionId:
          this.currentTutorBotConversation?.sessionId,
        aiWidgetEnabled: this.aiWidgetEnabled,
        sessionId: this.sessionId,
        isFetchingConversation: this.isFetchingConversation,
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
    isFavoriteVolunteer() {
      return this.user.favoriteVolunteers.includes(this.session?.volunteer?.id)
    },
  },
  watch: {
    moderationInfraction(newVal) {
      if (newVal?.stopStreamImmediatelyReasons?.length) {
        this.showModerationInfractionModal = true
        this.showModerationInfractionToast = false
      } else if (newVal) {
        this.showModerationInfractionToast = true
      }
    },
    isPartnerSpeaking(newVal) {
      if (newVal && !this.everShownDisplayCallStatus && this.isSpeakerMuted) {
        this.$store.dispatch('liveMedia/audio/setDisplayCallStatus', {
          type: 'partner-speaking',
          icon: markRaw(SpeakerFilledIcon),
          main: `${this.sessionPartner.firstName} is speaking`,
          secondary: `Click the speaker icon to listen`,
          fadeOutAfterMs: 6000,
        })
      }
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
        try {
          const { data: conversation } =
            await NetworkService.getOrCreateTutorBotConversationWithMessagesBySessionId(
              sessionId
            )
          await this.$store.dispatch(
            'botConversations/setConversation',
            conversation.conversationId
          )
        } catch (err) {
          LoggerService.noticeError(
            `Failed to get or created tutor bot conversation for session ${sessionId}`,
            err
          )
        } finally {
          this.$store.commit(
            'botConversations/setIsFetchingConversation',
            false
          )
        }

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
    isSocketConnected(curr, prev) {
      if (curr && !prev) {
        if (this.sessionId) {
          this.joinSocketSession()
        }
        AnalyticsService.captureEvent(
          EVENTS.USER_SOCKET_IS_CONNECTED_IN_SESSION,
          {
            event: EVENTS.USER_SOCKET_IS_CONNECTED_IN_SESSION,
            sessionId: this.sessionId,
          }
        )
      }

      if (!curr && prev) {
        this.isSocketSessionRoomConnected = false
        AnalyticsService.captureEvent(
          EVENTS.USER_SOCKET_IS_DISCONNECTED_IN_SESSION,
          {
            event: EVENTS.USER_SOCKET_IS_DISCONNECTED_IN_SESSION,
            sessionId: this.sessionId,
          }
        )
      }
    },
    mobileMode(isMobileMode) {
      Gleap.showFeedbackButton(!isMobileMode)
    },
    // Once session has ended, show chatbot to tutor
    async 'session.endedAt'(newValue, oldValue) {
      if (newValue && !oldValue) {
        this.sessionHasEnded = true
        this.meetingActor.actorRef.send({ type: 'meeting_ended' })
      }
    },

    async sessionPartner(current, previous) {
      if (current?.id !== previous?.id && current?.id) {
        this.meetingActor.actorRef.send({
          type: 'session_started',
        })
      }
    },
  },
  methods: {
    handleBreakoutPrompt() {
      const key = `breakoutPromptSeen:${this.sessionId}`
      if (sessionStorage.getItem(key)) return

      const createdAt = new Date(this.session.createdAt).getTime()
      const fiveMinutes = 5 * 60 * 1000
      const elapsed = Date.now() - createdAt
      const delay = Math.max(fiveMinutes - elapsed, 0)

      this.breakoutPromptTimeout = setTimeout(() => {
        if (sessionStorage.getItem(key)) return

        this.showBreakoutPrompt = true
        sessionStorage.setItem(key, 'true')

        AnalyticsService.captureEvent(
          EVENTS.STUDENT_SAW_BREAKOUT_PROMPT_MODAL,
          {
            sessionId: this.sessionId,
            requestedVolunteerId: this.exclusiveVolunteerId,
          }
        )
      }, delay)
    },
    async confirmBreakout(source = 'banner') {
      try {
        await NetworkService.breakoutSession(this.sessionId)
        AnalyticsService.captureEvent(
          EVENTS.STUDENT_BROKE_OUT_EXCLUSIVE_SESSION,
          {
            sessionId: this.sessionId,
            source,
            requestedVolunteerId: this.exclusiveVolunteerId,
          }
        )
        this.exclusiveVolunteerId = null
      } catch (err) {
        LoggerService.noticeError(err)
      } finally {
        this.showBreakoutPrompt = false
      }
    },
    dismissBreakoutPrompt() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_DISMISSED_BREAKOUT_PROMPT_MODAL,
        { sessionId: this.sessionId }
      )
      this.showBreakoutPrompt = false
    },
    startScreenShare() {
      this.meetingActor.send({ type: 'share_screen' })
    },
    stopScreenShare() {
      this.meetingActor.send({ type: 'stop_share_screen' })
    },
    onAcceptScreenShareTerms() {
      this.showScreenShareDisclaimer = false
      setHasSeenScreenShareDisclaimerThisSession()
      this.startScreenShare()
    },
    onDeclineScreenShareTerms() {
      this.showScreenShareDisclaimer = false
    },
    toggleModerationInfractionModal() {
      if (this.auxiliaryOpen && this.isMobileLandscape) {
        // Workaround until mobile small screen landscape is fixed
        this.toggleAuxiliary()
      }
      this.showModerationInfractionModal = !this.showModerationInfractionModal
    },
    dismissModerationInfraction() {
      this.showModerationInfractionToast = false
    },
    toggleMuteSelf() {
      this.meetingActor?.send({ type: 'toggle_mute_self' })
    },
    toggleMutePartner() {
      this.meetingActor?.send({ type: 'toggle_mute_partner' })
    },
    onAudioUiLoaded(audioElement) {
      this.meetingActor?.send({
        type: 'audio_ui_loaded',
        audioOutputElement: audioElement,
      })
    },
    toggleScreenShareWindow() {
      if (this.screenShareActive) {
        this.stopScreenShare()
      } else {
        if (!hasSeenScreenShareDisclaimerThisSession()) {
          this.showScreenShareDisclaimer = true
        } else {
          this.startScreenShare()
        }
      }
    },
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
        if (!this.auxiliaryOpen) this.aiWidgetHidden = true
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
    async joinSocketSession() {
      this.joinSocketSessionAbortController = new AbortController()

      try {
        await backOff(
          async () => {
            const { success, retry } = await socket
              .timeout(2000)
              .emitWithAck('sessions:join', {
                sessionId: this.sessionId,
              })

            if (retry) {
              AnalyticsService.captureEvent(EVENTS.SOCKET_SESSION_JOIN_RETRY, {
                sessionId: this.session.id,
              })
              const msg =
                'Received retry signal, try joining socket session room again.'
              LoggerService.log(msg, {
                sessionId: this.session.id,
              })
              throw new Error(msg)
            }

            if (success) {
              this.isSocketSessionRoomConnected = true
            }
          },
          {
            retry: () => !this.joinSocketSessionAbortController.signal.aborted,
          }
        )
      } catch (err) {
        if (this.joinSocketSessionAbortController.signal.aborted) {
          return
        }
        ModalService.showSessionError(SessionErrorType.SESSION_CHAT_ERROR, () =>
          this.$router.go(0)
        )
        AnalyticsService.captureEvent(EVENTS.SOCKET_SESSION_JOIN_FAILED, {
          sessionId: this.session.id,
        })
        LoggerService.noticeError(err)
      }
    },
    setHasSeenNewMessage(value) {
      this.hasSeenNewMessage = value
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
    async getSessionContext() {
      try {
        this.isLoadingSessionMetadata = true

        if (this.isVolunteer) {
          this.previousSessionCountWithStudent =
            await SessionService.getTotalSessionsForPair({
              volunteerId: this.session.volunteerId,
              studentId: this.session.studentId,
            })
          const presessionSurveyResponse =
            await NetworkService.getPresessionSurveyResponse(this.session.id)
          this.totalStudentSessions =
            presessionSurveyResponse.data.totalStudentSessions
          this.studentPresessionResponses =
            presessionSurveyResponse.data.responses
        }

        const {
          data: { assignment },
        } = await NetworkService.getAssignmentForSession(this.session.id)
        if (assignment) {
          const {
            data: { assignmentDocuments },
          } = await NetworkService.getAssignmentDocuments(assignment.id)
          assignment.docs = assignmentDocuments
        }

        this.studentAssignment = assignment
      } catch {
        this.isLoadingSessionMetadata = false
      } finally {
        this.isLoadingSessionMetadata = false
      }
    },
    openHelp() {
      Gleap.open()
      AnalyticsService.captureEvent(EVENTS.USER_CLICKED_IN_SESSION_HELP)
    },
    async linkTransferredTutorBotConversation(sessionId) {
      const tutorBotConversationId =
        this.$store.state.botConversations.pendingTransferredConversationId
      if (!tutorBotConversationId) return

      try {
        await NetworkService.updateTutorBotConversationWithSessionId(
          tutorBotConversationId,
          sessionId
        )
        await this.$store.dispatch(
          'botConversations/setConversation',
          tutorBotConversationId
        )
      } catch (err) {
        LoggerService.noticeError(
          `Failed to link tutor bot conversation ${tutorBotConversationId} to session ${sessionId}`,
          err
        )
      } finally {
        this.$store.commit(
          'botConversations/setPendingTransferredConversationId',
          null
        )
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
  width: 100%;
  position: relative; /*[1]*/
  height: 100%; /*[1]*/
  display: flex;
  flex-direction: column;
  &--whiteboard {
    .toggleButton.back {
      bottom: calc(100% - 140px);
      right: 35px;
    }
  }
}

.exclusive-session-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  background: #eef9f6;
  border-bottom: 1px solid #b8e0d2;
  color: #114b3f;
  font-size: 14px;

  &__text {
    flex: 1;
  }
}

.session-header-container {
  grid-area: 1 / 1 / 2 / 2;
  width: 100%;
  background: #fff;

  @include breakpoint-above('medium') {
    grid-area: 1 / 4 / 2 / 5;
    background: #fff;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    background: $c-information-blue;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.session-contents-container {
  height: 100%;
  background: $c-background-grey;
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(min-content, max-content) 1fr;
  grid-column-gap: 15px;
  grid-row-gap: 0;
  flex: 1;
  min-height: 0;

  @include breakpoint-above('medium') {
    padding: 20px;
    grid-template-columns: repeat(3, 1fr) minmax(300px, 1fr);
    grid-template-rows: minmax(min-content, max-content) 1fr;
  }

  @include breakpoint-above('large') {
    grid-template-columns: repeat(3, 1fr) minmax(400px, 400px);
  }
}

.about-session {
  &-container {
    background-color: $light-blue-background;
    padding: 0.6em 0.6em;
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

.session-history-link {
  @include font-category('subheading');
  color: rgba(0, 0, 0);
  border-radius: 4px;
  padding: 0.4rem 0.5rem;

  &:hover {
    background-color: rgba(196, 196, 196, 0.2);
  }
}

.auxiliary-container,
.chat-container {
  @include breakpoint-above('medium') {
    overflow: hidden;
  }
}

.auxiliary-container {
  grid-area: 2 / 1 / 6 / 2;
  background: #fff;
  padding: 0;
  flex-grow: 1;
  overflow: hidden;

  @include breakpoint-above('medium') {
    border-radius: 8px;
    grid-area: 1 / 1 / 3 / 4;
  }

  // TODO: research performance implications of position: absolute
  // vs alternatives and how they impact DOM reflow triggers
  &--hidden {
    visibility: hidden;
  }
}

.chat-container {
  grid-area: 2 / 1 / 6 / 2;
  padding: 0;
  max-width: 100%;
  display: flex;
  flex-direction: column;

  @include breakpoint-above('medium') {
    grid-area: 2 / 4 / 3 / 5;
  }

  &--hidden {
    display: none;
  }
}

.toggleButton {
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
  fill: $c-information-blue;
  transition: scale 0.2s ease-in-out;

  &:hover {
    cursor: pointer;
    transform: scale(1.1);
  }
}

.live-media-header-container {
  width: 100%;
}

.display-none {
  display: none;
}

.no-pointer-events {
  pointer-events: none;
}
</style>
