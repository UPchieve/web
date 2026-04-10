<script lang="ts" setup>
import RecordIcon from '@/assets/voice_message_icons/record-message.svg'
import Spinner from '@/components/Spinner.vue'
import { vTooltip } from 'maz-ui'
import { computed } from 'vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const props = defineProps<{
  isSpeaking: boolean
  isMicMuted: boolean
  micState: 'denied' | 'granted' | 'prompt'
  hasSpeakingPrivileges: boolean
  hasConnectedToMediaRoom: boolean
  isLoading: boolean
}>()
const emit = defineEmits<{
  (e: 'toggleMuteMic'): void
}>()
const isDisabled = computed(() => {
  return (
    props.micState === 'denied' ||
    !props.hasSpeakingPrivileges ||
    !props.hasConnectedToMediaRoom ||
    props.isLoading
  )
})
const tooltipText = computed(() => {
  if (!props.hasConnectedToMediaRoom) {
    return 'Unable to join call'
  } else if (props.micState === 'denied') {
    return 'Mic permission denied'
  } else if (!props.hasSpeakingPrivileges) {
    return 'You have been banned from audio'
  } else if (props.isMicMuted) {
    return 'Click to speak'
  } else {
    return 'Click to mute mic'
  }
})

const onClickMute = () => {
  AnalyticsService.captureEvent(
    EVENTS.VOICE_CHAT_USER_CLICKED_MICROPHONE_BUTTON
  )
  emit('toggleMuteMic')
}

const onMouseEnterMicButton = () => {
  AnalyticsService.captureEvent(
    EVENTS.VOICE_CHAT_USER_MOUSED_OVER_MICROPHONE_BUTTON
  )
}
</script>
<template>
  <div class="start-call-container" :class="{ muted: props.isMicMuted }">
    <Spinner
      v-if="props.isLoading"
      class="spinner"
      :container-height="48"
      :container-width="48"
      :width="36"
      :height="36"
      :thickness="3"
      v-tooltip="{
        text: 'Joining audio...',
        color: 'black',
        position: 'bottom',
      }"
    />
    <button
      v-else
      :disabled="isDisabled"
      class="speak-button"
      :class="{ muted: props.isMicMuted, speaking: props.isSpeaking }"
      @click="onClickMute"
      @mouseenter="onMouseEnterMicButton"
      v-tooltip="{
        text: tooltipText,
        color: 'black',
        position: 'bottom',
      }"
      type="button"
    >
      <RecordIcon class="icon" />
    </button>
  </div>
</template>
<style scoped lang="scss">
.start-call-container {
  --var-speak-button-height: 48px;
  --var-disabled: #aaa;
  display: flex;
  flex-grow: 1;
  justify-content: end;
  align-items: center;
}

.speak-button {
  --animation-time: 300ms;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--var-speak-button-height);
  height: var(--var-speak-button-height);
  border-radius: 50%;
  border-width: 1px;
  border-color: $c-background-grey;
  background-color: white;
  padding: 6px;
}
.speaking {
  animation: pulse var(--animation-time) infinite;
  box-shadow: 0 0 0 6px transparent;
}
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 2px #ccfff4;
    border-width: 2px;
    border-color: $c-information-blue;
    transform: scale(1.025);
  }
}

.speak-button::before,
.spinner::before {
  border-radius: 3px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  padding-left: 8px;
  padding-right: 8px;
  left: -25%;
  top: 100%;
  transition-property: none;
  max-width: 130px;
}

.icon {
  width: 48px;
  height: 48px;
}
:deep(.icon g path) {
  fill: $c-error-red;
}

.speak-button.muted {
  background-color: transparent;
  :deep(.icon g path) {
    fill: white;
  }
}

.speak-button:hover {
  backdrop-filter: brightness(0.8);
}
.speak-button:hover.muted {
  backdrop-filter: brightness(1.2);
}
.speak-button.muted::after {
  content: ' ';
  background-color: white;
  transform: rotate(45deg);
  position: absolute;
  height: calc(var(--var-speak-button-height) - 16px);
  border-radius: 2px;
  width: 2px;
}

.speak-button:disabled:hover {
  background-color: transparent;
}
.speak-button:disabled {
  border-color: var(--var-disabled);
}
.speak-button:disabled :deep(.icon g path) {
  fill: var(--var-disabled);
}

.speak-button.muted:disabled::after {
  background-color: var(--var-disabled);
}
</style>
