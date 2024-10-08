<script lang="ts" setup>
import LargeButton from '@/components/LargeButton.vue'
import VolunteerIcon from '@/assets/volunteer-icon.svg'
import { onMounted } from 'vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const props = defineProps<{
  onClick: () => void
  disableButton: false
}>()

onMounted(async () => {
  AnalyticsService.captureEvent(
    EVENTS.USER_SAW_AI_TUTOR_TRANSFER_TO_SESSION_BUTTON
  )
})
const handleClick = async () => {
  AnalyticsService.captureEvent(
    EVENTS.USER_CLICKED_AI_TUTOR_TRANSFER_TO_SESSION
  )
  props.onClick()
}
</script>

<template>
  <LargeButton
    :show-arrow="false"
    class="transfer-button"
    primary
    @click="handleClick"
    :disabled="disableButton"
    :class="{
      'enabled-button': !disableButton,
    }"
  >
    <div class="button-content-container">
      <VolunteerIcon class="volunteer-icon" />
      Transfer to a live tutor
    </div>
  </LargeButton>
</template>

<style lang="scss" scoped>
.button-content-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.transfer-button {
  background-color: $c-information-blue;
  border-radius: 200px;
  height: 48px;
}

.enabled-button {
  &:hover {
    background-color: $c-information-blue;
  }
}

.volunteer-icon {
  padding-right: 10px;
}
</style>
