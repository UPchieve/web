<template>
  <div class="chat">
    <document-title :title="documentTitle"></document-title>
    <div>
      <transition name="chat-warning">
        <div
          class="chat-warning chat-warning--moderation"
          v-show="moderationWarningIsShown"
        >
          <span
            >Messages cannot contain personal information, profanity, or links
            to third party video services</span
          >
          <span class="chat-warning__close" @click="hideModerationWarning"
            >×</span
          >
        </div>
      </transition>
      <transition name="chat-warning">
        <loading-message
          message="Attempting to connect the chat"
          class="chat-warning chat-warning--connection"
          v-show="isSessionConnectionFailure"
        />
      </transition>
      <transition name="chat-warning">
        <p
          class="chat-warning chat-warning--message-error"
          v-show="isMessageError"
        >
          Failed to send message
        </p>
      </transition>
    </div>

    <div class="messages-container">
      <div class="messages" ref="messages" @scroll="handleScroll" tabindex="0">
        <chat-bot
          v-if="!user.isVolunteer && isSessionWaitingForVolunteer"
          @new-bot-message="handleIncomingMessage"
        />
        <template>
          <div
            v-for="(message, index) in currentSession.messages"
            :key="`message-${index}`"
            :class="messageAlignment(message)"
            class="message"
          >
            <component
              class="avatar"
              :is="avatar(message)"
              v-if="message.user !== user.id"
            />

            <div class="contents" :class="chatBotContents(message)">
              <span v-if="message.hasHtml" v-html="message.contents"></span>
              <span v-else>{{ message.contents }}</span>
            </div>
            <div class="time">
              {{ message.createdAt | formatTime }}
            </div>
          </div>
        </template>
        <chat-bot
          v-if="sessionHasEnded && isSessionRecapDmsActive"
          :isSessionRecapBot="true"
          :currentSession="currentSession"
          @recap-eligible="toggleEligibleForSessionRecapChat"
          @loading-chatbot-message="scrollToBottom"
        />
        <chat-bot
          v-if="
            user.isVolunteer &&
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

    <audio
      class="audio__receive-message"
      src="@/assets/audio/receive-message.mp3"
      muted
    />

    <div class="chat-footer" :class="isInRecap && 'chat-footer--recap'">
      <transition name="fade">
        <div
          class="typing-indicator"
          v-show="
            typingIndicatorShown && isSessionConnectionAlive && isSessionAlive
          "
        >
          {{ sessionPartnerName || 'Chatbot' }} is typing...
        </div>
      </transition>

      <textarea
        class="message-textarea"
        @keydown.enter.prevent
        @keyup="handleOutgoingMessage"
        v-model="newMessage"
        placeholder="Type a message..."
      />
    </div>
  </div>
</template>

<script>
import { setTimeout, clearTimeout } from 'timers'
import _ from 'lodash'
import { mapState, mapGetters } from 'vuex'

import ChatBot from './ChatBot'
import DocumentTitle from '@/components/DocumentTitle.vue'
import LoadingMessage from '@/components/LoadingMessage.vue'
import ModerationService from '@/services/ModerationService'
import sendWebNotification from '@/utils/send-web-notification'
import getChatAvatar from '@/utils/get-chat-avatar'
import LoggerService from '@/services/LoggerService'

const MESSAGE_ALIGNMENT = {
  LEFT: 'left',
  RIGHT: 'right',
}

/**
 * @todo {1} Use more descriptive names that comply with the coding standards.
 *           Keep in mind that it also requires a small backend update in
 *           router/sockets.js
 */
