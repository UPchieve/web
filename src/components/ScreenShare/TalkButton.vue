<script lang="ts" setup>
import RecordIcon from '@/assets/voice_message_icons/record-message.svg'
import Spinner from '@/components/Spinner.vue'
import { vTooltip } from 'maz-ui'
import { computed } from 'vue'

const props = defineProps<{
  isSpeaking: boolean
  isMicMuted: boolean
  micState: 'denied' | 'granted' | 'prompt'
  hasSpeakingPrivileges: boolean
  audioCallSupported: boolean
  isJoining: boolean
  isActiveInAnotherTab: boolean
  isStartingAudio: boolean
}>()
const emit = defineEmits<{
  (e: 'toggleMuteMic'): void
}>()
const isDisabled = computed(() => {
  return (
    props.micState === 'denied' ||
    !props.hasSpeakingPrivileges ||
    !props.audioCallSupported ||
    props.isJoining ||
    props.isActiveInAnotherTab
  )
})
const tooltipText = computed(() => {
  if (props.isActiveInAnotherTab) {
    return 'Audio controls are enabled in another tab'
  }

  if (props.micState === 'denied') {
    return 'Mic disabled'
  }

  if (!props.hasSpeakingPrivileges) {
    return 'You have been banned from audio'
  }

  if (!props.audioCallSupported) {
    return 'Audio call not supported'
  }

  if (props.isMicMuted) {
    return 'Click to speak'
  }

  return 'Click to mute'
})
</script>
<template>
  <div class="start-call-container" :class="{ muted: props.isMicMuted }">
    <Spinner
      v-if="props.isJoining || props.isStartingAudio"
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
      @click="emit('toggleMuteMic')"
      v-tooltip="{
        text: tooltipText,
        color: 'black',
        position: 'bottom',
      }"
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
  border-color: white;
  background-color: white;
  padding: 6px;
}
.speaking {
  animation: pulse var(--animation-time) infinite;
  box-shadow: 0 0 0 6px transparent;
}
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 white;
    transform: scale(1.05);
  }
}

.speak-button::before {
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
  background-color: rgba(255, 255, 255, 0.8);
}
.speak-button:hover.muted {
  background-color: rgba(255, 255, 255, 0.2);
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
