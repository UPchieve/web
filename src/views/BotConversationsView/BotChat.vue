<script setup lang="ts">
import { useStore } from 'vuex'
import { onMounted, computed, ref, watch, nextTick } from 'vue'
import BotChatMessages from './BotChatMessages.vue'
import Textarea from './Textarea.vue'
import ModerationService from '@/services/ModerationService'

const store = useStore()
const user = computed(() => store.state.user.user)

const chatLog = ref()
const scrollToBottom = async () => {
  if (chatLog?.value?.scrollHeight) {
    await nextTick()
    chatLog.value.scrollTop = chatLog.value.scrollHeight
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

const sendMessage = async (message: string) => {
  store.commit('botConversations/clearErrors')
  const isClean = await ModerationService.checkIfMessageIsClean({
    message,
    sessionId: conversation.value.sessionId,
  })
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
  <div class="container">
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

.row {
  width: 100%;
  margin: 0 auto;
}

.chat-log {
  flex-grow: 1;
  overflow-y: auto;
}
</style>
