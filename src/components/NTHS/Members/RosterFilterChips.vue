<script setup lang="ts">
import {
  ROSTER_FILTERS,
  rosterFilterLabel,
  type RosterFilter,
  type RosterPeriod,
} from '@/services/NTHSRosterService'

defineProps<{
  modelValue: RosterFilter
  period: RosterPeriod
  counts: Record<RosterFilter, number>
}>()
defineEmits<{ (e: 'update:modelValue', filter: RosterFilter): void }>()
</script>

<template>
  <div class="chips" role="group" aria-labelledby="roster-filter-chips-label">
    <span id="roster-filter-chips-label" class="chips-label">Show</span>
    <button
      v-for="filter in ROSTER_FILTERS"
      :key="filter"
      type="button"
      class="chip"
      :class="{ active: filter === modelValue }"
      :aria-pressed="filter === modelValue"
      :data-testid="`roster-chip-${filter}`"
      v-ph:nthshq="`members.filter.${filter}`"
      @click="$emit('update:modelValue', filter)"
    >
      {{ rosterFilterLabel(filter, period) }} ({{ counts[filter] }})
    </button>
  </div>
</template>

<style scoped lang="scss">
.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.chips-label {
  font-size: 13px;
  font-weight: 500;
  color: $c-secondary-grey;
  margin-right: 4px;
}
.chip {
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  line-height: 1.2;
  background: $upchieve-white;
  border: 1px solid $c-border-grey;
  color: $c-soft-black;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid $c-information-blue;
    outline-offset: 2px;
  }
}
.chip.active {
  background: $c-nths-navy;
  border-color: $c-nths-navy;
  color: $upchieve-white;
  font-weight: 500;
}
</style>
