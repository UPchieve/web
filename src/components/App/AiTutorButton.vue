<script lang="ts" setup>
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import LargeButton from '@/components/LargeButton.vue'
import { onMounted } from 'vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.AI_TUTOR_STAND_ALONE_BUTTON_SEEN)
})
</script>

<template>
  <large-button
    class="ai-bot-button"
    @click="
      () => {
        AnalyticsService.captureEvent(
          EVENTS.AI_TUTOR_STAND_ALONE_BUTTON_CLICKED
        )
      }
    "
    routeTo="/ai-tutor-conversations"
  >
    <chat-bot-icon class="icon" />Request AI help
  </large-button>
</template>

<style lang="scss" scoped>
.ai-bot-button {
  background-color: $c-information-blue;
  color: white;
  padding: 4px 8px;
  border-radius: 2em;
  margin-top: -44px !important;
  margin-bottom: 18px;
  @include breakpoint-below('medium') {
    margin-top: 0 !important;
  }
}
</style>
