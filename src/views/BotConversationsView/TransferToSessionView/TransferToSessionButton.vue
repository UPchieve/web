<script lang="ts" setup>
import LargeButton from '@/components/LargeButton.vue'
import VolunteerIcon from '@/assets/user_avatars/volunteer-icon.svg'
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
    variant="primary-blue"
    :show-arrow="false"
    @click="handleClick"
    :disabled="disableButton"
  >
    <template #icon><VolunteerIcon /></template>
    Transfer to a live tutor
  </LargeButton>
</template>
