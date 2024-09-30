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
      <div class="system-message" v-if="message.senderUserType === 'system'">
        <div class="info">i</div>
        <span v-html="message.message"></span>
      </div>
      <span v-else>{{ message.message }}</span>
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
  align-items: end;
  padding-left: 20px;
  padding-right: 20px;
}
.chat-bot-icon {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
}

.message {
  max-width: 80%;
  line-height: 140%;
  overflow-wrap: break-word;
  font-size: 16px;
  font-family: $font-family-default;
  white-space: pre-line;
  text-align: left;
  border-radius: 20px;
  padding: 10px 16px;
}

.system-message {
  display: flex;
  gap: 12px;
}

.info {
  font-size: 18px;
  font-weight: 500;
  border-radius: 1rem;
  line-height: 1rem;
  background-color: $c-success-green;
  color: white;
  width: 23px;
  height: 23px;
  padding: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.center {
  justify-content: center;
  & .message {
    max-width: 100%;
    background-color: $selected-green;
    border: 1px solid $c-success-green;
  }
}
.right {
  justify-content: end;
  & .message {
    background-color: $c-background-blue;
  }
}
.left {
  justify-content: start;
  & .message {
    background-color: $selected-green;
  }
}
</style>
