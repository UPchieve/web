<script setup lang="ts">
import { formatPeriodHours } from '@/services/NTHSRosterService'

defineProps<{ hours: number }>()
</script>

<template>
  <span
    class="period-hours"
    :class="{ none: hours === 0 }"
    data-testid="roster-period-hours"
    >{{ formatPeriodHours(hours) }}</span
  >
</template>

<style scoped lang="scss">
.period-hours {
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
