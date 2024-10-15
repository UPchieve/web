<script lang="ts" setup>
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import LargeButton from '@/components/LargeButton.vue'
import { onMounted } from 'vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.AI_TUTOR_STAND_ALONE_BUTTON_SEEN)
})

const sendClickToAnalytics = () => {
  AnalyticsService.captureEvent(EVENTS.AI_TUTOR_STAND_ALONE_BUTTON_CLICKED)
}
</script>

<template>
  <large-button
    class="ai-bot-button"
    @click="sendClickToAnalytics"
    routeTo="/ai-tutor-conversations"
  >
    <div class="content-wrapper">
      <chat-bot-icon class="icon" />Request AI help
    </div>
  </large-button>
</template>

<style lang="scss" scoped>
.ai-bot-button {
  background-color: $c-information-blue;
  color: white;
  padding: 4px 0.8em 4px 5px;
  border-radius: 2em;
  margin-top: -44px !important;
  margin-bottom: 18px;
  @include breakpoint-below('medium') {
    margin-top: 0 !important;
  }
  justify-content: initial;
}

/*fully own alignment of icon and text*/
.content-wrapper {
  display: flex;
  align-items: center;
}

.icon {
  /* Doesn't match styles but looks good */
  margin-inline-end: 0.6em;
}
</style>
