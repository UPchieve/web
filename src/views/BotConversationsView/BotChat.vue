<script module lang="ts">
export enum DISPLAY_CONTEXT {
  STAND_ALONE = 'stand-alone',
  SESSION = 'session',
}
</script>

<script setup lang="ts">
import { useStore } from 'vuex'
import { onMounted, computed, ref, watch, nextTick } from 'vue'
import BotChatMessages from './BotChatMessages.vue'
import Textarea from './Textarea.vue'
import ModerationService from '@/services/ModerationService'
import TransferToSessionView from '@/views/BotConversationsView/TransferToSessionView/index.vue'
import AiDisclaimer from '@/views/BotConversationsView/AiDisclaimer.vue'

const { bgColor, displayContext } = defineProps<{
  displayContext: DISPLAY_CONTEXT
  bgColor?: string
}>()
const store = useStore()
const user = computed(() => store.state.user.user)
const sessionId = computed(() => store.state.user.session.id)
const isTransferToSessionEnabled = computed(() => {
  const ff: boolean | string = store.getters['featureFlags/aiTutor']
  return typeof ff === 'string' && ff.includes('handoff')
})

const chatContainer = ref()
const scrollToBottom = async () => {
  if (chatContainer?.value?.scrollHeight) {
    await nextTick()
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}
onMounted(() => scrollToBottom())

const conversation = computed(
  () => store.getters['botConversations/currentConversation']
)
const messageSending = computed(
  () => store.state.botConversations.messageIsSending
)
const fetchingConversation = computed(
  () => store.state.botConversations.isFetchingConversation
)
const messages = computed(() => conversation.value.messages ?? [])
const isMobileMode = computed(() => store.getters['app/mobileMode'])
const disclaimerMessage = computed(() => {
  const baseMessage = 'AI may not always be accurate.'
  // Show transfer message if there is not an ongoing session and if the transfer button is available
  const transferMessage =
    isTransferToSessionEnabled.value && !sessionId.value
      ? ' For more help, transfer to a live tutor!'
      : ''
  return `${baseMessage}${transferMessage}`
})

const sendMessage = async (message: string) => {
  store.commit('botConversations/setMessageIsSending', true)
  store.commit('botConversations/clearErrors')
  const isClean = await ModerationService.checkIfMessageIsClean({
    message,
    sessionId: conversation.value.sessionId,
  })
  // When we have a sessionId, we get more granular moderation
  if (isClean.failures && Object.keys(isClean.failures).length) {
    const message = Object.entries(isClean.failures).reduce(
      (message, [key, value], i) => {
        message += i > 0 ? ',' : ''
        if (key === 'profanity' && !user.value.isVolunteer) {
          message += ` ${key}`
        } else {
          message += ` ${key} (${value})`
        }
        return message
      },
      'Messages cannot contain personal information, profanity, or links to third party video services: '
    )
    store.commit('botConversations/setError', message)
    store.commit('botConversations/setMessageIsSending', false)
    return false
  }

  if (isClean) {
    await store.dispatch('botConversations/sendMessage', message)
  } else {
    store.commit(
      'botConversations/setError',
      'Messages cannot contain personal information, profanity, or links to third party video services'
    )
  }
  return isClean
}

watch(() => messages.value.length, scrollToBottom)
</script>

<template>
  <div class="bot-chat-container" ref="chatContainer">
    <div class="chat-log">
      <BotChatMessages
        :user="user"
        :messages="messages"
        :messageSending="messageSending"
        :displayContext
      />
    </div>
    <div
      :class="{
        'text-area-container': true,
        'text-area-container-mobile-standalone':
          isMobileMode && displayContext === DISPLAY_CONTEXT.STAND_ALONE,
        'text-area-container-mobile-session':
          isMobileMode && displayContext === DISPLAY_CONTEXT.SESSION,
      }"
      :style="{ backgroundColor: bgColor ?? '#fbfbfc' }"
    >
      <Textarea
        class="text-area"
        :disabled="messageSending || fetchingConversation"
        :sendMessage="(message: string) => sendMessage(message)"
        autocomplete="off"
      ></Textarea>
      <div class="footer-content">
        <TransferToSessionView
          v-if="
            isTransferToSessionEnabled && !sessionId && conversation.subject
          "
          :topic="conversation.subject.topicName"
          :subject="conversation.subject.name"
          :display-context="displayContext"
          :is-mobile-mode="isMobileMode"
        />
        <AiDisclaimer
          :message="disclaimerMessage"
          v-if="displayContext === DISPLAY_CONTEXT.STAND_ALONE"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bot-chat-container {
  overflow-y: scroll;
}
.chat-log {
  padding-bottom: calc(64px + 72px);
}

.text-area-container {
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-bottom: 36px;
  margin-left: auto;
  margin-right: auto;
  gap: 16px;
}

.text-area-container-mobile-standalone {
  bottom: 0;
  position: fixed;
  padding-bottom: 8px;
  gap: 8px;
}

.text-area-container-mobile-session {
  padding-bottom: 8px;
  gap: 8px;
}

.text-area {
  width: 80%;
  max-width: 695px;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
