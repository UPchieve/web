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
  display: inline-block;
  padding: 0 8px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  border: 1px solid;
  border-radius: 20px;
  white-space: nowrap;
  color: $c-soft-black;
}
.pending {
  background: rgba($c-volunteer, 0.4);
  border-color: $c-nths-gold;
}
.official {
  background: $selected-green;
  border-color: $c-success-green;
  color: $c-hover-green;
}
.official-good-standing {
  background: $c-success-green;
  border-color: $c-success-green;
}
</style>
