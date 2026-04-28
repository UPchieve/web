<script setup lang="ts">
import { MESSAGE_ALIGNMENT } from '../BotConversationsView/BotChatMessages.vue'
import GenerationFeedback from '@/components/GenerationFeedback.vue'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import StudentIcon from '@/assets/user_avatars/student-icon.svg'
import VolunteerIcon from '@/assets/user_avatars/volunteer-icon.svg'
import SystemMessage from '../BotConversationsView/SystemMessage.vue'
import { EVENTS } from '@/consts'

const { alignment, message } = defineProps<{
  alignment: MESSAGE_ALIGNMENT
  message: any
}>()

function messageClassFor(
  senderUserType: 'bot' | 'student' | 'volunteer',
  alignment: MESSAGE_ALIGNMENT
) {
  if (senderUserType === 'bot') {
    return 'bot'
  }
  if (alignment === MESSAGE_ALIGNMENT.LEFT) {
    return 'partner'
  }
}

const thumbsUpEvent = EVENTS.AI_TUTOR_THUMBS_UP
const thumbsDownEvent = EVENTS.AI_TUTOR_THUMBS_DOWN
const followupFeedbackEvent = EVENTS.AI_TUTOR_FOLLOWUP_FEEDBACK
</script>

<template>
  <div class="m-container" :class="alignment">
    <ChatBotIcon
      class="icon"
      v-if="
        alignment === MESSAGE_ALIGNMENT.LEFT && message.senderUserType === 'bot'
      "
    ></ChatBotIcon>
    <VolunteerIcon
      class="icon"
      v-else-if="
        alignment === MESSAGE_ALIGNMENT.LEFT &&
        message.senderUserType === 'volunteer'
      "
    ></VolunteerIcon>
    <StudentIcon
      class="icon"
      v-else-if="
        alignment === MESSAGE_ALIGNMENT.LEFT &&
        message.senderUserType === 'student'
      "
    ></StudentIcon>

    <div
      class="message"
      :class="messageClassFor(message.senderUserType, alignment)"
    >
      <SystemMessage v-if="message.senderUserType === 'system'">
        <span v-html="message.message"></span>
      </SystemMessage>

      <span v-else>{{ message.message }}</span>
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
  align-items: end;
  gap: 8px;
}
.icon {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
}

.message {
  line-height: 140%;
  overflow-wrap: break-word;
  font-size: 16px;
  font-family: $font-family-default;
  font-display: swap;
  white-space: pre-line;
  text-align: left;
  border-radius: 20px;
}

.center {
  justify-content: center;
}

.right {
  justify-content: end;
  padding-left: 3rem;
  & .message {
    padding: 10px 16px;
    background-color: $c-background-blue;
  }
}
.left {
  justify-content: start;
  padding-right: 1rem;

  & .bot {
    background-color: $selected-green;
    padding: 10px 16px;
  }

  & .partner {
    padding: 10px 16px;
    background-color: $c-background-grey;
  }
}
</style>
