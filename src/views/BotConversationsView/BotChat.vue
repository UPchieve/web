<script setup lang="ts">
import { useStore } from 'vuex'
import { onMounted, computed, ref, watch, nextTick } from 'vue'
import BotChatMessages from './BotChatMessages.vue'
import Textarea from './Textarea.vue'
import type { RootState } from '@/store/index'
import { DISPLAY_CONTEXT } from '@/constants/bot-conversations'

const props = defineProps<{
  displayContext: DISPLAY_CONTEXT
  sendMessage: (message: string) => Promise<boolean>
  disabled?: boolean
}>()
const store = useStore<RootState>()
const user = computed(() => store.state.user.user)

const chatContainer = ref<HTMLElement | null>(null)

async function scrollToBottom() {
  if (chatContainer?.value?.scrollHeight) {
    await nextTick()
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

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

onMounted(() => scrollToBottom())

watch(() => messages.value.length, scrollToBottom)
</script>

<template>
  <div class="bot-chat-container" ref="chatContainer">
    <div class="chat-log">
      <BotChatMessages
        :user="user"
        :messages="messages"
        :messageSending="messageSending"
        :displayContext="displayContext"
      />
    </div>
    <div
      class="chat-composer"
      :class="{
        'chat-composer-mobile-session':
          isMobileMode && displayContext === DISPLAY_CONTEXT.SESSION,
      }"
    >
      <Textarea
        class="chat-composer__input"
        :disabled="disabled || messageSending || fetchingConversation"
        :sendMessage="props.sendMessage"
        autocomplete="off"
      ></Textarea>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bot-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.chat-log {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.chat-composer {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 100%;
  padding: 0.6em 0;

  &-mobile-session {
    padding: 8px;
    gap: 8px;
  }

  &__input {
    width: 100%;
  }
}
</style>
