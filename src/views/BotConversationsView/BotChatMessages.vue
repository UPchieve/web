<script lang="ts" setup>
import GenerationFeedback from './GenerationFeedback.vue'

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
  // @NEW - align bot messages to the LEFT
  if (message.senderUserType === 'bot') {
    return MESSAGE_ALIGNMENT.LEFT
  }
  return message.userId === props.user.id
    ? MESSAGE_ALIGNMENT.RIGHT
    : MESSAGE_ALIGNMENT.LEFT
}
</script>
<template>
  <div class="container">
    <div
      v-for="message in props.messages"
      :key="`message-${message.senderUserType}-${message.createdAt}`"
      :class="[messageAlignment(message)]"
      class="message"
    >
      {{ message.message }}
      <GenerationFeedback
        v-if="message.traceId"
        :traceId="message.traceId"
        :observationId="message?.observationId ?? ''"
      />
    </div>
    <div class="typing-indicator" v-if="props.messageSending">typing...</div>
  </div>
</template>

<style lang="scss" scoped>
.message {
  max-width: 90%;
}
.right {
  align-self: end;
  background-color: $c-border-grey;
  border-radius: 13px;
  padding: 9px 21px;
}
.left {
  align-self: start;
}
.typing-indicator {
  text-align: left;
  width: 100%;
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
