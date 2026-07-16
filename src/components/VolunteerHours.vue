<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import AnalyticsService from '../services/AnalyticsService.js'
import { EVENTS } from '@/consts'
import { useStore } from 'vuex'
import BecomeVolunteerAd from './BecomeVolunteerAd.vue'
import DocumentTitle from './DocumentTitle.vue'
import { onBeforeRouteLeave } from 'vue-router'
import HourCalculator from './VolunteerHours/HourCalculator.vue'
import { setHasSeenVolunteerHours } from '@/services/BrowserStorageService.js'

const store = useStore()

const title = ref('Volunteer Hours')
const showCalculator = computed(() => {
  return store.getters['featureFlags/studentToVolunteerHoursPageVersion']
    .showCalculator
})

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.V_HOUR_CALCULATOR_SEEN)
  setHasSeenVolunteerHours(store.state.user.user.id)
})
onBeforeRouteLeave(() => {
  title.value = 'UPchieve'
})
</script>

<template>
  <document-title :title="title"></document-title>
  <div class="volunteer-hours">
    <BecomeVolunteerAd class="full" />
    <HourCalculator v-if="showCalculator"></HourCalculator>
  </div>
</template>

<style lang="scss" scoped>
.volunteer-hours {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  background: $c-background-grey;
  border-radius: 12px;
  padding: 28px 24px;
  margin-bottom: 24px;

  @include breakpoint-above('large') {
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }
}

.full {
  grid-column: 1 / span 2;
}
</style>
