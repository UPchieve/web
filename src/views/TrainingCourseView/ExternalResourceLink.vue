<script lang="ts" setup>
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const props = defineProps<{
  link: string
  text: string
}>()

function onClick() {
  AnalyticsService.captureEvent(EVENTS.TRAINING_CLICKED_ON_EXTERNAL_LINK, {
    link: props.link,
  })
}
</script>

<template>
  <a @click="onClick" :href="props.link" target="_blank">{{ props.text }}</a>
</template>