export default {
  name: 'session-chat',
  components: { ChatBot, LoadingMessage, DocumentTitle },
  props: {
    setHasSeenNewMessage: { type: Function, required: true },
    shouldHideChatSection: { type: Boolean, required: true },
    currentSession: { type: Object, required: true },
    isInRecap: { type: Boolean, default: false },
    isSessionConnectionAlive: { type: Boolean, required: true },
    isSessionAlive: { type: Boolean, required: true },
    isFetchingIsSessionRecapEligible: { type: Boolean, default: false },
    isSessionRecapEligible: { type: Boolean, default: false },
    sessionHasEnded: { type: Boolean, default: false },
  },
  data() {
    return {
      newMessage: '',
      moderationWarningIsShown: false,
      typingTimeout: null,
      typingIndicatorShown: false,
      isMessageError: false,
      isAutoscrolling: false,
      showChatBot: false,
      eligibleForSessionRecapChat: false,
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      isWebPageHidden: state => state.app.isWebPageHidden,
      unreadChatMessageIndices: state => state.user.unreadChatMessageIndices,
      chatScrolledToMessageIndex: state =>
        state.user.chatScrolledToMessageIndex,
    }),
    ...mapGetters({
      isSessionWaitingForVolunteer: 'user/isSessionWaitingForVolunteer',
      numberOfUnreadChatMessages: 'user/numberOfUnreadChatMessages',
      isSessionRecapDmsActive: 'featureFlags/isSessionRecapDmsActive',
    }),
    sessionPartnerName() {
      if (!this.currentSession) return ''
      return this.user.isVolunteer
        ? this.currentSession.student?.firstName
        : this.currentSession.volunteer?.firstName
    },
    // The chat is already loaded with a connection failure in SessionRecapView
    // since it's checking if the socket joined the room. Exclude SessionRecapView
    // when logging out expected errors
    isSessionConnectionFailure: function() {
      const isConnectionFailure =
        !this.isSessionConnectionAlive && this.isSessionAlive && !this.isInRecap
      if (isConnectionFailure)
        LoggerService.noticeError(new Error('Attempting to connect the chat'), {
          tags: {
            sessionId: this.currentSession.id,
          },
        })
      return isConnectionFailure
    },
    unreadMessageNote: function() {
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
        this.isSessionConnectionAlive &&
        this.isSessionAlive
        ? `${this.sessionPartnerName || 'Chatbot'} is typing...`
        : 'UPchieve'
    },
  },
  mounted() {
    if (this.chatScrolledToMessageIndex !== null) {
      const messageElements = this.getUserMessageElements()
      this.$refs.messages.scrollTop =
        messageElements[this.chatScrolledToMessageIndex].offsetTop
    }
  },
  methods: {
    showModerationWarning() {
      this.moderationWarningIsShown = true
    },
    hideModerationWarning() {
      this.moderationWarningIsShown = false
    },
    toggleEligibleForSessionRecapChat() {
      this.eligibleForSessionRecapChat = true
    },
    showNewMessage(message) {
      this.$socket.emit('message', {
        sessionId: this.currentSession.id,
        user: this.user,
        message,
        source:
          this.isInRecap || this.eligibleForSessionRecapChat ? 'recap' : '',
      })
    },
    isEventFromSameSession(sessionId) {
      return this.currentSession.id === sessionId
    },
    clearMessageInput() {
      this.newMessage = ''
    },
    notTyping() {
      // Tell the server that the user is no longer typing
      this.$socket.emit('notTyping', {
        sessionId: this.currentSession.id,
      })
    },
    handleOutgoingMessage(event) {
      // If key pressed is Enter, send the message
      if (event.key == 'Enter') {
        const message = this.newMessage.trim()
        this.clearMessageInput()

        // Early exit if message is blank
        if (_.isEmpty(message)) return

        // Reset the chat warning
        this.hideModerationWarning()

        // Check for personal info/profanity in message
        ModerationService.checkIfMessageIsClean(message).then(isClean => {
          if (isClean) {
            this.showNewMessage(message)
          } else {
            this.showModerationWarning()
          }
        })

        // Disregard typing handler for enter
        this.notTyping()
        return

        // Disregard typing handler for backspace
      } else if (event.key == 'Backspace') return

      // Typing handler for when non-Enter/Backspace keys are pressed
      this.$socket.emit('typing', {
        sessionId: this.currentSession.id,
      })

      /** Every time a key is pressed, set an inactive timer
          If another key is pressed within 2 seconds, reset timer**/
      clearTimeout(this.typingTimeout)
      this.typingTimeout = setTimeout(() => {
        this.notTyping()
      }, 2000)
    },
    async triggerAlert(data) {
      try {
        const receiveMessageAudio = document.querySelector(
          '.audio__receive-message'
        )
        // Unmuting the audio allows us to bypass the need for user interaction with the DOM before playing a sound
        receiveMessageAudio.muted = false
        await receiveMessageAudio.play()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('Unable to play audio')
      }

      sendWebNotification(`${this.sessionPartnerName} has sent a message`, {
        body: data.contents,
      })
      return
    },
    handleScroll() {
      const messageElements = this.getUserMessageElements()

      if (this.unreadChatMessageIndices.length > 0) {
        const readMessageIndices = this.unreadChatMessageIndices.filter(index =>
          this.isMessageElementInView(messageElements[index])
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
    async handleIncomingMessage() {
      // called whenever a new message enters the chat, either from
      // a user or from the chatbot
      await this.$nextTick()
      if (this.isAutoscrolling) {
        // autoscroll chat if at bottom
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
    getUserMessageElements() {
      // the DOM elements corresponding to messages sent by users
      // (as opposed to the chatbot)
      return Array.from(this.$refs.messages.children).filter(element =>
        element.classList.contains('message')
      )
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
        messagesBox.lastElementChild.offsetTop +
        messagesBox.lastElementChild.offsetHeight
    },
    messageAlignment(message) {
      return message.user === this.user.id
        ? MESSAGE_ALIGNMENT.RIGHT
        : MESSAGE_ALIGNMENT.LEFT
    },
    showAvatar(message) {
      return this.messageAlignment(message) === MESSAGE_ALIGNMENT.LEFT
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
    chatBotContents(message) {
      const isStudentMessage = message.user === this.currentSession.student.id
      const isVolunteerMessage = this.currentSession.volunteer
        ? message.user === this.currentSession.volunteer.id
        : false
      if (!isStudentMessage && !isVolunteerMessage) return 'contents--chat-bot'
      return ''
    },
  },
  sockets: {
    'is-typing'(data) {
      if (this.isEventFromSameSession(data.sessionId))
        this.typingIndicatorShown =
          this.isSessionConnectionAlive && this.isSessionAlive
    },
    'not-typing'(data) {
      if (this.isEventFromSameSession(data.sessionId))
        this.typingIndicatorShown = false
    },
    async messageSend(data) {
      const { userId, sessionId } = data
      if (!this.isEventFromSameSession(sessionId)) return
      // If the chat is hidden show visual indicator that a new message has arrived
      if (this.shouldHideChatSection) {
        this.setHasSeenNewMessage(false)
        this.triggerAlert(data)
      }

      // Only allow audio when a user does not have the web page in view
      if (userId !== this.user.id && this.isWebPageHidden)
        this.triggerAlert(data)

      if (this.isInRecap) this.$store.dispatch('user/addRecapMessage', data)
      else this.$store.dispatch('user/addMessage', data)

      this.handleIncomingMessage()
    },
    messageError(data) {
      if (this.isMessageError || !this.isEventFromSameSession(data.sessionId))
        return
      this.isMessageError = true
      setTimeout(() => {
        this.isMessageError = false
      }, 1000)
    },
  },
  watch: {
    'currentSession.messages'(currentVal, prevVal) {
      if ((this.isInRecap && currentVal, !prevVal))
        // Wait for the DOM to update
        this.$nextTick(() => {
          this.scrollToBottom()
        })
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
  }

  &--connection {
    background-color: rgba(110, 140, 171, 0.87);
  }

  &--message-error {
    background-color: $c-error-red;
  }

  &__close {
    font-size: 3.5rem;
    cursor: pointer;
  }
}

.messages-container {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
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
  padding: 0 0.8em;
  color: $upchieve-white;
  position: absolute;
  bottom: 1.5em;
  transition: 0.25s;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.35);
}

.message {
  position: relative;
  padding: 1.5em;
  display: flex;
  justify-content: flex-start;

  /* Safari needs this specified to lay out the message divs properly. */
  flex-shrink: 0;
}

.avatar {
  width: 32px;
  height: 32px;
  margin-top: 0.3125em;
  border-radius: 16px;
  margin-right: 0.75em;
}

.name {
  font-weight: 600;
}

.time {
  font-size: 14px;
  font-weight: 500;
  color: #73737a;
  position: absolute;
  bottom: 0;
}

.contents {
  text-align: left;
  padding: 0.625em 0.875em;
  overflow-wrap: break-word;
  background-color: $c-background-grey;
  border-radius: 20px;
  max-width: 80%;
  white-space: pre-line;

  &--chat-bot {
    background-color: $upchieve-chat-bot-green;
  }
}

// transition element rulesets
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.left {
  .time {
    margin-left: 44px;
  }
}

.right {
  flex-direction: row-reverse;

  .contents {
    background-color: $c-background-blue;
  }
}

.chat-footer {
  position: relative;

  @include breakpoint-below('medium') {
    padding: 1.25em 8.75em 2.5em 1.25em;
    display: flex;
    align-items: center;
  }

  &--recap {
    @include breakpoint-below('medium') {
      padding: 1em 0.5em;
    }
  }
}

.typing-indicator {
  position: absolute;
  top: -2.3em;
  padding-left: 1em;
  font-size: 13px;
  font-weight: 300;
  transition: 0.25s;

  @include breakpoint-below('medium') {
    top: -1.5em;
  }
}

.message-textarea {
  width: 100%;
  border: none;
  border-top: 1px solid $c-border-grey;
  padding: 1em;
  resize: none;

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

.audio__receive-message {
  display: none;
}
</style>
