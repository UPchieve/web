<script lang="ts" setup>
import { vTooltip } from 'maz-ui'
import StudentIcon from '@/assets/user_avatars/student-icon.svg'
import VolunteerIcon from '@/assets/user_avatars/volunteer-icon.svg'
import SpeakerIcon from '@/assets/voice_message_icons/speaker.svg'
import SpeakerFilledIcon from '@/assets/voice_message_icons/speaker-filled.svg'
import { computed } from 'vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const props = defineProps<{
  isPartnerSpeaking: boolean
  userType: 'student' | 'volunteer'
  isSpeakerMuted: boolean
  sessionPartnerFirstName: string
  partnerIsInAudioChannel: boolean
  unableToJoinCall: boolean
  isJoiningCall: boolean
}>()

const emit = defineEmits<{
  (e: 'toggleMuteSpeaker'): void
}>()
const tooltipText = computed(() => {
  if (props.unableToJoinCall) {
    return 'Unable to join call'
  }

  if (props.isJoiningCall) {
    return 'Joining audio..'
  }

  return props.isSpeakerMuted
    ? `Click to unmute ${props.sessionPartnerFirstName}`
    : `Click to mute ${props.sessionPartnerFirstName}`
})

const onClickPartnerAvatar = () => {
  AnalyticsService.captureEvent(
    EVENTS.VOICE_CHAT_USER_CLICKED_PARTNER_AVATAR_BUTTON
  )
  emit('toggleMuteSpeaker')
}

const onMouseEnterPartnerAvatar = () => {
  AnalyticsService.captureEvent(
    EVENTS.VOICE_CHAT_USER_MOUSED_OVER_PARTNER_AVATAR
  )
}
</script>

<template>
  <button
    v-if="props.partnerIsInAudioChannel"
    :disabled="props.unableToJoinCall || props.isJoiningCall"
    class="partner-status"
    :class="{
      volunteer: props.userType === 'student',
      muted: props.isSpeakerMuted,
      speaking: props.isPartnerSpeaking,
      'unable-to-join-call': props.unableToJoinCall || props.isJoiningCall,
    }"
    @click="onClickPartnerAvatar"
    @mouseenter="onMouseEnterPartnerAvatar"
    v-tooltip="{
      text: tooltipText,
      color: 'black',
      position: 'bottom',
    }"
  >
    <div class="icon-container">
      <VolunteerIcon class="icon" v-if="props.userType === 'student'" />
      <StudentIcon class="icon" v-else />
    </div>
    <div class="mute-line" v-if="props.isSpeakerMuted"></div>
    <div class="speaker-icon">
      <SpeakerIcon v-if="props.isSpeakerMuted" class="small-icon" />
      <SpeakerFilledIcon class="small-icon" v-else />
    </div>
  </button>
  <div
    v-else
    class="partner-status"
    :class="{ volunteer: props.userType === 'student' }"
  >
    <div class="icon-container">
      <VolunteerIcon class="icon" v-if="props.userType === 'student'" />
      <StudentIcon class="icon" v-else />
    </div>
  </div>
</template>
<style scoped lang="scss">
.partner-status {
  --animation-time: 300ms;
  --hover-scale: 1.25;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  padding: 0;
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
.partner-status::before {
  border-radius: 3px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  padding-left: 8px;
  padding-right: 8px;
  left: 175%;
  top: 100%;
  transition-property: none;
  max-width: 130px;
}

.icon-container {
  grid-area: 1 / 1 / 2 / 2;
  background-color: $c-student;
  border-radius: 3px;
  padding: 4px;
}

.volunteer .icon-container {
  background-color: $c-volunteer;
}

.icon {
  width: 40px;
  height: 40px;
}

.muted .icon-container {
  filter: brightness(65%);
}

button.partner-status:hover .icon-container {
  filter: brightness(80%);
}

.speaker-icon {
  grid-area: 1 / 1 / 2 / 2;
  z-index: 1;
  pointer-events: none;
  justify-self: end;
  align-self: end;
}
.muted .speaker-icon {
  justify-self: center;
  align-self: center;
}

button.partner-status:hover .speaker-icon {
  filter: brightness(100%);
  transform: scale(var(--hover-scale));
}
.small-icon {
  width: 18px;
  height: 18px;
}
.muted .small-icon {
  width: 36px;
  height: 36px;
}

.muted .speaker-icon {
  filter: brightness(100%);
}
.muted:hover .speaker-icon {
  transform: scale(var(--hover-scale));
}

.mute-line {
  grid-area: 1 / 1 / 2 / 2;
  background-color: white;
  transform: rotate(-45deg);
  height: 2.5px;
  pointer-events: none;
  border-radius: 2px;
}

button.partner-status:hover .mute-line {
  transform: scale(1.25) rotate(-45deg);
}

// Disabled styles
.partner-status.unable-to-join-call .mute-line,
.partner-status.unable-to-join-call:hover .mute-line {
  transform: scale(1) rotate(-45deg);
  filter: brightness(65%);
}

.partner-status.unable-to-join-call .icon-container,
.partner-status.unable-to-join-call .icon-container:hover {
  filter: brightness(65%);
}

.partner-status.unable-to-join-call .speaker-icon,
.partner-status.unable-to-join-call.muted:hover .speaker-icon {
  transform: scale(1);
  filter: brightness(65%);
}
</style>
