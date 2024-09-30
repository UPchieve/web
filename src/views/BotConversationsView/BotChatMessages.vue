<script lang="ts" module>
export const MESSAGE_ALIGNMENT = {
  LEFT: 'left',
  RIGHT: 'right',
  CENTER: 'center',
}
</script>
<script lang="ts" setup>
const props = defineProps<{
  messages: Partial<{
    id: string
    userId: string
    type: unknown
    senderUserType: 'student' | 'bot' | 'system' | 'volunteer'
    createdAt: string
    message: string
    traceId?: string
    observationId: string | undefined
  }>[]
  messageSending: boolean
  user: Partial<{ id: string; firstName: string }>
}>()

function messageAlignment(message: (typeof props.messages)[number]) {
  if (
    message.senderUserType === 'bot' ||
    message.senderUserType === 'volunteer'
  ) {
    return MESSAGE_ALIGNMENT.LEFT
  }
  if (message.senderUserType === 'system') {
    return MESSAGE_ALIGNMENT.CENTER
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
      class="message-container"
    >
      <slot
        name="message"
        :message="message"
        :alignment="messageAlignment(message)"
      ></slot>
    </div>
    <slot name="typing-indicator" :messageSending="props.messageSending"></slot>
  </div>
</template>

<style lang="scss" scoped>
.messages-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.message-container {
  width: 100%;
  max-width: 768px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  gap: 27px;
  padding-bottom: 24px;
}

.chat-bot-icon {
  width: 30px;
  height: 30px;
  margin-top: 12px;
}
</style>
