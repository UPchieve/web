<script lang="ts" setup>
import { onMounted } from 'vue'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import ActivityDot from '@/components/ActivityDot.vue'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'

const { showHasAiMessageIndicator } = defineProps<{
  showHasAiMessageIndicator: boolean
}>()
const emit = defineEmits(['click'])

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.AI_TUTOR_WIDGET_TOOLBAR_BUTTON_SEEN)
})
</script>

<template>
  <button type="button" @click="emit('click')">
    <activity-dot v-if="showHasAiMessageIndicator" class="unread-indicator" />
    <ChatBotIcon class="toolbar-icon" />
  </button>
</template>

<style lang="scss">
.unread-indicator {
  position: absolute;
  top: 15px;
  left: 10px;
}
</style>
