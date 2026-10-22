<script lang="ts" setup>
import { onMounted } from 'vue'
import AnalyticsService from '@/services/AnalyticsService'
import NTHSPageLayout from '@/components/NTHS/NTHSPageLayout.vue'
import { EVENTS } from '@/consts'

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.NTHS_APPLICATION_PENDING_VIEWED)
})
</script>

<template>
  <NTHSPageLayout>
    <p>Thanks for applying to be an NTHS President! 🎉</p>

    <p>
      Our team is reviewing your application now — you'll hear back within a few
      days. If approved, we'll send you everything you need to launch your
      chapter.
    </p>

    <strong>While you wait:</strong>
    <ul>
      <li>✅ Keep tutoring — every session makes a difference</li>
      <li>✅ Get certified in a new subject to expand your impact</li>
      <li>✅ Check out our coach resources to sharpen your skills</li>
    </ul>

    <p>
      Questions? Reach out to
      <a href="mailto:nths@upchieve.org">nths@upchieve.org</a>
    </p>
  </NTHSPageLayout>
</template>

<style lang="scss" scoped>
ul {
  padding-left: 1em;
}
li {
  list-style-type: none;
}
</style>
