<script lang="ts" module>
export enum MESSAGE_ALIGNMENT {
  LEFT = 'left',
  RIGHT = 'right',
  CENTER = 'center',
}
</script>

<script lang="ts" setup>
import TypingIndicatorComponent from '../SessionView/TypingIndicatorComponent.vue'
import MessageComponent from '../SessionView/MessageComponent.vue'
import WidgetMessageComponent from '../SessionView/WidgetMessageComponent.vue'
import { DISPLAY_CONTEXT } from '@/constants/bot-conversations'
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
  displayContext: DISPLAY_CONTEXT
}>()

const messageComponent =
  props.displayContext === DISPLAY_CONTEXT.SESSION
    ? WidgetMessageComponent
    : MessageComponent

function messageAlignment(message: (typeof props.messages)[number]) {
  if (message.senderUserType === 'bot') {
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
      <component
        :is="messageComponent"
        :alignment="messageAlignment(message)"
        :message
      ></component>
    </div>
    <TypingIndicatorComponent :messageSending="props.messageSending" />
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
  display: flex;
  gap: 27px;
  padding-bottom: 24px;
  padding-right: 1em;
}

.chat-bot-icon {
  width: 30px;
  height: 30px;
  margin-top: 12px;
}
</style>
