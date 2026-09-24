<script setup lang="ts">
import { computed } from 'vue'
import { meterPercent } from '@/services/NTHSImpactService'

const props = defineProps<{
  label: string
  value: number
  goal: number
  displayValue?: string
  variant: 'hours' | 'members'
  note?: string
  loading?: boolean
}>()

const shown = computed(() => props.displayValue ?? String(props.value))
const width = computed(() =>
  props.loading ? '0%' : `${meterPercent(props.value, props.goal)}%`
)
const valueNow = computed(() => Math.min(props.value, props.goal))
const valueText = computed(() => `${shown.value} of ${props.goal}`)
</script>

<template>
  <div class="meter">
    <div class="meter-row">
      <span class="meter-label">{{ label }}</span>
      <span class="meter-value" data-testid="meter-value">
        {{ shown }}
        <span v-if="!loading" class="meter-goal">of {{ goal }}</span>
      </span>
    </div>
    <div
      class="track"
      role="progressbar"
      :aria-label="label"
      :aria-valuenow="valueNow"
      :aria-valuemin="0"
      :aria-valuemax="goal"
      :aria-valuetext="valueText"
    >
      <div class="bar" :class="`bar--${variant}`" :style="{ width }" />
    </div>
    <p v-if="note" class="meter-note">{{ note }}</p>
  </div>
</template>

<style scoped lang="scss">
.meter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}
.meter-label {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.3;
}
.meter-value {
  margin-left: auto;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
}
.meter-goal {
  font-weight: 400;
  color: $c-secondary-grey;
}
.meter-note {
  font-size: 13px;
  line-height: 1.4;
  color: $c-secondary-grey;
  margin: 6px 0 0;
}
.track {
  margin-top: 8px;
  height: 8px;
  border-radius: 9999px;
  background: $c-nths-track;
  overflow: hidden;
}
.bar {
  height: 100%;
  border-radius: 9999px;
}
.bar--hours {
  background: $c-college;
}
.bar--members {
  background: $c-success-green;
}
</style>
