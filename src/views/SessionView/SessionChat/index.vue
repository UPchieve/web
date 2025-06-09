<template>
  <div class="chat">
    <document-title :title="documentTitle"></document-title>
    <div>
      <transition name="chat-warning">
        <div
          class="chat-warning chat-warning--moderation"
          v-show="moderationWarningIsShown"
        >
          <div class="moderation-body" data-testid="moderation-body">
            <span v-if="Object.keys(failureReasons ?? {}).length">
              Your message cannot be shown due to the following policy
              violations:
            </span>
            <span v-else
              >Messages cannot contain personal information, profanity, or links
              to third party communication services.</span
            >
            <ul class="moderation-reasons">
              <li v-for="(value, key) in failureReasons" :key="key">
                <div class="reason" :data-testid="key">
                  {{ getModerationFailureReason(key) }}
                </div>
                <div class="instances" :data-testid="`${key}-instances`">
                  {{ getOffendingSubstringsForReason(key) }}
                </div>
              </li>
            </ul>
          </div>
          <span class="chat-warning__close" @click="hideModerationWarning"
            >×</span
          >
        </div>
      </transition>
      <transition name="chat-warning">
        <loading-message
          message="Attempting to connect the chat"
          class="chat-warning chat-warning--connection"
          v-show="showConnectingToChatMessage"
        />
      </transition>
    </div>

    <div class="messages-container">
      <div class="messages" ref="messages" @scroll="handleScroll" tabindex="0">
        <chat-bot
          v-if="isStudent && isSessionWaitingForVolunteer && !aiWidgetPresent"
          @new-bot-message="handleNewMessageScrollPosition"
        />
        <chat-bot
          v-if="
            isStudent &&
            isDisplayVolunteerLanguagesEnabled &&
            isTutorJoiningForFirstTime
          "
          :isDisplayingLanguagesSpoken="true"
          :currentSession="currentSession"
          :languages="currentSession.volunteerLanguages ?? []"
          @new-bot-message="handleNewMessageScrollPosition"
        />
        <div
          v-for="(message, index) in withPendingVoiceMessages"
          :key="`message-${index}`"
          :class="[messageAlignment(message), { 'mt-2': index === 0 }]"
          class="message"
        >
          <span
            v-if="message.isSystemMessage"
            class="system-message"
            :data-testid="`message-from-system`"
          >
            {{ message.contents }}</span
          >
          <template v-else>
            <div v-if="message.user !== this.user.id" class="avatar-container">
              <component
                v-if="shouldShowPartnerAvatar(message, index)"
                class="avatar"
                :is="avatar(message)"
              />
            </div>

            <div
              class="contents"
              :class="{ 'mb-2': shouldShowTimestamp(message, index) }"
            >
              <div class="bubble" :class="chatBotMessageStyle(message)">
                <span v-if="message.hasHtml" v-html="message.contents"></span>
                <transcribed-message
                  v-else-if="message.type === 'audio-transcription'"
                />
                <span v-else-if="message.type === 'voice'">
                  <voice-message
                    :message="message"
                    :isSender="message.user === user.id"
                  />
                </span>
                <span
                  v-else
                  :data-testid="`message-from-user-id-${message.user}`"
                  >{{ message.contents }}</span
                >
              </div>
              <div v-if="shouldShowTimestamp(message, index)" class="metadata">
                {{ formatTime(message.createdAt) }}
              </div>
            </div>
          </template>
        </div>

        <div v-if="showMyInProgressCaptionMessage" class="message right">
          <transcribed-message
            class="contents"
            :message="{
              contents: myInProgressCaptionMessage.text,
            }"
          />
        </div>
        <div v-if="showPartnerInProgressCaptionMessage" class="message left">
          <component class="avatar" :is="avatar({ user: sessionPartner.id })" />
          <transcribed-message
            class="contents"
            :message="{
              contents: partnerInProgressCaptionMessage.text,
            }"
          />
        </div>

        <div
          v-for="(message, index) in pendingTextMessages"
          :key="`pending-text-${index}`"
          class="message right"
          :class="{
            editing: isEditingMessage(index),
            flagged: isFlaggedMessage(message),
          }"
        >
          <div class="contents">
            <div class="bubble">
              <span v-if="!isEditingMessage(index)">
                {{ message.contents }}
              </span>
              <textarea
                v-else
                v-model="message.contents"
                @keydown="onEditKeydown($event, index)"
                class="edit-textarea"
                ref="editTextarea"
              />
            </div>
            <div class="metadata">
              <span v-if="isFlaggedMessage(message)">Flagged!</span>
            </div>
          </div>
          <div v-if="isFlaggedMessage(message)" class="flagged-actions mr-1">
            <button
              @click="deleteFlaggedMessage(index)"
              class="action-button delete"
              title="Delete this flagged message and continue sending remaining messages."
            >
              <TrashIcon />
            </button>
            <button
              v-if="!isEditingMessage(index)"
              @click="editingMessageIndex = index"
              class="action-button edit"
              title="Edit this message to fix policy violations."
            >
              <PencilIcon />
            </button>
          </div>
        </div>

        <chat-bot
          v-if="sessionHasEnded && isSessionRecapDmsActive && isVolunteer"
          :isSessionRecapBot="true"
          :currentSession="currentSession"
          @recap-eligible="toggleEligibleForSessionRecapChat"
          @loading-chatbot-message="scrollToBottom"
        />
        <chat-bot
          v-if="
            isVolunteer &&
            isInRecap &&
            currentSession.messages &&
            !tutorSentMessageAfterSessionEnded
          "
          :isInRecap="isInRecap"
          :currentSession="currentSession"
          @loading-chatbot-message="scrollToBottom"
        />
      </div>
      <transition name="fade">
        <CallStatusIndicator
          class="messages-overlay call-status-indicator"
          v-if="isSessionAudioCallEnabled"
        />
      </transition>
      <transition name="fade">
        <button
          type="button"
          v-show="numberOfUnreadChatMessages > 0"
          class="messages-overlay unread-message-indicator"
          @click="scrollToUnread"
        >
          {{ unreadMessageNote }}
          <img src="@/assets/down_arrow.png" alt="down arrow" />
        </button>
      </transition>
    </div>

    <div class="chat-footer" :class="isInRecap && 'chat-footer--recap'">
      <loading-message
        v-if="!this.isPendingMessagesEnabled && this.waitingForModeration"
        class="waiting-for-moderation"
        message="Sending"
      />
      <transition name="fade">
        <div v-if="hasFlaggedMessage" class="flagged-indicator">
          Fix flagged message to send
        </div>
        <div class="typing-indicator" v-else-if="typingIndicatorShown">
          {{ sessionPartnerName || 'Chatbot' }} is typing...
        </div>
      </transition>
      <div class="message-input">
        <textarea
          class="message-textarea"
          :class="{ hidden: textMessageHidden }"
          data-testid="chat-textarea"
          autofocus
          @keydown="onTypingInChat"
          @input="resizeTextarea"
          v-model="newMessage"
          placeholder="Type a message..."
          ref="textareaRef"
        />
        <CelebrationButton v-if="showCelebrateButton" @click="celebrate" />
        <record-voice-message
          @idle="showTextMessage"
          @not-idle="hideTextMessage"
          v-if="showVoiceMessaging"
          :onRecording="onRecording"
          :onStopRecording="onStopRecording"
          :sendAudioMessage="sendVoiceMessage"
          :sendTextMessage="sendTranscriptMessage"
        />
        <button
          :disabled="isSendMessageDisabled"
          class="send-button"
          :class="{ hidden: textMessageHidden }"
          @click="sendMessage"
        >
          <SendMessage></SendMessage>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { isEmpty, startCase } from 'lodash-es'
