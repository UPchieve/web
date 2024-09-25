<script setup lang="ts">
import { useStore } from 'vuex'
import {
  onMounted,
  computed,
  onBeforeMount,
  ref,
  watch,
  nextTick,
  onUnmounted,
} from 'vue'
import BotChatMessages from './BotChatMessages.vue'
import Errors from './Errors.vue'
import { useRoute } from 'vue-router'
import Math from '@/assets/subject_icons/math.svg'
import Textarea from './Textarea.vue'

const store = useStore()
const route = useRoute()
const user = computed(() => store.state.user.user)

onBeforeMount(async () => {
  await store.dispatch('botConversations/fetchAllSubjects')
})
const chatLog = ref()
const scrollToBottom = async () => {
  if (chatLog?.value?.scrollHeight) {
    await nextTick()
    chatLog.value.scrollTop = chatLog.value.scrollHeight
  }
}
onBeforeMount(async () => {
  await store.dispatch(
    'botConversations/setConversation',
    route.params.conversationId
  )
})
onMounted(() => scrollToBottom())
onUnmounted(
  async () => await store.dispatch('botConversations/resetCurrentConversation')
)

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
const subject = computed(() => conversation.value?.subject?.displayName ?? '')

const sendMessage = async (message: string) => {
  const result = store.dispatch('botConversations/sendMessage', message)
  await result
}
watch(() => messages.value.length, scrollToBottom)
</script>

<template>
  <div class="container">
    <Errors class="errors" />

    <div class="row header">
      <span>
        <Math class="math-icon"></Math>&nbsp;
        <span class="subject">{{ subject }}</span></span
      >
    </div>

    <div class="row chat-log" ref="chatLog">
      <BotChatMessages
        :user="user"
        :messages="messages"
        :messageSending="messageSending"
      />
    </div>

    <Textarea
      class="row"
      :disabled="messageSending || fetchingConversation"
      :sendMessage="(message: string) => sendMessage(message)"
    ></Textarea>
  </div>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px;
  row-gap: 24px;
  position: relative;
  max-width: 768px;
}

.subject {
  font-size: 24px;
  font-weight: 500;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.math-icon {
  width: 48px;
  height: 48px;
}

.row {
  width: 100%;
  margin: 0 auto;
}

.chat-log {
  flex-grow: 1;
  overflow-y: auto;
}
</style>
