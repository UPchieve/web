<script setup lang="ts">
import { useStore } from 'vuex'
import { onMounted, computed, ref, watch, nextTick } from 'vue'
import BotChatMessages from './BotChatMessages.vue'
import Textarea from './Textarea.vue'
import ModerationService from '@/services/ModerationService'

const store = useStore()
const user = computed(() => store.state.user.user)

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
  <div class="chat-container" ref="chatContainer">
    <div class="chat-log">
      <BotChatMessages
        :user="user"
        :messages="messages"
        :messageSending="messageSending"
      />
    </div>

    <div class="text-area-container">
      <Textarea
        class="text-area"
        :disabled="messageSending || fetchingConversation"
        :sendMessage="(message: string) => sendMessage(message)"
      ></Textarea>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat-container {
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
  justify-content: center;
  align-items: center;
  padding-bottom: 36px;
  margin-left: auto;
  margin-right: auto;
  background-color: #fbfbfc;
}

.text-area {
  width: 80%;
  max-width: 695px;
}
</style>
