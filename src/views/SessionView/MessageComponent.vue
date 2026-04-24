<script setup lang="ts">
import { MESSAGE_ALIGNMENT } from '../BotConversationsView/BotChatMessages.vue'
import GenerationFeedback from '@/components/GenerationFeedback.vue'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import VolunteerIcon from '@/assets/user_avatars/volunteer-icon.svg'
import StudentIcon from '@/assets/user_avatars/student-icon.svg'
import { EVENTS } from '@/consts'

const { alignment, message } = defineProps<{
  alignment: string
  message: any
}>()

const thumbsUpEvent = EVENTS.AI_TUTOR_THUMBS_UP
const thumbsDownEvent = EVENTS.AI_TUTOR_THUMBS_DOWN
const followupFeedbackEvent = EVENTS.AI_TUTOR_FOLLOWUP_FEEDBACK
</script>

<template>
  <div class="m-container" :class="alignment">
    <ChatBotIcon
      class="chat-bot-icon"
      v-if="
        alignment === MESSAGE_ALIGNMENT.LEFT && message.senderUserType === 'bot'
      "
    ></ChatBotIcon>
    <VolunteerIcon
      class="chat-bot-icon"
      v-else-if="
        alignment === MESSAGE_ALIGNMENT.LEFT &&
        message.senderUserType === 'volunteer'
      "
    ></VolunteerIcon>
    <StudentIcon
      class="chat-bot-icon"
      v-else-if="
        alignment === MESSAGE_ALIGNMENT.LEFT &&
        message.senderUserType === 'student'
      "
    ></StudentIcon>

    <div class="message">
      <span v-html="message.message" />
      <GenerationFeedback
        v-if="message.traceId"
        :traceId="message.traceId"
        :observationId="message?.observationId ?? ''"
        name="tutor-bot-feedback"
        :analyticsServiceThumbsUp="{ eventName: thumbsUpEvent }"
        :analyticsServiceThumbsDown="{ eventName: thumbsDownEvent }"
        :analyticsServiceFollowup="{ eventName: followupFeedbackEvent }"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.m-container {
  display: flex;
  width: 100%;
  gap: 27px;
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
