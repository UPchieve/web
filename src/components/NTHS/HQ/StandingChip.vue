<script setup lang="ts">
import { computed } from 'vue'
import type { NTHSChapterImpactPublic } from '@/services/NTHSGroupService'
import { standingFor, STANDING_LABELS } from '@/services/NTHSImpactService'

const props = defineProps<{ impact: NTHSChapterImpactPublic }>()

const standing = computed(() => standingFor(props.impact))
const label = computed(() => STANDING_LABELS[standing.value])
</script>

<template>
  <span class="standing-chip" :class="standing" data-testid="standing-chip">
    {{ label }}
  </span>
</template>

<style scoped lang="scss">
.standing-chip {
  @include nths-badge;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 11px;
}
.requirements-met,
.members-met {
  background: $selected-green;
  color: $c-nths-deep-teal;
}
.in-progress {
  background: $c-nths-warm-bg;
  color: $c-nths-warm-fg;
}
</style>
