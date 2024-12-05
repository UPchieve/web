<script lang="ts" setup>
import ReportSessionButton from '../ReportSessionButton.vue'
import EndSessionButton from '../EndSessionButton.vue'
import { computed } from 'vue'
import { useStore } from 'vuex'
import MutedMicIcon from '@/assets/muted-mic.svg'
import { vTooltip } from 'maz-ui'

const store = useStore()
const props = defineProps<{
  userType: 'student' | 'volunteer'
  partnerStatus: string | null
  audioCallSupported: boolean
}>()

const mobileMode = computed(() => store.getters['app/mobileMode'])
const sessionPartner = computed(() => store.getters['user/sessionPartner'])
const micStatus = computed(() => store.getters['sessionAudio/micStatus'])
</script>

<template>
  <div class="name-container">
    <div>
      <div class="name">
        {{ sessionPartner.firstname
        }}<span
          class="disabled-mic"
          v-if="micStatus && props.audioCallSupported"
          v-tooltip="{
            text: micStatus,
            color: 'black',
            position: 'bottom',
          }"
          ><MutedMicIcon class="icon"
        /></span>
      </div>
      <div class="status">
        {{ props.partnerStatus }}
      </div>
    </div>
    <div class="session-buttons" :class="props.userType" v-if="mobileMode">
      <ReportSessionButton :variant="'tertiary'" class="report-button" />
      <EndSessionButton
        class="end-button"
        :variant="'secondary'"
        :end-text="'End'"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.name-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  color: white;
}
.disabled-mic {
  vertical-align: text-bottom;
  display: inline-flex;
}
.disabled-mic::before {
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

.name {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
.status {
  font-size: 14px;
  font-weight: 400;
}

.session-buttons {
  display: flex;
  justify-content: end;
  align-items: center;
}
.session-buttons.volunteer {
  justify-content: space-between;
}

.report-button {
  background-color: transparent;
  color: white;
  border: none;
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
