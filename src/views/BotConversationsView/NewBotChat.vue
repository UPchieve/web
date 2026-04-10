<script setup lang="ts">
import { useStore } from 'vuex'
import { computed, onBeforeMount, ref, watch } from 'vue'
import SelectTopicAndSubject from './SelectTopicAndSubject.vue'
import { useRoute, useRouter } from 'vue-router'
import Textarea from './Textarea.vue'
import LoggerService from '@/services/LoggerService'
import ModerationService from '@/services/ModerationService'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import Math from '@/assets/subject_icons/math.svg'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import SystemMessage from './SystemMessage.vue'
import AiDisclaimer from '@/views/BotConversationsView/AiDisclaimer.vue'
import TransferToSessionView from '@/views/BotConversationsView/TransferToSessionView/index.vue'
import { DISPLAY_CONTEXT } from '@/views/BotConversationsView/BotChat.vue'
import type { Subject } from '@/store/modules/bot-conversations'

const store = useStore()
const router = useRouter()
const route = useRoute()
type PartialSubject = Pick<Subject, 'id' | 'displayName' | 'topicName' | 'name'>
const currentSubject = ref<PartialSubject | undefined>(undefined)

const sessionId = computed(() => store.state.user.session?.id)
const isTransferToSessionEnabled = computed(() => {
  const ff: boolean | string = store.getters['featureFlags/aiTutor']
  return typeof ff === 'string' && ff.includes('handoff')
})
const disclaimerMessage = computed(() => {
  const baseMessage = 'AI may not always be accurate.'
  // Show transfer message if there is not an ongoing session and if the transfer button is available
  const transferMessage =
    isTransferToSessionEnabled.value && !sessionId.value
      ? ' For more help, transfer to a live tutor!'
      : ''
  return `${baseMessage}${transferMessage}`
})

enum STEPS {
  subjectSelection = 'subjectSelection',
  firstMessage = 'firstMessage',
}

const step = computed(() => {
  if (route.query.step === STEPS.firstMessage && currentSubject.value) {
    return route.query.step
  }
  return STEPS.subjectSelection
})

onBeforeMount(async () => {
  await store.dispatch('botConversations/fetchAllSubjects')
  const subject = store.state.botConversations.subjects.find(
    ({ name }) => name === route.query.subject
  )
  // Skip subject selection when subject query param is present
  if (subject) {
    currentSubject.value = subject
    router.replace({ query: { step: STEPS.firstMessage } })
  } else {
    router.replace({ query: { step: STEPS.subjectSelection } })
  }
})

watch(
  () => store.state.botConversations.currentConversation?.conversationId,
  async (current) => {
    if (current) {
      const navFailure = await router.push(`/ai-tutor-conversations/${current}`)
      if (navFailure) {
        LoggerService.noticeError(navFailure, {
          message: 'NewBotChat failed to redirect to conversation',
          current,
        })
      }
    }
  }
)

const fetchingConversation = computed(
  () => store.state.botConversations.isFetchingConversation
)

const selectSubject = (subject: PartialSubject) => {
  currentSubject.value = subject
  router.push({ query: { step: STEPS.firstMessage } })
  AnalyticsService.captureEvent(EVENTS.AI_TUTOR_SUBJECT_SELECTED, {
    subject: subject.displayName,
  })
}

const sendFirstMessage = async (message: string) => {
  store.commit('botConversations/clearErrors')
  const isClean = await ModerationService.checkIfMessageIsClean({
    message,
    sessionId: undefined,
  })
  if (isClean) {
    await store.dispatch('botConversations/createConversation', {
      message,
      subjectId: currentSubject.value?.id,
    })
    store.dispatch(
      'botConversations/prependSystemMessage',
      subjectSelectedMessage.value
    )
  } else {
    store.commit(
      'botConversations/setError',
      'Messages cannot contain personal information, profanity, or links to third party video services'
    )
  }
  return isClean
}
const subjectSelectedMessage = computed(
  () =>
    `You’ve selected ${currentSubject.value?.displayName}! I will now assist you with your questions. Tell me about the problem you need help with.`
)
const isMobileMode = computed(() => store.getters['app/mobileMode'])
const isMobileLandscape = computed(() => store.getters['app/isMobileLandscape'])
const isMobilePortrait = computed(() => store.getters['app/isMobilePortrait'])
</script>

