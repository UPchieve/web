<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import PartnerInfo from './PartnerInfo.vue'
import TalkButton from './TalkButton.vue'
import { useStore } from 'vuex'
import PartnerAvatar from './PartnerAvatar.vue'
import {
  SessionAudioEvent,
  SessionAudioService,
} from '@/services/LiveShareService/SessionAudioService'

const store = useStore()
const userType = computed(
  () => store.getters['user/userType'] as 'student' | 'volunteer'
)
const sessionPartnerFirstName = computed(
  () => store.getters['user/sessionPartner'].firstname
)
const isStartingAudio = computed(() => store.state.sessionAudio.isStartingAudio)

SessionAudioService.start()

onUnmounted(async () => {
  // NOTE: for now, do not keep the zoom call open when they navigate away
  await SessionAudioService.send(SessionAudioEvent.LEAVE)
})

const isPartnerSpeaking = computed(
  () => store.state.sessionAudio.isPartnerSpeaking
)
const isSpeakerMuted = computed(() => store.state.sessionAudio.isSpeakerMuted)
const isMicMuted = computed(() => store.state.sessionAudio.isMicMuted)

const toggleMuteSpeaker = async () => {
  await store.dispatch('sessionAudio/toggleMuteSpeaker')
}
const toggleMuteMic = async () => {
  await store.dispatch('sessionAudio/toggleMuteMic')
}

const partnerStatus = computed(
  () => store.getters['sessionAudio/partnerStatus']
)
const isSpeaking = computed(() => store.state.sessionAudio.isSpeaking)
const micState = computed(() => store.state.sessionAudio.micState)
const hasSpeakingPrivileges = computed(
  () => store.getters['sessionAudio/hasSpeakingPrivileges']
)
const partnerIsInAudioChannel = computed(
  () => store.getters['sessionAudio/partnerIsInAudioChannel']
)

const audioCallSupported = computed(
  () => store.getters['sessionAudio/audioCallSupported']
)
const isJoining = computed(() => store.getters['sessionAudio/isJoining'])
const isActiveInAnotherTab = computed(
  () => store.getters['sessionAudio/isActiveInAnotherTab']
)
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
}

.grow {
  flex-grow: 1;
}

.icon {
  width: 24px;
  height: 24px;
}

.container {
  display: flex;
  overflow: hidden;
  align-self: center;
  height: 80vh;
  width: 80vw;
}
</style>
