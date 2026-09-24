<script setup lang="ts">
import {
  ROSTER_STATUS_LABELS,
  type RosterStatus,
} from '@/services/NTHSRosterService'

defineProps<{ status: RosterStatus }>()
</script>

<template>
  <span class="status-tag" :class="status">{{
    ROSTER_STATUS_LABELS[status]
  }}</span>
</template>

<style scoped lang="scss">
.status-tag {
  @include nths-badge;
  white-space: nowrap;
  background: $c-nths-warm-bg;
  color: $c-nths-warm-fg;
}
.ready-to-tutor {
  background: $selected-green;
  color: $c-nths-deep-teal;
}
</style>
