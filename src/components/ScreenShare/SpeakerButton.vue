<script lang="ts" setup>
import { vTooltip } from 'maz-ui'
import { computed } from 'vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import SpeakerMutedIcon from '@/assets/voice_message_icons/speaker-muted.svg'
import SpeakerFilledIcon from '@/assets/voice_message_icons/speaker-filled.svg'
import Spinner from '@/components/Spinner.vue'

const props = defineProps<{
  isPartnerSpeaking: boolean
  isSpeakerMuted: boolean
  hasConnectedToMediaRoom: boolean
  partnerMicStatus: string
  partnerCanUseMic: boolean
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleMuteSpeaker'): void
}>()

const disabled = computed(() => {
  return !props.hasConnectedToMediaRoom || !props.partnerCanUseMic
})

const tooltipText = computed(() => {
  if (!props.hasConnectedToMediaRoom) {
    return 'Unable to join call'
  } else if (!props.partnerCanUseMic) {
    return props.partnerMicStatus
  } else if (props.isSpeakerMuted) {
    return 'Click to listen'
  }

  return 'Click to mute speaker'
})

const onClickMute = () => {
  AnalyticsService.captureEvent(
    EVENTS.VOICE_CHAT_USER_CLICKED_PARTNER_AVATAR_BUTTON
  )

  emit('toggleMuteSpeaker')
}
</script>
<template>
  <div class="start-call-container" :class="{ muted: props.isSpeakerMuted }">
    <Spinner
      v-if="props.isLoading"
      class="spinner"
      :container-height="48"
      :container-width="48"
      :width="36"
      :height="36"
      :thickness="3"
      v-tooltip="{
        text: 'Connecting audio...',
        color: 'black',
        position: 'bottom',
      }"
    />
    <button
      v-else
      :disabled="disabled"
      class="speaker-button"
      :class="{
        muted: props.isSpeakerMuted,
        'partner-speaking': props.isPartnerSpeaking,
      }"
      @click="onClickMute"
      v-tooltip="{
        text: tooltipText,
        color: 'black',
        position: 'bottom',
      }"
      type="button"
    >
      <SpeakerMutedIcon v-if="props.isSpeakerMuted" :class="{ disabled }" />
      <SpeakerFilledIcon v-else />
    </button>
  </div>
</template>
<style scoped lang="scss">
.start-call-container {
  --var-speaker-button-size: 48px;
  --var-disabled: #aaa;
  display: flex;
  flex-grow: 1;
  justify-content: end;
  align-items: center;
}

.speaker-button {
  --animation-time: 300ms;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--var-speaker-button-size);
  height: var(--var-speaker-button-size);
  border-radius: 50%;
  border-width: 1px;
  border-color: $c-background-grey;
  background-color: transparent;
  padding: 6px;
}
.partner-speaking {
  animation: pulse var(--animation-time) infinite;
  box-shadow: 0 0 0 6px transparent;
  background-color: $c-success-green;
}
.partner-speaking.muted {
  background-color: transparent;
}
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 2px #ccfff4;
    border-width: 2px;
    border-color: $c-information-blue;
    transform: scale(1.025);
  }
}

.speaker-button::before,
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

.speaker-button.muted {
  background-color: transparent;
  :deep(.icon g path) {
    fill: white;
  }
}

.speaker-button:hover {
  backdrop-filter: brightness(1.2);
}

.speaker-button:disabled {
  filter: brightness(0.6);
}
.speaker-button:disabled:hover {
  backdrop-filter: unset;
}
</style>