import { mapState, mapGetters } from 'vuex'
import moment from 'moment'
import { socket } from '@/socket'

import { EVENTS } from '@/consts'
import sound from '@/assets/audio/receive-message.mp3'
import PencilIcon from '@/assets/pencil.svg'
import SendMessage from '@/assets/voice_message_icons/send-message.svg'
import SpeakerFilledIcon from '@/assets/voice_message_icons/speaker-filled.svg'
import TrashIcon from '@/assets/trash.svg'

import ChatBot from './ChatBot.vue'
import RecordVoiceMessage from '@/components/VoiceMessaging/RecordVoiceMessage.vue'
import VoiceMessage from '@/components/VoiceMessaging/VoiceMessage.vue'
import DocumentTitle from '@/components/DocumentTitle.vue'
import LoadingMessage from '@/components/LoadingMessage.vue'
import CallStatusIndicator from '@/components/ScreenShare/CallStatusIndicator.vue'
import TranscribedMessage from './TranscribedMessage.vue'
import CelebrationButton from './CelebrationButton.vue'

import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import ModerationService from '@/services/ModerationService'
import VoiceMessageService from '@/services/VoiceMessageService'

import { DEFAULT_CELEBRATION_DURATION } from '@/store/modules/celebrations'
import getChatAvatar from '@/utils/get-chat-avatar'
import sendWebNotification from '@/utils/send-web-notification'

const MESSAGE_ALIGNMENT = {
  LEFT: 'left',
  RIGHT: 'right',
  CENTER: 'center',
}
function wasCensoredByChrome(transcript) {
  return transcript.includes('*')
}