<template>
  <div class="outer-container">
    <div class="header" v-if="step === STEPS.firstMessage">
      <span>
        <Math class="math-icon"></Math>&nbsp;
        <span class="subject">{{ currentSubject?.displayName }}</span></span
      >
    </div>
    <div
      v-if="step === STEPS.firstMessage"
      :class="{
        'fake-messages': true,
        'padding-mobile-landscape': isMobileLandscape,
        'padding-mobile-portrait': isMobilePortrait,
      }"
    >
      <div :class="{ 'fake-message': true }">
        <ChatBotIcon class="chat-bot-icon"></ChatBotIcon>
        <span class="message">{{ subjectSelectedMessage }}</span>
      </div>
      <div class="fake-message">
        <div class="system-info">
          <SystemMessage>
            <span
              >You can also switch to a live tutor anytime by clicking on the
              transfer button below.
              <b
                >Keep in mind the UPchieve team monitors messages - let's keep
                them safe and respectful!</b
              ></span
            >
          </SystemMessage>
        </div>
      </div>
    </div>
    <div class="container">
      <SelectTopicAndSubject
        v-if="step === STEPS.subjectSelection"
        :firstName="store.getters['user/firstName']"
        :topics="store.state.botConversations.topics"
        :on-select-subject="selectSubject"
      />

      <div class="first-message" v-if="step === STEPS.firstMessage">
        <div class="chat-log">
          <div class="typing-indicator" v-if="fetchingConversation">
            Creating chat
          </div>
        </div>
        <div
          v-if="currentSubject?.displayName"
          :class="{
            'text-area-container': true,
            'text-area-container-mobile': isMobileMode,
          }"
        >
          <Textarea
            v-if="currentSubject?.displayName"
            class="textarea"
            :placeholder="`How can UPbot help you with ${currentSubject.displayName} today?`"
            :disabled="!currentSubject || fetchingConversation"
            :sendMessage="(message: string) => sendFirstMessage(message)"
            autocomplete="off"
          ></Textarea>
          <div class="footer-content">
            <TransferToSessionView
              v-if="isTransferToSessionEnabled && !sessionId && currentSubject"
              :subject="currentSubject?.name"
              :topic="currentSubject?.topicName"
              :display-context="DISPLAY_CONTEXT.STAND_ALONE"
              :is-mobile-mode="isMobileMode"
            />
            <AiDisclaimer :message="disclaimerMessage" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.padding-mobile-landscape {
  padding-bottom: 100px;
}

.padding-mobile-portrait {
  padding-bottom: 200px;
}

.first-message {
  width: 100%;
  max-width: 695px;
  display: flex;
  flex-direction: column;
  justify-content: end;
}

.fake-messages {
  width: 100%;
  max-width: 768px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-grow: 1;
  padding-top: 11.25px;
  background-color: #fbfbfc;
}
.fake-message {
  display: flex;
  width: 100%;
  justify-content: start;
  gap: 27px;
  padding-left: 36px;
  padding-right: 36px;
  padding-bottom: 24px;
  &.followup {
    padding-left: 92px;
  }
  .message {
    font-size: 18px;
    line-height: 160%;
    font-family: system-ui, 'Open Sans', 'Helvetica Neue', sans-serif;
    max-width: 80%;
    text-align: left;
  }
  .chat-bot-icon {
    flex-shrink: 0;
    width: 30px;
    height: 30px;
  }
  .system-info {
    padding-left: 48px;
    padding-right: 48px;
  }
}

.outer-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  padding-top: 24px;
  row-gap: 18px;
  height: 100%;
  position: relative;
  max-width: 768px;
  flex-basis: 0;
}

.header {
  position: sticky;
  padding: 20px;
}

.math-icon {
  width: 48px;
  height: 48px;
}

.subject {
  font-size: 24px;
  font-weight: 500;
}

.text-area-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-left: auto;
  margin-right: auto;
  background-color: #fbfbfc;
  gap: 16px;
}

.text-area-container-mobile {
  bottom: 0;
  position: fixed;
  padding-bottom: 8px;
  display: flex;
  flex-direction: column;
  align-self: center;
  gap: 8px;
  width: 90%;
}

.chat-log {
  flex-shrink: 0;
  min-height: 24px;
  display: flex;
  align-items: center;
  align-self: start;
}

.textarea {
  width: 100%;
}

.typing-indicator {
  text-align: left;
  width: 100%;
}
.typing-indicator:after {
  overflow: hidden;
  display: inline-block;
  vertical-align: bottom;
  -webkit-animation: ellipsis steps(4, end) 900ms infinite;
  animation: ellipsis steps(4, end) 900ms infinite;
  content: '\2026'; /* ascii code for the ellipsis character */
  width: 0px;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@keyframes ellipsis {
  to {
    width: 1.25em;
  }
}

@-webkit-keyframes ellipsis {
  to {
    width: 1.25em;
  }
}
</style>
