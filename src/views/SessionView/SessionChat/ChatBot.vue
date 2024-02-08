<template>
  <div class="chat-bot">
    <div class="waiting-cards">
      <div
        class="waiting-cards__container"
        v-for="(botMsg, index) in sentBotMessages"
        :key="index"
      >
        <chat-bot-icon class="avatar" />
        <p class="waiting-cards__message" v-if="!botMsg.hasHtml">
          {{ botMsg.msg }}
        </p>
        <p
          v-else
          v-html="botMsg.msg"
          class="waiting-cards__message waiting-cards__message--dark"
        ></p>
      </div>
    </div>
    <div
      class="waiting-cards"
      v-if="isStillMessaging || isFetchingIsSessionRecapEligible"
    >
      <div class="waiting-cards__container">
        <chat-bot-icon class="avatar" />
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

export default {
  name: 'chat-bot',

  components: { ChatBotIcon },

  data() {
    return {
      unsentBotMessages: [],
      sentBotMessages: [],
      botInterval: null,
      isSessionRecapEligible: null,
      isFetchingIsSessionRecapEligible: false,
    }
  },

  props: {
    isSessionRecapBot: { type: Boolean, default: false },
    isInRecap: { type: Boolean, default: false },
    currentSession: { type: Object },
  },

  computed: {
    ...mapGetters({
      firstName: 'user/firstName',
    }),

    isStillMessaging() {
      return this.unsentBotMessages.length > 0
    },
  },

  created() {
    if (this.isInRecap) {
      this.$store.dispatch('user/addRecapMessage', {
        contents: `Your session has ended but you can still <b>share extra resources and tips with this student!</b>
        
        You can continue conversations asynchronously by messaging in this chat!
        
        Your student will receive an email notification about your message and may respond later.
        
        (Only you are able to initiate a conversation after the session ends, a student cannot reach out to you first.)`,
        createdAt: new Date().toISOString(),
        isVolunteer: false,
        user: null,
        hasHtml: true,
      })
      this.showBotMessage()
    } else if (!this.isSessionRecapBot) {
      const botMessages = [
        {
          msg: `Hey ${this.firstName}! I'm the UPchieve Bot.`,
        },
        {
          msg: "Right now we're searching for a live coach to pair you with. This process should only take 5-10 minutes, so please hang tight!",
        },
        {
          msg: "While you're waiting, you can save time by telling us what you need help with in the chat! You can also write out a problem you're working on on the whiteboard.",
        },
      ]

      this.unsentBotMessages = botMessages

      setTimeout(() => {
        this.showBotMessage()
        this.botInterval = setInterval(this.showBotMessage, 4500)
      }, 3000)
    } else this.launchSessionEndedChatBot()
  },

  methods: {
    showBotMessage() {
      const newMessage = this.unsentBotMessages.shift()

      if (!newMessage) {
        return clearInterval(this.botInterval)
      }

      this.sentBotMessages.push(newMessage)

      this.$emit('new-bot-message')
    },

    /**
     *
     * We must know if a session is eligible for session recap/history in order
     * to know what message the chatbot should send the user. Eligibility for a session
     * determines on the `time_tutored`, which is processd via an event and not immediately
     * after a session ends. We're using a small delay to account for the delay in the time_tutored
     * calculation. This should alleviate most cases of potential race conditions for the moment
     *
     *
     * TODO: Use sockets to send a message to the client when session metrics have been calculated
     *
     */
    async launchSessionEndedChatBot() {
      this.isFetchingIsSessionRecapEligible = true
      setTimeout(async () => {
        try {
          const response = await NetworkService.isSessionRecapEligible(
            this.currentSession.id,
            {
              studentId: this.currentSession.student.id,
            }
          )
          this.isFetchingIsSessionRecapEligible = false
          if (response.data.isEligible) {
            this.$emit('recap-eligible')
            this.$store.dispatch('user/addMessage', {
              contents: `Your session has ended but you can still <b>share extra resources and tips with this student!</b>
              
              You can continue conversations asynchronously by messaging in this chat or later by going to the "Session History" tab and finding this session chat!
              
              Your student will receive an email notification about your message and may respond later.
              
              (Only you are able to initiate a conversation after the session ends, a student cannot reach out to you first.)`,
              createdAt: new Date().toISOString(),
              isVolunteer: false,
              user: null,
              hasHtml: true,
            })
            AnalyticsService.captureEvent(
              EVENTS.CHAT_BOT_GIVE_RESOURCES_MESSAGE_SHOWN,
              {
                sessionId: this.currentSession.id,
              }
            )
          } else {
            this.$store.dispatch('user/addMessage', {
              contents: 'Thanks so much for picking up this session!',
              createdAt: new Date().toISOString(),
              isVolunteer: false,
              user: null,
              hasHtml: true,
            })
            AnalyticsService.captureEvent(
              EVENTS.CHAT_BOT_SEE_YOU_SOON_MESSAGE_SHOWN,
              {
                sessionId: this.currentSession.id,
              }
            )
          }
        } catch (error) {
          this.showSessionRecapNotEligibleMessages()
          LoggerService.noticeError(error)
        } finally {
          this.isFetchingIsSessionRecapEligible = false
          this.showBotMessage()
        }
      }, 2000)
    },
  },
  watch: {
    isFetchingIsSessionRecapEligible(currentVal, prevVal) {
      if (currentVal && !prevVal)
        // Force scroll the chat to the bottom to view what the chatbot has to stay
        this.$emit('loading-chatbot-message')
    },
  },
}
</script>

<style lang="scss" scoped>
.avatar {
  width: 32px;
  height: 32px;
  margin-top: 0.3125em;
  border-radius: 16px;
  margin-right: 0.75em;
}

.chat-bot {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.waiting-cards {
  width: 100%;
  padding: 20px 20px 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  &__container {
    @include flex-container(row, initial, center);
  }

  &__message {
    text-align: left;
    position: relative;
    padding: 10px 14px;
    overflow-wrap: break-word;
    font-size: 16px;
    background: #67d3ab;
    border-radius: 20px;
    max-width: 80%;
    color: #fff;
    margin-bottom: 16px;

    &--dark {
      color: $c-soft-black;
    }

    p {
      margin: 0;
    }
  }
}

.typing-indicator {
  $ti-color-bg: #e6e7ed;
  background-color: $ti-color-bg;
  will-change: transform;
  width: auto;
  border-radius: 50px;
  padding: 14px;
  display: inline-block;
  position: relative;

  span {
    height: 9px;
    width: 9px;
    float: left;
    margin: 0 2px;
    background-color: #9e9ea1;
    display: block;
    border-radius: 50%;
    opacity: 0.4;

    @for $i from 1 through 3 {
      &:nth-of-type(#{$i}) {
        animation: 1s blink infinite ($i * 0.3333s);
      }
    }
  }
}

@keyframes blink {
  50% {
    opacity: 1;
  }
}
</style>
