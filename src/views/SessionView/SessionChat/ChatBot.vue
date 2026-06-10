<template>
  <div class="chat-bot">
    <div class="waiting-cards">
      <div
        class="waiting-cards__container"
        v-for="(botMsg, index) in sentBotMessages"
        :key="index"
      >
        <div class="avatar-container">
          <chat-bot-icon
            v-if="sentBotMessages.length - 1 === index"
            class="avatar"
          />
        </div>
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
        <div class="avatar-container">
          <chat-bot-icon class="avatar" />
        </div>
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
import { mapGetters, mapState } from 'vuex'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { getSessionEndDMsMessage } from '@/utils/chatbot-utils'

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
    currentSession: { type: Object },
    languages: { type: Array },
    isInRecap: { type: Boolean },
    isDisplayingLanguagesSpoken: { type: Boolean, default: false },
    isExclusiveSession: { type: Boolean, default: false },
  },

  computed: {
    ...mapState({
      user: (state) => state.user.user,
      latestSession: (state) => state.session.latestSession,
    }),
    ...mapGetters({
      firstName: 'user/firstName',
      isStudent: 'user/isStudent',
      isVolunteer: 'user/isVolunteer',
      isStudentsInitiateDmsEnabled: 'featureFlags/isStudentsInitiateDmsEnabled',
    }),
    canSendDms() {
      const canInitiateDmsAsStudent =
        this.isStudent && this.isStudentsInitiateDmsEnabled
      return this.isVolunteer || canInitiateDmsAsStudent
    },
    isSessionOver() {
      return !!this.currentSession?.endedAt
    },
    isSessionWaitingForVolunteer() {
      return !this.currentSession?.volunteer
    },
    isStillMessaging() {
      return this.unsentBotMessages.length > 0
    },
    dmsSystemMessage() {
      const isSessionStudent = this.currentSession.student.id === this.user.id
      return getSessionEndDMsMessage(isSessionStudent, this.isInRecap)
    },
  },

  created() {
    if (this.isSessionOver && this.canSendDms) {
      const hasAlreadySentDms = this.currentSession.messages.some(
        (message) =>
          message.createdAt > this.currentSession.endedAt && message.user
      )
      if (!hasAlreadySentDms) {
        this.launchSessionEndedChatBot()
      }
    } else if (this.isDisplayingLanguagesSpoken) {
      const formattedLanguages = this.formatLanguagesListWithEnglish(
        this.languages
      )
      const languageSupportMessage =
        this.languages.length > 1
          ? "Feel free to use the language you're most comfortable with — if it helps!"
          : "We'll let you know if future tutors speak other languages!"
      const botMessages = [
        {
          msg: `Your tutor speaks ${formattedLanguages}. ${languageSupportMessage}`,
        },
      ]
      this.unsentBotMessages = botMessages
      this.showBotMessage()
      AnalyticsService.captureEvent(
        EVENTS.CHAT_BOT_SENT_STUDENT_VOLUNTEER_LANGUAGES,
        {
          sessionId: this.currentSession.id,
          languages: this.languages,
          languageCount: this.languages.length,
        }
      )
    } else if (this.isSessionWaitingForVolunteer && !this.isSessionOver) {
      const botMessages = this.isExclusiveSession
        ? [
            {
              msg: `Hey ${this.firstName}! I'm the UPchieve Bot.`,
            },
            {
              msg: "We've messaged your requested tutor to let them know you'd like to work together again! If they're available, they'll join you here soon.",
            },
            {
              msg: "If you'd rather not wait, tap “Open to all tutors” at the top to let any available tutor pick up your session.",
            },
            {
              msg: 'While you wait, you can save time by telling us what you need help with in the chat — or sketch the problem on the whiteboard.',
            },
          ]
        : [
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
    }
  },
  emits: ['new-bot-message', 'recap-eligible', 'loading-chatbot-message'],
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
              volunteerId: this.currentSession.volunteer.id,
            }
          )
          this.isFetchingIsSessionRecapEligible = false
          if (response.data.isEligible) {
            this.$emit('recap-eligible')
            this.$store.dispatch('user/addMessage', {
              sessionId: this.currentSession.id,
              contents: this.dmsSystemMessage,
              createdAt: new Date().toISOString(),
              user: null,
              hasHtml: true,
            })
            const event = this.isStudent
              ? EVENTS.CHAT_BOT_STUDENT_DMS_MESSAGE_SHOWN
              : EVENTS.CHAT_BOT_VOLUNTEER_DMS_MESSAGE_SHOWN
            AnalyticsService.captureEvent(event, {
              sessionId: this.currentSession.id,
            })
          } else {
            this.$store.dispatch('user/addMessage', {
              sessionId: this.currentSession.id,
              contents:
                'The session has ended. Thanks so much for picking up this session!',
              createdAt: new Date().toISOString(),
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
          LoggerService.noticeError(error)
        } finally {
          this.isFetchingIsSessionRecapEligible = false
          this.showBotMessage()
        }
      }, 2000)
    },

    formatLanguagesListWithEnglish(languages = []) {
      const allLanguages = ['English', ...languages]
      if (allLanguages.length === 1) return allLanguages[0]
      if (allLanguages.length === 2)
        return `${allLanguages[0]} and ${allLanguages[1]}`
      return `${allLanguages.slice(0, -1).join(', ')}, and ${allLanguages[allLanguages.length - 1]}`
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
.avatar-container {
  height: 32px;
  margin-right: 0.5rem;
  margin-bottom: 4px;
  width: 32px;

  .avatar {
    border-radius: 16px;
    height: 100%;
    width: 100%;
  }
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
    @include flex-container(row, initial, end);
  }

  &__message {
    background: #67d3ab;
    border-radius: 20px;
    color: #fff;
    font-size: 16px;
    overflow-wrap: break-word;
    padding: 10px 14px;
    position: relative;
    margin-bottom: 4px;
    max-width: 80%;
    text-align: left;

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
