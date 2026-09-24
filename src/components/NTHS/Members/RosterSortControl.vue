<script setup lang="ts">
import {
  nextRosterSort,
  ROSTER_SORT_KEYS,
  ROSTER_SORT_TOGGLE_LABELS,
  rosterSortLabel,
  type RosterPeriod,
  type RosterSort,
  type RosterSortKey,
} from '@/services/NTHSRosterService'

const props = defineProps<{ modelValue: RosterSort; period: RosterPeriod }>()
const emit = defineEmits<{ (e: 'update:modelValue', sort: RosterSort): void }>()

function selectKey(event: Event) {
  const key = (event.target as HTMLSelectElement).value as RosterSortKey
  emit('update:modelValue', nextRosterSort(props.modelValue, key))
}
</script>

<template>
  <div class="sort" data-testid="roster-sort">
    <label class="sort-label" for="roster-sort-key">Sort by</label>
    <select
      id="roster-sort-key"
      class="sort-key"
      :value="modelValue.key"
      autocomplete="off"
      data-testid="roster-sort-key"
      @change="selectKey"
    >
      <option v-for="key in ROSTER_SORT_KEYS" :key="key" :value="key">
        {{ rosterSortLabel(key, period) }}
      </option>
    </select>
    <button
      type="button"
      class="sort-direction"
      :aria-label="ROSTER_SORT_TOGGLE_LABELS[modelValue.direction]"
      data-testid="roster-sort-direction"
      @click="
        $emit('update:modelValue', nextRosterSort(modelValue, modelValue.key))
      "
    >
      <span aria-hidden="true">{{
        modelValue.direction === 'asc' ? '↑' : '↓'
      }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.sort {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sort-label {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: $c-secondary-grey;
}
.sort-key,
.sort-direction {
  border-radius: 20px;
  padding: 7px 12px;
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
</style>
