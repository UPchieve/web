<script setup lang="ts">
import { defineProps } from 'vue'
import { MESSAGE_ALIGNMENT } from '../BotConversationsView/BotChatMessages.vue'
import GenerationFeedback from '../BotConversationsView/GenerationFeedback.vue'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
const { alignment, message } = defineProps<{
  alignment: string
  message: any
}>()
</script>

<template>
  <div class="m-container" :class="alignment">
    <ChatBotIcon
      class="chat-bot-icon"
      v-if="alignment === MESSAGE_ALIGNMENT.LEFT"
    ></ChatBotIcon>

    <div class="message">
      {{ message.message }}
      <GenerationFeedback
        v-if="message.traceId"
        :traceId="message.traceId"
        :observationId="message?.observationId ?? ''"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.m-container {
  display: flex;
  width: 100%;
  gap: 27px;
  padding-left: 36px;
  padding-right: 36px;
}
.chat-bot-icon {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  margin-top: 12px;
}

.right {
  justify-content: end;
  & .message {
    background-color: $c-background-blue;
    border-radius: 20px;
    padding-left: 0.875em;
    padding-right: 0.875em;
  }
}
.left {
  justify-content: start;
}
.message {
  max-width: 80%;
  line-height: 160%;
  overflow-wrap: break-word;
  font-size: 18px;
  font-family: system-ui, 'Open Sans', 'Helvetica Neue', sans-serif;
  padding-top: 0.625em;
  padding-bottom: 0.625em;
  white-space: pre-line;
  text-align: left;
}
</style>
