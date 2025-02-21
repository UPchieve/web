<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import PartnerInfo from './PartnerInfo.vue'
import TalkButton from './TalkButton.vue'
import { useStore } from 'vuex'
import PartnerAvatar from './PartnerAvatar.vue'
import {
  SessionAudioEvent,
  SessionAudioService,
} from '@/services/LiveShareService/SessionAudioService'
import EndSessionButton from '@/components/EndSessionButton.vue'
import ReportSessionButton from '@/components/ReportSessionButton.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const emit = defineEmits<{
  (e: 'toggleMuteSelf'): void
  (e: 'toggleMutePartner'): void
  (e: 'audioUiLoaded', audioElement: HTMLAudioElement): void
}>()

const props = defineProps<{
  isMyMicMuted: boolean
  isSpeakerMuted: boolean
  isPartnerSpeaking: boolean
  partnerPresence: string
  partnerMicStatus: string
  unableToJoinCall: boolean
  isJoiningCall: boolean
  isBanned: boolean
  unableToJoinAudio: boolean
  isSpeaking: boolean
  micState: 'prompt' | 'granted' | 'denied'
}>()

const store = useStore()
const userType = computed(
  () => store.getters['user/userType'] as 'student' | 'volunteer'
)
const sessionPartnerFirstName = computed(
  () => store.getters['user/sessionPartner'].firstname
)
const isStartingAudio = computed(
  () => store.state.liveMedia.audio.isStartingAudio
)

const meetingAudio = ref<HTMLAudioElement>()

onMounted(async () => {
  emit('audioUiLoaded', meetingAudio.value)
  AnalyticsService.captureEvent(EVENTS.VOICE_CHAT_USER_SAW_ZOOM_CHAT_HEADER)
})

onUnmounted(async () => {
  // NOTE: for now, do not keep the zoom call open when they navigate away
  await SessionAudioService.send(SessionAudioEvent.LEAVE)
})

const useChimeMeetings = computed(
  () => store.getters['featureFlags/isChimeMeetingEnabled']
)

// Do not initiate zoom if we're using chime
if (!useChimeMeetings.value) {
  SessionAudioService.start()
}

const isPartnerSpeaking = computed(() =>
  useChimeMeetings.value
    ? props.isPartnerSpeaking
    : store.state.liveMedia.audio.isPartnerSpeaking
)
const isSpeakerMuted = computed(() =>
  useChimeMeetings.value
    ? props.isSpeakerMuted
    : store.state.liveMedia.audio.isSpeakerMuted
)

const toggleMuteSpeaker = async () => {
  if (useChimeMeetings.value) {
    emit('toggleMutePartner')
  } else {
    await store.dispatch('liveMedia/audio/toggleMuteSpeaker')
  }
}
const toggleMuteMic = async () => {
  if (useChimeMeetings.value) {
    emit('toggleMuteSelf')
  } else {
    await store.dispatch('liveMedia/audio/toggleMuteMic')
  }
}

const partnerPresence = computed(() =>
  useChimeMeetings.value
    ? props.partnerPresence
    : store.getters['liveMedia/audio/partnerStatus']
)
const isSpeaking = computed(() => {
  return useChimeMeetings.value
    ? props.isSpeaking
    : store.state.liveMedia.audio.isSpeaking
})
const micState = computed(() => {
  return useChimeMeetings.value
    ? props.micState
    : store.state.liveMedia.audio.micState
})
const hasSpeakingPrivileges = computed(() =>
  useChimeMeetings.value
    ? !props.isBanned
    : store.getters['liveMedia/audio/hasSpeakingPrivileges']
)
const partnerIsInAudioChannel = computed(
  () => store.getters['liveMedia/audio/partnerIsInAudioChannel']
)

const audioCallSupported = computed(() =>
  useChimeMeetings.value
    ? !props.unableToJoinCall
    : store.getters['liveMedia/audio/audioCallSupported']
)
const isJoiningCall = computed(() =>
  useChimeMeetings.value
    ? props.isJoiningCall
    : store.getters['liveMedia/audio/isJoining']
)
const isActiveInAnotherTab = computed(() =>
  useChimeMeetings.value
    ? false
    : store.getters['liveMedia/audio/isActiveInAnotherTab']
)
const mobileMode = computed(() => store.getters['app/mobileMode'])
</script>

<template>
  <div class="zoom">
    <audio v-if="useChimeMeetings" ref="meetingAudio" :muted="isSpeakerMuted" />
    <PartnerAvatar
      :isPartnerSpeaking="isPartnerSpeaking"
      :isSpeakerMuted="isSpeakerMuted"
      :userType="userType"
      :sessionPartnerFirstName="sessionPartnerFirstName"
      :partnerIsInAudioChannel="
        useChimeMeetings ? true : partnerIsInAudioChannel
      "
      @toggleMuteSpeaker="toggleMuteSpeaker"
      :unableToJoinCall="
        useChimeMeetings && (unableToJoinCall || unableToJoinAudio)
      "
      :isJoiningCall="useChimeMeetings && isJoiningCall"
    />
    <PartnerInfo
      class="grow"
      :userType="userType"
      :partnerPresence="partnerPresence"
      :partnerMicStatus="partnerMicStatus"
      :audioCallSupported="audioCallSupported"
    />
    <div class="session-buttons" :class="userType">
      <!--        There is no session header in mobile mode, in which case
render the session control buttons in here-->
      <ReportSessionButton
        v-if="mobileMode"
        :variant="'tertiary'"
        class="report-button"
      />
      <EndSessionButton
        v-if="mobileMode"
        class="end-button"
        :variant="'secondary'"
        :end-text="'End'"
      />
      <TalkButton
        :isMicMuted="
          useChimeMeetings
            ? props.isMyMicMuted
            : store.state.liveMedia.audio.isMicMuted
        "
        :isSpeaking="isSpeaking"
        :micState="micState"
        :hasSpeakingPrivileges="hasSpeakingPrivileges"
        :audioCallSupported="audioCallSupported"
        :isJoiningCall="useChimeMeetings && isJoiningCall"
        :isActiveInAnotherTab="isActiveInAnotherTab"
        :isStartingAudio="isStartingAudio"
        :unableToJoinCall="
          useChimeMeetings && (unableToJoinCall || unableToJoinAudio)
        "
        @toggleMuteMic="toggleMuteMic"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.zoom {
  background-color: $c-information-blue;
  display: flex;
  justify-content: start;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px 8px 0 0;
  gap: 12px;
  z-index: 1;
  min-height: 64px;
  @include breakpoint-below('medium') {
    border-radius: 0;
  }

  @include breakpoint-below('tiny') {
    gap: 4px;
    padding: 8px 8px;
  }
}

.grow {
  flex-grow: 1;
}

.icon {
  width: 24px;
  height: 24px;
}

.session-buttons {
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 12px;
}
.session-buttons.volunteer {
  justify-content: space-between;
}

.report-button {
  background-color: transparent;
  color: white;
  border: none;
  padding: 0px;
  &:hover {
    background-color: #fff3;
  }
}
.end-button {
  background-color: transparent;
  color: white;
  border-color: white;
  &:hover {
    border-color: white;
    background-color: #fff3;
  }
}
</style>
