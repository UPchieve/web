<script setup lang="ts">
import ScreenShareIcon from '@/assets/screen-share.svg'
import { onMounted } from 'vue'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'

onMounted(() => {
  AnalyticsService.captureEvent(
    EVENTS.SCREENSHARE_USER_SAW_START_SCREENSHARE_BUTTON
  )
})
</script>

<template>
  <ScreenShareIcon />
</template>