export default {
  name: 'session-chat',
  components: {
    // Assets:
    PencilIcon,
    SendMessage,
    TrashIcon,
    SpeakerFilledIcon,
    // Components:
    ChatBot,
    LoadingMessage,
    DocumentTitle,
    RecordVoiceMessage,
    VoiceMessage,
    CallStatusIndicator,
    TranscribedMessage,
    CelebrationButton,
  },

  props: {
    // TODO: Some of the following don't need to be props.
    setHasSeenNewMessage: { type: Function, required: true },
    shouldHideChatSection: { type: Boolean, required: true },
    currentSession: { type: Object, required: true },
    isInRecap: { type: Boolean, default: false },
    isSocketSessionRoomConnected: { type: Boolean, required: true },
    isSessionAlive: { type: Boolean, required: true },
    isFetchingIsSessionRecapEligible: { type: Boolean, default: false },
    isSessionRecapEligible: { type: Boolean, default: false },
    sessionHasEnded: { type: Boolean, default: false },
    aiWidgetPresent: { type: Boolean, default: false },
  },

  data() {
    return {
      newMessage: '',
      moderationWarningIsShown: false,
      typingTimeout: null,
      typingIndicatorShown: false,
      isAutoscrolling: false,
      showChatBot: false,
      eligibleForSessionRecapChat: false,
      receiveMessageAudio: new Audio(sound),
      failureReasons: null,
      waitingForModeration: false,
      voiceMessagingAvailable:
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
      textMessageHidden: false,
      hasStartedTyping: false,
      isSessionAudioCallEnabled: false,
      isTutorJoiningForFirstTime: false,
      pendingTextMessages: [],
      editingMessageIndex: -1,
    }
  },

  computed: {
    ...mapState({
      user: (state) => state.user.user,
      isWebPageHidden: (state) => state.app.isWebPageHidden,
      unreadChatMessageIndices: (state) => state.user.unreadChatMessageIndices,
      chatScrolledToMessageIndex: (state) =>
        state.user.chatScrolledToMessageIndex,
      isTyping: (state) => state.socket.isTyping,
      messageData: (state) => state.socket.messageData,
      myInProgressCaptionMessage: (state) =>
        state.liveMedia.audio.myInProgressCaptionMessage,
      partnerInProgressCaptionMessage: (state) =>
        state.liveMedia.audio.partnerInProgressCaptionMessage,
    }),
    ...mapGetters({
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      isSessionWaitingForVolunteer: 'user/isSessionWaitingForVolunteer',
      numberOfUnreadChatMessages: 'user/numberOfUnreadChatMessages',
      isSessionRecapDmsActive: 'featureFlags/isSessionRecapDmsActive',
      eligibleForVoiceMessaging: 'featureFlags/eligibleForVoiceMessaging',
      isDisplayVolunteerLanguagesEnabled:
        'featureFlags/isDisplayVolunteerLanguagesEnabled',
      sessionPartner: 'user/sessionPartner',
      isConfettiCelebrationEnabled: 'featureFlags/isConfettiCelebrationEnabled',
      isPendingMessagesEnabled: 'featureFlags/isPendingMessagesEnabled',
    }),
    showMyInProgressCaptionMessage() {
      return this.myInProgressCaptionMessage?.text?.length > 0
    },
    showPartnerInProgressCaptionMessage() {
      return this.partnerInProgressCaptionMessage?.text?.length > 0
    },
    withPendingVoiceMessages() {
      const currentMessages = this.currentSession?.messages ?? []
      const pendingVoiceMessages = this.currentSession?.pendingMessages ?? []

      return currentMessages.concat(pendingVoiceMessages)
    },
    showVoiceMessaging() {
      return this.voiceMessagingAvailable && this.eligibleForVoiceMessaging
    },
    sessionPartner() {
      return this.isVolunteer
        ? this.currentSession.student
        : this.currentSession.volunteer
    },
    sessionPartnerName() {
      if (!this.currentSession) return ''
      return this.isVolunteer
        ? this.currentSession.student?.firstName
        : this.currentSession.volunteer?.firstName
    },
    showConnectingToChatMessage() {
      return this.isSessionAlive && !this.isSocketSessionRoomConnected
    },
    unreadMessageNote: function () {
      return `${this.numberOfUnreadChatMessages} unread message${
        this.numberOfUnreadChatMessages === 1 ? '' : 's'
      }`
    },
    tutorSentMessageAfterSessionEnded() {
      if (!this.currentSession || !this.currentSession.messages) return false
      for (const message of this.currentSession.messages) {
        if (message.createdAt > this.currentSession.endedAt) return true
      }
      return false
    },
    documentTitle() {
      return this.typingIndicatorShown &&
        this.isConnectedToSessionRoom &&
        this.isSessionAlive
        ? `${this.sessionPartnerName || 'Chatbot'} is typing...`
        : 'UPchieve'
    },
    showCelebrateButton() {
      return (
        this.isConfettiCelebrationEnabled &&
        this.isVolunteer &&
        !this.isInRecap &&
        this.currentSession?.messages?.length > 20
      )
    },
    hasFlaggedMessage() {
      return this.pendingTextMessages.some((message) => {
        return message.flagged
      })
    },
    isSendMessageDisabled() {
      return (
        this.newMessage.length === 0 ||
        !this.isSocketSessionRoomConnected ||
        this.hasFlaggedMessage ||
        (!this.isPendingMessagesEnabled && this.waitingForModeration)
      )
    },
  },

  async created() {
    await this.fetchIsSessionAudioCallEnabled(this.sessionPartner?.id)
    if (this.chatScrolledToMessageIndex) {
      const messageElements = this.getUserMessageElements()
      this.$refs.messages.scrollTop =
        messageElements[this.chatScrolledToMessageIndex]?.offsetTop
    }
  },

  methods: {
    async fetchIsSessionAudioCallEnabled(partnerUserId) {
      if (!partnerUserId) return
      this.isSessionAudioCallEnabled = await this.$store.dispatch(
        'featureFlags/isSessionAudioCallEnabled',
        partnerUserId
      )
    },

    showTextMessage() {
      this.textMessageHidden = false
      this.hideModerationWarning()
    },
    hideTextMessage() {
      this.textMessageHidden = true
    },
    onRecording() {
      socket.emit('typing', { sessionId: this.currentSession.id })
    },
    onStopRecording() {
      this.notTyping()
    },

    getModerationFailureReason(reasonKey) {
      switch (reasonKey.toLowerCase()) {
        case 'platform circumvention':
          return 'Attempting to communicate off-platform'
        case 'pii':
          return 'Sharing personally identifiable information'
        default:
          return startCase(reasonKey)
      }
    },
    getOffendingSubstringsForReason(reasonKey) {
      if (
        !Object.hasOwn(this.failureReasons, reasonKey) ||
        this.failureReasons[reasonKey] === undefined
      ) {
        return ''
      }
      return this.failureReasons[reasonKey]
        .map((s) => `"` + s.trim() + `"`)
        .join(', ')
    },
    showModerationWarning() {
      this.moderationWarningIsShown = true
    },
    hideModerationWarning() {
      this.moderationWarningIsShown = false
      this.failureReasons = null
    },

    formatTime(createdAt) {
      return moment(createdAt).format('h:mm a')
    },
    isPendingMessage(message) {
      return !message.createdAt
    },
    isFlaggedMessage(message) {
      return message.flagged
    },

    toggleEligibleForSessionRecapChat() {
      this.eligibleForSessionRecapChat = true
    },

    notTyping() {
      this.hasStartedTyping = false
      // Tell the server that the user is no longer typing.
      socket.emit('notTyping', {
        sessionId: this.currentSession.id,
      })
    },

    async onTypingInChat(event) {
      if (event.key == 'Enter' && event.shiftKey) {
        // Allow-multi-line messages.
        return
      }

      // If key pressed is Enter, send the message.
      if (event.key === 'Enter') {
        event.preventDefault()
        await this.sendMessage()
        return
      }

      if (!this.hasStartedTyping) {
        this.hasStartedTyping = true
        socket.emit('typing', {
          sessionId: this.currentSession.id,
        })
      }

      // Every time a key is pressed, set an inactive timer.
      // If another key is pressed within 2 seconds, reset timer.
      clearTimeout(this.typingTimeout)
      this.typingTimeout = setTimeout(() => {
        this.notTyping()
      }, 2000)
    },

    async sendMessage() {
      const message = this.newMessage.trim()
      // Early exit if message is blank.
      if (isEmpty(message) || this.isSendMessageDisabled) return

      if (this.isPendingMessagesEnabled) {
        const pendingMessage = {
          contents: message,
          user: this.user.id,
          emitted: false,
          moderated: false,
          flagged: false,
        }
        this.pendingTextMessages.push(pendingMessage)
      }

      this.newMessage = ''
      await this.$nextTick()
      this.resizeTextarea({ target: this.$refs.textareaRef })
      this.$refs.textareaRef.focus()
      this.scrollToBottom()

      clearTimeout(this.typingTimeout)
      this.notTyping()

      const isClean = await this.moderateMessage(message)

      if (this.isPendingMessagesEnabled) {
        const messageToUpdate = this.pendingTextMessages.find(
          (m) => m.contents === message && !m.moderated
        )
        if (!messageToUpdate) {
          LoggerService.noticeError(
            'Did not find message to update in pending messages.'
          )
          return
        }
        messageToUpdate.moderated = true
        messageToUpdate.flagged = !isClean
        this.processPendingMessageQueue()
      } else if (isClean) {
        this.handleOutgoingMessage({ contents: message })
      } else if (!isClean) {
        this.newMessage = message
      }

      // This is temporary for `sendTranscriptMessage`,
      // which will be removed shortly, theoretically.
      return isClean
    },

    async moderateMessage(message) {
      this.hideModerationWarning()
      this.waitingForModeration = true

      try {
        const { failures } = await ModerationService.checkIfMessageIsClean({
          message,
          sessionId: this.currentSession.id,
        })
        const isClean = Object.keys(failures).length === 0
        if (!isClean) {
          // Do not show the offending profanity to students
          // in the event it was a typo.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { profanity, ...rest } = failures
          this.failureReasons = this.isVolunteer ? failures : rest
          this.showModerationWarning()
        }
        return isClean
      } catch (e) {
        LoggerService.noticeError(`ModerationService failed with`, e)
        return true
      } finally {
        this.waitingForModeration = false
      }
    },

    async processPendingMessageQueue() {
      for (const message of [...this.pendingTextMessages]) {
        // If a message has already been emitted,
        // continue to messages that haven't been emitted yet.
        if (message.emitted) continue
        // If a message has not received back a moderation result,
        // or it's been flagged, end now until we have more information
        // to continue with the rest of the queue.
        if (!message.moderated || message.flagged) return

        this.handleOutgoingMessage(message)
        // Add a slight delay before processing the next message.
        // This delay is basically imperceptible to the user (if anything,
        // it adds a nicer UX feel), but it helps prevent a race condition
        // on the server of emitting the message back to clients out of order.
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    },

    handleOutgoingMessage(message) {
      message.emitted = true
      socket.emit('message', {
        sessionId: this.currentSession.id,
        user: this.user,
        message: message.contents,
        source:
          this.isInRecap || this.eligibleForSessionRecapChat ? 'recap' : '',
      })
    },

    removePendingMessage(message) {
      const index = this.pendingTextMessages.findIndex((m) => {
        return m.contents === message && m.emitted
      })
      if (index > -1) {
        this.pendingTextMessages.splice(index, 1)
      }
    },

    deleteFlaggedMessage(index) {
      this.editingMessageIndex = -1
      this.moderationWarningIsShown = false
      this.pendingTextMessages.splice(index, 1)
      this.processPendingMessageQueue()
    },

    isEditingMessage(index) {
      return this.editingMessageIndex === index
    },
    async onEditKeydown(event, index) {
      if (event.key === 'Escape') {
        event.preventDefault()
        this.editingMessageIndex = -1
        return
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        this.sendEdittedMessage(this.pendingTextMessages[index])
      }
    },
    async sendEdittedMessage(edittedMessage) {
      const newContent = edittedMessage?.contents.trim()
      if (newContent) {
        this.editingMessageIndex = -1
        edittedMessage.contents = newContent
        edittedMessage.moderated = false
        edittedMessage.flagged = false

        const isClean = await this.moderateMessage(newContent)
        edittedMessage.moderated = true
        edittedMessage.flagged = !isClean
        this.processPendingMessageQueue()
      }
    },

    async sendTranscriptMessage(transcript) {
      this.hideModerationWarning()

      if (wasCensoredByChrome(transcript)) {
        this.showModerationWarning()
        return false
      }

      try {
        const isClean = await this.sendMessage(transcript)
        return isClean
      } catch {
        return true
      }
    },

    async sendVoiceMessage({ audio, transcript, userEditedTranscript }) {
      try {
        this.hideModerationWarning()
        this.waitingForModeration = true

        if (wasCensoredByChrome(transcript)) {
          this.showModerationWarning()
          this.waitingForModeration = false
          return false
        }

        const { failures } = await ModerationService.checkIfMessageIsClean({
          // Moderate both original audio transcript and user edited.
          message: `${transcript} ${userEditedTranscript}`,
          sessionId: this.currentSession.id,
        })
        const transcriptToSend = userEditedTranscript.length
          ? userEditedTranscript
          : transcript
        const isClean = Object.keys(failures).length === 0
        if (isClean) {
          const form = new FormData()
          form.append('message', audio)
          form.append('senderId', this.user.id)
          form.append('sessionId', this.currentSession.id)
          form.append('transcript', transcriptToSend)
          const voiceMessageId =
            await VoiceMessageService.saveVoiceMessage(form)

          // Not worrying about voice pending messages because
          // voice messaging is going to be removed.
          socket.emit('message', {
            type: 'voice',
            sessionId: this.currentSession.id,
            user: this.user,
            message: voiceMessageId,
            transcript: transcriptToSend,
            source:
              this.isInRecap || this.eligibleForSessionRecapChat ? 'recap' : '',
          })
          return true
        } else {
          // do not show the offending profanity to students
          // in the event it was a typo
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { profanity, ...rest } = failures
          this.failureReasons = this.isVolunteer ? failures : rest
          this.showModerationWarning()
          return false
        }
      } catch (e) {
        this.showNewMessage(message)
        LoggerService.noticeError(`ModerationService failed with`, e)
        return true
      } finally {
        this.waitingForModeration = false
      }
    },

    async handleNewMessageScrollPosition() {
      await this.$nextTick()
      if (this.isAutoscrolling) {
        this.scrollToBottom()
      } else if (
        this.currentSession.messages.length > 0 &&
        this.currentSession.messages[this.currentSession.messages.length - 1]
          .user !== this.user.id
      ) {
        const messageElements = this.getUserMessageElements()

        if (
          !this.isMessageElementInView(
            messageElements[this.currentSession.messages.length - 1]
          )
        ) {
          this.$store.dispatch(
            'user/markChatMessageAsUnread',
            this.currentSession.messages.length - 1
          )
        }
      }

      this.updateAutoscrolling()
    },
    handleScroll() {
      const messageElements = this.getUserMessageElements()

      if (this.unreadChatMessageIndices.length > 0) {
        const readMessageIndices = this.unreadChatMessageIndices.filter(
          (index) => this.isMessageElementInView(messageElements[index])
        )
        this.$store.dispatch('user/markChatMessagesAsRead', readMessageIndices)
      }

      const topVisibleMessageElementIndex = messageElements.findIndex(
        this.isMessageElementInView
      )
      this.$store.dispatch(
        'user/scrollChatToMessage',
        topVisibleMessageElementIndex
      )

      this.updateAutoscrolling()
    },
    isMessageElementInView(messageElement) {
      const messagesBox = this.$refs.messages
      return (
        messageElement.offsetTop +
          messageElement.clientTop +
          messageElement.clientHeight <
          messagesBox.scrollTop + messagesBox.clientHeight &&
        messageElement.offsetTop +
          messageElement.clientTop +
          messageElement.clientHeight >
          messagesBox.scrollTop
      )
    },
    updateAutoscrolling() {
      // enable autoscrolling if scrolled to bottom
      const messagesBox = this.$refs.messages
      this.isAutoscrolling =
        messagesBox.scrollTop + messagesBox.clientHeight >=
        messagesBox.lastElementChild.offsetTop +
          messagesBox.lastElementChild.offsetHeight
    },
    scrollToUnread() {
      const messagesBox = this.$refs.messages
      const userMessageElements = this.getUserMessageElements()
      const firstUnreadIndex = Math.min(...this.unreadChatMessageIndices)

      messagesBox.scrollTop = userMessageElements[firstUnreadIndex].offsetTop
    },
    scrollToBottom() {
      const messagesBox = this.$refs.messages
      messagesBox.scrollTop =
        (messagesBox.lastElementChild?.offsetTop ?? 0) +
        (messagesBox.lastElementChild?.offsetHeight ?? 0)
    },

    resizeTextarea(event) {
      const textarea = event.target
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    },

    async triggerAlert(data) {
      try {
        await this.receiveMessageAudio.play()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Unable to play audio', error)
      }

      sendWebNotification(`${this.sessionPartnerName} has sent a message`, {
        body: data.contents,
      })
      return
    },
    getUserMessageElements() {
      // the DOM elements corresponding to messages sent by users
      // (as opposed to the chatbot)
      return Array.from(this.$refs.messages.children).filter((element) =>
        element.classList.contains('message')
      )
    },

    messageAlignment(message) {
      if (message.isSystemMessage) return MESSAGE_ALIGNMENT.CENTER
      return message.user === this.user.id
        ? MESSAGE_ALIGNMENT.RIGHT
        : MESSAGE_ALIGNMENT.LEFT
    },
    avatar(message) {
      const volunteerId =
        this.currentSession.volunteer && this.currentSession.volunteer.id
      return getChatAvatar(
        message.user,
        this.currentSession.student.id,
        volunteerId
      )
    },
    chatBotMessageStyle(message) {
      const isStudentMessage = message.user === this.currentSession.student.id
      const isVolunteerMessage = this.currentSession.volunteer
        ? message.user === this.currentSession.volunteer.id
        : false
      if (!isStudentMessage && !isVolunteerMessage) return 'bubble--chat-bot'
      return ''
    },
    shouldShowPartnerAvatar(message, index) {
      // Show the partner avatar if it's the last message.
      if (index === this.withPendingVoiceMessages.length - 1) return true

      // Show the partner avatar if the next message isn't from the partner.
      const nextMessage = this.withPendingVoiceMessages[index + 1]
      if (nextMessage.user !== message.user) return true

      return false
    },
    shouldShowTimestamp(message, index) {
      // Show the timestamp on the last message.
      if (index === this.withPendingVoiceMessages.length - 1) return true

      // Show the timestamp if the next message isn't from the same person.
      const nextMessage = this.withPendingVoiceMessages[index + 1]
      if (nextMessage.user !== message.user) return true

      // Show the timestamp if the times between this message
      // and the next are different.
      const currentFormatted = this.formatTime(message.createdAt)
      const nextFormatted = this.formatTime(nextMessage.createdAt)
      return currentFormatted !== nextFormatted
    },
    shouldShowPendingMessage(index) {
      if (index === this.pendingTextMessages.length - 1) return true
      const nextMessage = this.pendingTextMessages[index + 1]
      if (nextMessage.flagged) return true
    },
    celebrate() {
      this.$store.dispatch('celebrations/celebrate')
      socket.emit('celebrate', {
        sessionId: this.currentSession.id,
        userId: this.user.id,
        duration: DEFAULT_CELEBRATION_DURATION,
      })

      AnalyticsService.captureEvent(EVENTS.USER_SENT_CELEBRATION)
    },
  },

  watch: {
    async sessionPartner(current, previous) {
      if (current?.id !== previous?.id && current?.id) {
        await this.fetchIsSessionAudioCallEnabled(current?.id)
        if (this.isStudent) this.isTutorJoiningForFirstTime = true
      }
    },
    myInProgressCaptionMessage: {
      handler(currentVal) {
        if (this.isAutoscrolling && currentVal?.text)
          this.$nextTick(() => {
            this.scrollToBottom()
          })
      },
      deep: true,
    },
    partnerInProgressCaptionMessage: {
      handler(currentVal) {
        if (this.isAutoscrolling && currentVal?.text)
          this.$nextTick(() => {
            this.scrollToBottom()
          })
      },
      deep: true,
    },
    isTyping({ sessionId, isTyping }) {
      if (sessionId !== this.currentSession.id) return
      this.typingIndicatorShown = isTyping
    },
    messageData(data) {
      const { userId, sessionId } = data
      if (sessionId !== this.currentSession.id) return

      // If the chat is hidden show visual indicator that a new message has arrived.
      if (this.shouldHideChatSection) {
        this.setHasSeenNewMessage(false)
        this.triggerAlert(data)
      }

      // Only allow audio when a user does not have the web page in view.
      if (userId !== this.user.id && this.isWebPageHidden) {
        this.triggerAlert(data)
      }

      if (this.isPendingMessagesEnabled && data.user === this.user.id) {
        this.removePendingMessage(data.contents)
      }

      this.handleNewMessageScrollPosition()
    },
    currentSession(newValue, oldValue) {
      if (
        newValue.endedBy !== this.user.id &&
        newValue.endedAt &&
        !oldValue.endedAt &&
        Object.keys(oldValue).length > 0
      ) {
        this.$store.dispatch('user/addMessage', {
          contents: `${this.sessionPartnerName} has left the chat`,
          sessionId: this.currentSession.id,
          isSystemMessage: true,
          createdAt: new Date().toISOString(),
        })
        // Wait for the DOM to update.
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.chat {
  position: relative;
  background-color: $upchieve-white;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}

.chat-warning {
  width: 100%;
  color: $upchieve-white;
  min-height: 40px;
  position: absolute;
  left: 0;
  top: 0;
  padding: 0.75em;
  z-index: 1;
  transition: all 0.15s ease-in;

  // transition element rulesets
  &-enter,
  &-leave-to {
    top: -64px;
  }

  &--moderation {
    display: flex;
    align-items: center;
    background-color: $c-shadow-warn;
    column-gap: 0.75em;
  }

  &--connection {
    background-color: rgba(110, 140, 171, 0.87);
  }

  &--message-error {
    background-color: $c-error-red;
  }

  &__close {
    align-self: start;
    font-size: 44px;
    line-height: 16px;
    margin: 0;
    line-height: 0.5em;
    font-weight: 300;
    cursor: pointer;
  }
}

.messages-container {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.moderation-body {
  /*
   * min-width for flex content is `auto` by default.
   * set to 0 to prevent growing
   */
  min-width: 0;
}
.moderation-reasons {
  margin: 0;
  padding: 0;
  li:first-child {
    padding-top: 1em;
  }
  li {
    display: flex;
    list-style: none;
    column-gap: 12px;
  }
  .reason {
    font-weight: 600;
  }
  .instances {
    word-wrap: break-word;
    min-width: 0;
  }
}

.messages-overlay {
  z-index: 1;
}

.messages {
  background-color: $upchieve-white;
  overflow: auto;
  padding-bottom: 1.25em;
}

.unread-message-indicator {
  background-color: $c-information-blue;
  border: 0;
  border-radius: 12px;
  padding: 0.4em 0.8em;
  color: $upchieve-white;
  position: absolute;
  bottom: 4em;
  transition: 0.25s;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.35);
}

.message {
  display: flex;
  justify-content: flex-start;
  position: relative;
  margin-top: 4px;

  /* Safari needs this specified to lay out the message divs properly. */
  flex-shrink: 0;

  &.left {
    padding-left: 20px;
  }

  &.right {
    flex-direction: row-reverse;
    padding-right: 20px;

    .contents {
      align-items: flex-end;

      .bubble {
        background-color: $c-background-blue;
      }

      .metadata {
        text-align: right;
      }
    }
  }

  &.center {
    justify-content: center;
    align-items: center;
  }

  .system-message {
    color: #73737a;
    font-weight: 500;
    margin-bottom: 0.75rem;
  }

  .avatar-container {
    width: 32px;
    position: relative;
    margin-right: 4px;

    .avatar {
      border-radius: 16px;
      bottom: 29px;
      height: 32px;
      position: absolute;
      width: 100%;
    }
  }

  .contents {
    display: flex;
    flex-direction: column;
    max-width: 80%;

    .bubble {
      text-align: left;
      padding: 0.625em 0.875em;
      overflow-wrap: break-word;
      background-color: $c-background-grey;
      border-radius: 20px;
      white-space: pre-line;
      word-break: break-word;

      &--chat-bot {
        background-color: $upchieve-chat-bot-green;
      }
    }

    .metadata {
      color: #73737a;
      font-size: 14px;
      font-weight: 500;
    }
  }
}

// transition element rulesets
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.message.pending {
  opacity: 0.7;
  .contents {
    .bubble {
      background-color: $c-background-grey;
    }
  }

  .metadata {
    color: #73737a;
    font-style: italic;
    font-weight: normal;
  }
}

.message.flagged {
  .contents {
    .bubble {
      border: $c-error-red solid 1px;
      background-color: lighten($c-error-red, 25%);
    }
  }

  .metadata {
    color: $c-error-red;
    font-weight: 600;
    font-style: normal;
  }
}

.message.editing {
  .contents {
    .bubble {
      background: white;
      border: none;
      padding: 0;
    }
  }
}

.flagged-actions {
  align-items: flex-start;
  display: flex;
  gap: 4px;
  padding-top: 8px;

  .action-button {
    align-items: center;
    border: 1px solid #ccc;
    border-radius: 4px;
    display: flex;
    justify-content: center;
    padding: 6px;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      border-color: black;
    }
  }
}

.edit-textarea {
  width: 100%;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 8px;
  font-family: inherit;
  font-size: inherit;
  resize: vertical;
  min-height: 20px;

  &:focus {
    outline: none;
    border-color: #007cff;
    box-shadow: 0 0 0 2px rgba(0, 124, 255, 0.3);
  }
}

.chat-footer {
  position: relative;
  border-top: 1px solid $c-border-grey;

  .waiting-for-moderation {
    position: absolute;
    right: 2em;
    top: -2.3em;
    transition: all 0.15s ease-in;
    font-size: 13px;
    font-weight: 300;
  }

  @include breakpoint-below('medium') {
    padding: 1.25em 4.75em 2.5em 1.25em;
    display: flex;
    align-items: center;
    flex-direction: column;

    .waiting-for-moderation {
      top: -1.75em;
      right: 8.5em;
      padding: 0.25em 3.75em 2.5em 1.25em;
    }
  }

  &--recap {
    @include breakpoint-below('medium') {
      padding: 1em 0.5em;
    }
  }
}

.typing-indicator {
  position: absolute;
  top: -20px;
  padding-left: 1em;
  font-size: 13px;
  font-weight: 300;
  transition: 0.25s;
}

.flagged-indicator {
  color: $c-error-red;
  font-size: 13px;
  font-weight: 500;
  padding-left: 1em;
  position: absolute;
  top: -20px;
  transition: 0.25s;
}

.call-status-indicator {
  width: 100%;
  position: absolute;
  right: 0;
  bottom: 0;
  transition: all 0.25s ease-in;
}
.message-input {
  display: flex;
  align-items: center;
  border-top: 1px solid $c-border-grey;
  min-width: 0;
  flex-grow: 1;
  width: 100%;
  border-top: none;
}
.message-textarea {
  width: 100%;
  border: none;
  padding: 1em;
  resize: none;
  place-content: center;
  max-height: 250px;
  overflow-y: auto;
  &.hidden {
    display: none;
  }
  &:focus {
    outline: none;
  }

  @include breakpoint-below('medium') {
    height: 40px;
    border: 1px solid $c-border-grey;
    border-radius: 20px;
    padding: 0.6em 1em;
    line-height: 18px;
  }

  &--recap {
    @include breakpoint-below('medium') {
      width: 100%;
    }
  }
}
.send-button {
  padding-right: 18px;
  @include breakpoint-below('medium') {
    padding-right: 0;
  }
}
.send-button:hover:not(:disabled) {
  filter: brightness(0.9);
}
.send-button:disabled {
  :deep(circle) {
    fill: $c-disabled-grey;
  }
}
</style>
