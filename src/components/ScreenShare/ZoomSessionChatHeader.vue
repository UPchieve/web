<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
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

SessionAudioService.start()

onMounted(async () => {
  AnalyticsService.captureEvent(EVENTS.VOICE_CHAT_USER_SAW_ZOOM_CHAT_HEADER)
})

onUnmounted(async () => {
  // NOTE: for now, do not keep the zoom call open when they navigate away
  await SessionAudioService.send(SessionAudioEvent.LEAVE)
})

const isPartnerSpeaking = computed(
  () => store.state.liveMedia.audio.isPartnerSpeaking
)
const isSpeakerMuted = computed(
  () => store.state.liveMedia.audio.isSpeakerMuted
)
const isMicMuted = computed(() => store.state.liveMedia.audio.isMicMuted)

const toggleMuteSpeaker = async () => {
  await store.dispatch('liveMedia/audio/toggleMuteSpeaker')
}
const toggleMuteMic = async () => {
  await store.dispatch('liveMedia/audio/toggleMuteMic')
}

const partnerStatus = computed(
  () => store.getters['liveMedia/audio/partnerStatus']
)
const isSpeaking = computed(() => store.state.liveMedia.audio.isSpeaking)
const micState = computed(() => store.state.liveMedia.audio.micState)
const hasSpeakingPrivileges = computed(
  () => store.getters['liveMedia/audio/hasSpeakingPrivileges']
)
const partnerIsInAudioChannel = computed(
  () => store.getters['liveMedia/audio/partnerIsInAudioChannel']
)

const audioCallSupported = computed(
  () => store.getters['liveMedia/audio/audioCallSupported']
)
const isJoining = computed(() => store.getters['liveMedia/audio/isJoining'])
const isActiveInAnotherTab = computed(
  () => store.getters['liveMedia/audio/isActiveInAnotherTab']
)
const mobileMode = computed(() => store.getters['app/mobileMode'])
</script>

<template>
  <div class="zoom">
    <PartnerAvatar
      :isPartnerSpeaking="isPartnerSpeaking"
      :isSpeakerMuted="isSpeakerMuted"
      :userType="userType"
      :sessionPartnerFirstName="sessionPartnerFirstName"
      :partnerIsInAudioChannel="partnerIsInAudioChannel"
      @toggleMuteSpeaker="toggleMuteSpeaker"
    />
    <PartnerInfo
      class="grow"
      :userType="userType"
      :partnerStatus="partnerStatus"
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
        :isMicMuted="isMicMuted"
        :isSpeaking="isSpeaking"
        :micState="micState"
        :hasSpeakingPrivileges="hasSpeakingPrivileges"
        :audioCallSupported="audioCallSupported"
        :isJoining="isJoining"
        :isActiveInAnotherTab="isActiveInAnotherTab"
        :isStartingAudio="isStartingAudio"
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
