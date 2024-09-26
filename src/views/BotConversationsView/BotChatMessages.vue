<script lang="ts" setup>
import GenerationFeedback from './GenerationFeedback.vue'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'

const MESSAGE_ALIGNMENT = {
  LEFT: 'left',
  RIGHT: 'right',
}
const props = defineProps<{
  messages: Partial<{
    id: string
    userId: string
    type: unknown
    senderUserType: 'student' | 'bot'
    createdAt: string
    message: string
    traceId?: string
    observationId: string | undefined
  }>[]
  messageSending: boolean
  user: Partial<{ id: string; firstName: string }>
}>()

function messageAlignment(message: (typeof props.messages)[number]) {
  if (message.senderUserType === 'bot') {
    return MESSAGE_ALIGNMENT.LEFT
  }
  return message.userId === props.user.id
    ? MESSAGE_ALIGNMENT.RIGHT
    : MESSAGE_ALIGNMENT.LEFT
}
</script>
<template>
  <div class="messages-container">
    <div
      v-for="message in props.messages"
      :key="`message-${message.senderUserType}-${message.createdAt}`"
      :class="[messageAlignment(message)]"
      class="message-container"
    >
      <ChatBotIcon
        class="chat-bot-icon"
        v-if="messageAlignment(message) === MESSAGE_ALIGNMENT.LEFT"
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
    <div class="left message-container" v-if="props.messageSending">
      <ChatBotIcon class="chat-bot-icon"></ChatBotIcon>
      <div class="message typing-indicator">typing...</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.messages-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 36px;
}
.message-container {
  width: 100%;
  max-width: 768px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  gap: 27px;
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
.chat-bot-icon {
  width: 30px;
  height: 30px;
  margin-top: 12px;
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
