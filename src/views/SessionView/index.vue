<template>
  <div
    class="session"
    :class="{ 'session--whiteboard': auxiliaryType === 'WHITEBOARD' }"
  >
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
          isScreenshareEnabled &&
          meetingActor.snapshot.context.sessionId &&
          !!mobileMode
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
        :require-click-more-info-to-dismiss="
          moderationInfraction?.isBanned ?? false
        "
      />
      <ModerationInfractionModal
        v-if="showModerationInfractionModal"
        @close="toggleModerationInfractionModal"
        :moderation-infraction="moderationInfraction"
      />
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
          :screenShareAvailable="
            isSessionInProgress &&
            isScreenshareEnabled &&
            getDisplayMediaSupported &&
            meetingHasNotEnded
          "
          @clickedShareScreen="toggleScreenShareWindow"
          :isScreenSharing="isScreenSharing"
          :isViewingPartnerScreenShare="isViewingPartnerScreenShare"
          :isJoiningCall="isJoiningCall"
          :unableToJoinCall="unableToJoinCall"
        />

        <document-editor-v2
          v-else-if="auxiliaryType === sessionToolTypes.DOCUMENT_EDITOR"
          :sessionId="this.sessionId"
          :isAiWidgetEnabled="aiWidgetEnabled"
          :onWidgetClicked="toggleAiWidget"
          :showHasAiMessageIndicator="hasUnreadAiTutorMessage"
          :isScreenShareEnabled="
            isSessionInProgress && isScreenshareEnabled && meetingHasNotEnded
          "
          @clickedShareScreen="toggleScreenShareWindow"
          :isScreenSharing="isScreenSharing"
          :isViewingPartnerScreenShare="isViewingPartnerScreenShare"
          :isJoiningCall="isJoiningCall"
          :unableToJoinCall="unableToJoinCall"
        />
      </div>

      <div class="session-header-container">
        <session-chat-header
          v-if="
            !isSessionAudioCallEnabled ||
            (isSessionAudioCallEnabled && !isSessionInProgress)
          "
        />

        <LiveMediaChatHeader
          v-else-if="isSessionInProgress && isSessionAudioCallEnabled"
          class="live-media-header-container"
          :isMyMicMuted="isMyMicMuted"
          :isSpeakerMuted="isSpeakerMuted"
          :isPartnerSpeaking="isPartnerSpeaking"
          :partnerPresence="partnerPresence"
          :partnerMicStatus="partnerMicStatus"
          :partnerCanUseMic="partnerCanUseMic"
          :unableToJoinCall="unableToJoinCall"
          :isBanned="isLiveMediaBanned"
          :isJoiningCall="isJoiningCall"
          :unableToJoinAudio="unableToJoinAudio"
          :isSpeaking="isSpeaking"
          :micState="micState"
          @toggleMuteSelf="toggleMuteSelf"
          @toggleMutePartner="toggleMutePartner"
          @audioUiLoaded="onAudioUiLoaded"
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
          :isSocketConnected="isSocketConnected"
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
import NetworkService from '@/services/NetworkService'
import SessionService from '@/services/SessionService'
import AnalyticsService from '@/services/AnalyticsService'
import SessionChatHeader from './SessionChatHeader.vue'
import SessionChat from './SessionChat/index.vue'
import AiWidgetTool from './AiWidgetTool/index.vue'
import Whiteboard from './Whiteboard.vue'
import DocumentEditorV2 from './DocumentEditorV2.vue'
import CaretIcon from '@/assets/caret.svg'
import QuestionMarkIcon from '@/assets/question-mark-icon.svg'
import WebNotificationsModal from '@/components/WebNotificationsModal.vue'
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
import { POSTHOG_FEATURE_FLAGS } from '@/consts'
import LiveMediaChatHeader from '@/components/ScreenShare/LiveMediaChatHeader.vue'
import ScreenShare from '@/components/ScreenShare/ScreenShare.vue'
import { useActor } from '@xstate/vue'
import * as MeetingMachine from '@/state-machines/meeting-machine'
import SpeakerFilledIcon from '@/assets/voice_message_icons/speaker-filled.svg'
import ModerationInfractionModal from '@/components/Moderation/ModerationInfractionModal.vue'
import ModerationInfractionToast from '@/components/Moderation/ModerationInfractionToast.vue'
import ModerationDisclaimerModal from '@/views/SessionView/ModerationDisclaimerModal.vue'
import {
  hasSeenScreenShareDisclaimerThisSession,
  setHasSeenScreenShareDisclaimerThisSession,
} from '@/utils/session'

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
    DocumentEditorV2,
    WebNotificationsModal,
    CaretIcon,
    AboutSessionModal,
    LoadingMessage,
    QuestionMarkIcon,
    FallIncentiveReviewWarningModal,
    AssignmentDetailModal,
    LiveMediaChatHeader,
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
    }),
      /*
      NOTE: to use xstate live machine inspector:

      // import the inspector
      import { createBrowserInspector } from '@statelyai/inspect'

      // pass the inspector to the actor
      const options = { inspect: createBrowserInspector().inspect }
      meetingActor.value = useActor(MeetingMachine.create(), options)
    */
      (meetingActor.value = useActor(MeetingMachine.create()))
  },

  beforeRouteEnter(_, from, next) {
    next((vm) => {
      vm.prevRoute = from
    })
  },

  async created() {
    try {
      const session = await SessionService.createOrJoinSession(
        this.$route.params.topic,
        this.$route.params.subTopic,
        this.$route.params.sessionId,
        this.$route.query?.assignmentId,
        this.prevRoute?.name ?? ''
      )
      this.session = session
      this.sessionId = session.id

      // Consider putting analytics into service.
      if (!this.$route.params.sessionId && this.isStudent) {
        AnalyticsService.captureEvent(EVENTS.SESSION_REQUESTED, {
          event: EVENTS.SESSION_REQUESTED,
          sessionId: this.session.id,
          subject: this.$route.params.subTopic,
        })
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
      Gleap.setCustomData('sessionId', this.session.id)

      await this.getSessionContext()

      if (getNotificationPermission() === 'default') {
        this.showNotificationModal = true
      }

      await Promise.all([
        this.fetchSessionAudioFlag(),
        this.fetchScreenshareFlag(),
      ])
      this.meetingActor.actorRef.start()
      this.meetingActor.actorRef.send({
        type: 'set_session_id',
        sessionId: this.session.id,
      })
      this.meetingActor.actorRef.send({
        type: 'session_started',
        isAudioEligible: this.isSessionAudioCallEnabled,
        isScreenshareEligible: this.isScreenshareEnabled,
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
          this.aiWidgetEnabled = r.isEnabled.includes('in-session')
        })
        .catch((err) => {
          LoggerService.noticeError(
            `Failed to check if AI tutor is enabled for user=${student?.id}`,
            err
          )
        })
    } catch (err) {
      window.alert('Could not join session: ' + err.message)
      LoggerService.noticeError(err)
      this.$router.replace('/')
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
      isFetchingSessionAudioCallFlag: false,
      isSessionAudioCallEnabled: false,
      isScreenshareEnabled: false,
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
    }
  },
  computed: {
    ...mapState({
      moderationInfraction: (state) => state.liveMedia.moderationInfraction,
      user: (state) => state.user.user,
      session: (state) => state.user.session,
      auxiliaryType: (state) => state.user.session.toolType,
      isSocketConnected: (state) => state.socket.isConnected,
      productFlags: (state) => state.productFlags.flags,
      isFetchingConversation: (state) =>
        state.botConversations.isFetchingConversation,
      isPartnerOnline: (state) => state.session.isPartnerOnline,
      everShownDisplayCallStatus: (state) =>
        state.liveMedia.audio.everShownDisplayCallStatus,
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
      isSessionRecapDmsActive: 'featureFlags/isSessionRecapDmsActive',
      isTutorBotChatEnabled: 'featureFlags/isTutorBotChatEnabled',
      isFallIncentiveProgramEnabled:
        'featureFlags/isFallIncentiveProgramEnabled',
      currentTutorBotConversation: 'botConversations/currentConversation',
      isSessionInProgress: 'user/isSessionInProgress',
      sessionPartner: 'user/sessionPartner',
      isScreenshareEnabledFeatureFlag: 'featureFlags/isScreenshareEnabled',
      isLiveMediaBanned: 'liveMedia/isBannedFromLiveMedia',
      isPartnerLiveMediaBanned: 'liveMedia/isPartnerBannedFromLiveMedia',
    }),
    micState() {
      if (
        this.meetingActor.snapshot.matches(
          'JoinedMeeting.MicControl.MicPermissionsDenied'
        )
      ) {
        return 'denied'
      }
      if (
        this.meetingActor.snapshot.matches(
          'JoinedMeeting.MicControl.MicUnmuted'
        ) ||
        this.meetingActor.snapshot.matches('JoinedMeeting.MicControl.MicMuted')
      ) {
        return 'granted'
      }

      return 'prompt'
    },

    isScreenSharing() {
      return this.meetingActor.snapshot.matches(
        'JoinedMeeting.ScreenShareControl.SharingMyScreen'
      )
    },
    isViewingPartnerScreenShare() {
      return this.meetingActor.snapshot.matches(
        'JoinedMeeting.ScreenShareControl.ViewingPartnerScreenShare'
      )
    },
    isJoiningCall() {
      return (
        this.meetingActor?.snapshot?.hasTag('loadingScreenShare') ||
        this.meetingActor?.snapshot?.hasTag('loadingAudioCall')
      )
    },
    meetingHasNotEnded() {
      return !this.meetingActor?.snapshot?.matches('Ended')
    },
    unableToJoinCall() {
      return this.meetingActor?.snapshot?.hasTag('unableToJoinCall')
    },
    unableToJoinAudio() {
      return this.meetingActor?.snapshot?.hasTag('unableToJoinAudio')
    },
    screenShareActive() {
      return (
        this.meetingActor.snapshot.matches(
          'JoinedMeeting.ScreenShareControl.SharingMyScreen'
        ) ||
        (this.meetingActor.snapshot.matches(
          'JoinedMeeting.ScreenShareControl.ViewingPartnerScreenShare'
        ) &&
          this.meetingActor.snapshot.context.showPartnerScreenShare)
      )
    },
    snapshot() {
      return meetingActor?.value.snapshot
    },
    isMyMicMuted() {
      return !this.snapshot.matches('JoinedMeeting.MicControl.MicUnmuted')
    },
    isSpeakerMuted() {
      return !this.snapshot.matches(
        'JoinedMeeting.SpeakerControl.SpeakerUnmuted'
      )
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
      return (
        !this.isPartnerLiveMediaBanned &&
        this.snapshot.context.hasReceivedPartnerAudio
      )
    },
    partnerMicStatus() {
      const name = this.sessionPartner.firstname
      const isMuted = this.snapshot.context.isPartnerMicMuted
      const hasReceivedAudioFromPartner =
        this.snapshot.context.hasReceivedPartnerAudio
      if (this.isPartnerLiveMediaBanned) return `${name}'s mic is censored`
      else if (!hasReceivedAudioFromPartner)
        return `${name}'s mic is unavailable`
      else if (isMuted) return `${name} has muted their mic`
      else return ''
    },
    aiTutorSetupProps() {
      return {
        currentTutorBotConversationSessionId:
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
  watch: {
    moderationInfraction(newVal) {
      if (newVal) {
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
        await this.fetchSessionAudioFlag()
        await this.fetchScreenshareFlag()
        this.meetingActor.actorRef.send({
          type: 'session_started',
          isAudioEligible: this.isSessionAudioCallEnabled,
          isScreenshareEligible: this.isScreenshareEnabled,
        })
      }
    },
  },
  methods: {
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
    async fetchSessionAudioFlag() {
      if (!this.sessionPartner?.id) return
      this.isFetchingSessionAudioCallFlag = true
      try {
        this.isSessionAudioCallEnabled = await this.$store.dispatch(
          'featureFlags/isSessionAudioCallEnabled',
          this.sessionPartner?.id
        )
      } catch (err) {
        this.isSessionAudioCallEnabled = false
      } finally {
        this.isFetchingSessionAudioCallFlag = false
      }
    },
    async fetchScreenshareFlag() {
      if (!this.sessionPartner?.id) return
      try {
        this.isScreenshareEnabled = await this.$store.dispatch(
          'featureFlags/isScreenshareEnabled',
          this.sessionPartner?.id
        )
      } catch (err) {
        this.isScreenshareEnabled = false
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
          () =>
            socket.timeout(2000).emitWithAck('sessions:join', {
              sessionId: this.sessionId,
            }),
          {
            retry: () => !this.joinSocketAbortController.signal.aborted,
          }
        )
      } catch (err) {
        if (this.joinSocketAbortController.signal.aborted) {
          return
        }

        window.alert(
          'Unable to join session chat. Please refresh and try again.'
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
  width: 100%;
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
