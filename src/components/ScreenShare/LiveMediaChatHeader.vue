<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PartnerInfo from './PartnerInfo.vue'
import TalkButton from './TalkButton.vue'
import { useStore } from 'vuex'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import SpeakerButton from './SpeakerButton.vue'
import Menu from './Menu.vue'
import VolunteerIcon from '@/assets/user_avatars/volunteer-icon.svg'
import StudentIcon from '@/assets/user_avatars/student-icon.svg'

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
  partnerCanUseMic: boolean
  unableToJoinMediaRoom: boolean
  isLoadingMicControl: boolean
  isLoadingSpeakerControl: boolean
  isBanned: boolean
  isSpeaking: boolean
  isFavoriteVolunteer: boolean
  micState: 'prompt' | 'granted' | 'denied'
}>()

const store = useStore()
const userType = computed(
  () => store.getters['user/userType'] as 'student' | 'volunteer'
)

const meetingAudio = ref<HTMLAudioElement>()

onMounted(async () => {
  emit('audioUiLoaded', meetingAudio.value!)
  AnalyticsService.captureEvent(EVENTS.VOICE_CHAT_USER_SAW_ZOOM_CHAT_HEADER)
})

const toggleMuteSpeaker = async () => {
  emit('toggleMutePartner')
}
const toggleMuteMic = async () => {
  emit('toggleMuteSelf')
}

const hasConnectedToMediaRoom = computed(() => !props.unableToJoinMediaRoom)
const mobileMode = computed(() => store.getters['app/mobileMode'])
</script>

<template>
  <div class="live-media-header">
    <audio ref="meetingAudio" :muted="props.isSpeakerMuted" />
    <VolunteerIcon class="avatar" v-if="userType === 'student'" />
    <StudentIcon class="avatar" v-else />
    <PartnerInfo
      class="grow"
      :partnerPresence="props.partnerPresence"
      :isFavoriteVolunteer="props.isFavoriteVolunteer"
    />
    <div class="session-buttons" :class="userType">
      <!--        There is no session header in mobile mode, in which case
render the session control buttons in here-->

      <SpeakerButton
        :partnerMicStatus="props.partnerMicStatus"
        :isPartnerSpeaking="props.isPartnerSpeaking"
        :isSpeakerMuted="props.isSpeakerMuted"
        :partnerCanUseMic="partnerCanUseMic"
        @toggleMuteSpeaker="toggleMuteSpeaker"
        :hasConnectedToMediaRoom="hasConnectedToMediaRoom"
        :isLoading="isLoadingSpeakerControl"
      ></SpeakerButton>
      <TalkButton
        :isMicMuted="props.isMyMicMuted"
        :isSpeaking="props.isSpeaking"
        :micState="props.micState"
        :hasSpeakingPrivileges="!props.isBanned"
        :hasConnectedToMediaRoom="hasConnectedToMediaRoom"
        :isLoading="props.isLoadingMicControl"
        @toggleMuteMic="toggleMuteMic"
      />
      <Menu v-if="mobileMode" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.live-media-header {
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

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  flex-shrink: 0;
}
</style>
