<script setup lang="ts">
import { formatPeriodActivity } from '@/services/NTHSRosterService'

defineProps<{ sessions: number; hours: number }>()
</script>

<template>
  <span
    class="period-activity"
    :class="{ none: sessions === 0 }"
    data-testid="roster-period-activity"
    >{{ formatPeriodActivity(sessions, hours) }}</span
  >
</template>

<style scoped lang="scss">
.period-activity {
  @include nths-badge;
  white-space: nowrap;
  background: $selected-green;
  color: $c-nths-deep-teal;
}
.none {
  background: $c-nths-track;
  color: $c-secondary-grey;
}
</style>
