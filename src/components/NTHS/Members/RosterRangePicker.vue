<script setup lang="ts">
import { ref, watch } from 'vue'
import ChevronDownIcon from '@/assets/chevron-down.svg'
import DropdownMenu from '@/components/PresentationComponents/DropdownMenu.vue'
import {
  rangeLabel,
  ROSTER_PERIOD_LABELS,
  ROSTER_PERIODS,
  type RosterPeriod,
  type RosterRange,
} from '@/services/NTHSRosterService'
import { dayjs } from '@/utils/time-utils'

const props = defineProps<{
  range: RosterRange
  earliestDay: Date
  latestDay: Date
}>()
const emit = defineEmits<{
  pickPeriod: [period: RosterPeriod]
  pickDays: [firstDay: Date, lastDay: Date]
}>()

const isOpen = ref(false)
const days = ref<Date[]>([])

// The school year starts at 00:00 UTC, which is the evening before for
// viewers in the Americas; the calendar seeds the UTC date.
function firstDayShown() {
  const { firstDay, period } = props.range
  return period === 'thisSchoolYear'
    ? new Date(
        firstDay.getUTCFullYear(),
        firstDay.getUTCMonth(),
        firstDay.getUTCDate()
      )
    : firstDay
}

watch(isOpen, (open) => {
  if (open) {
    days.value = [firstDayShown(), props.range.lastDay]
  }
})

function pickPeriod(period: RosterPeriod) {
  isOpen.value = false
  emit('pickPeriod', period)
}

// One day clicked is a range of that day alone.
function pickDays() {
  const [first, last = first] = days.value
  isOpen.value = false
  emit(
    'pickDays',
    dayjs(first).startOf('day').toDate(),
    dayjs(last).startOf('day').toDate()
  )
}
</script>

<template>
  <DropdownMenu
    v-model:open="isOpen"
    :label="rangeLabel(range)"
    :button-aria-label="`Date range: ${rangeLabel(range)}`"
    menu-aria-label="Date range"
    location="bottom start"
    active
    test-id="roster-range"
  >
    <template #trailing-icon>
      <ChevronDownIcon class="caret" aria-hidden="true" />
    </template>

    <div class="picks" role="group" aria-label="Quick picks">
      <button
        v-for="period in ROSTER_PERIODS"
        :key="period"
        type="button"
        class="pick"
        :class="{ on: range.period === period }"
        :aria-pressed="range.period === period"
        :data-testid="`roster-range-${period}`"
        v-ph:nthshq="`members.range.${period}`"
        @click="pickPeriod(period)"
      >
        {{ ROSTER_PERIOD_LABELS[period] }}
      </button>
    </div>
    <v-date-picker
      v-model="days"
      multiple="range"
      :min="earliestDay"
      :max="latestDay"
      hide-header
      data-testid="roster-range-calendar"
    />
    <div class="foot">
      <button
        type="button"
        class="done"
        :disabled="!days.length"
        data-testid="roster-range-done"
        v-ph:nthshq="'members.range.done'"
        @click="pickDays"
      >
        Done
      </button>
    </div>
  </DropdownMenu>
</template>

<style scoped lang="scss">
.caret {
  width: 14px;
  height: 14px;
}
.picks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 328px;
  padding: 8px 0;
}
.pick {
  min-height: 32px;
  padding: 4px 12px;
  border: 1px solid $c-border-grey;
  border-radius: 20px;
  background: $upchieve-white;
  color: $c-soft-black;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    border-color: $c-soft-black;
  }
  &:focus-visible {
    outline: 2px solid $c-information-blue;
    outline-offset: 2px;
  }
}
.pick.on {
  background: $c-soft-black;
  border-color: $c-soft-black;
  color: $upchieve-white;
}
.foot {
  display: flex;
  justify-content: flex-end;
  padding: 4px 0 8px;
}
.done {
  min-height: 36px;
  padding: 4px 20px;
  border: 1px solid $c-information-blue;
  border-radius: 20px;
  background: $upchieve-white;
  color: $c-information-blue;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
  &:focus-visible {
    outline: 2px solid $c-information-blue;
    outline-offset: 2px;
  }
}
</style>
