<script setup lang="ts">
import Gleap from 'gleap'
import LoggerService from '../../services/LoggerService'
import { onBeforeMount } from 'vue'
import { RouterView } from 'vue-router'

onBeforeMount(async () => {
  try {
    Gleap.showFeedbackButton(false)
  } catch {
    LoggerService.noticeError('Failed when hiding Gleap feedback button')
  }
})
</script>

<template>
  <div class="layout">
    <RouterView></RouterView>
  </div>
</template>

<style scoped lang="scss">
.layout {
  height: 100%;
  display: flex;
  background-color: #fbfbfc;
}
</style>
