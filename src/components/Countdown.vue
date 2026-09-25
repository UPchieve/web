<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    tickLengthMs: number
    totalTicks: number
    countDirection: 'up' | 'down'
    size: number
    width: number
  }>(),
  {
    tickLengthMs: 1000,
    countDirection: 'down',
    size: 50,
    width: 5,
  }
)
const emit = defineEmits(['end'])

const maxTicks = ref(0)
const intervalId = ref()
const ticks = ref<number>(props.countDirection === 'up' ? 0 : maxTicks.value)

const displayNumber = computed(() => {
  return props.countDirection === 'up'
    ? Math.floor(ticks.value)
    : Math.floor(Math.max(0, maxTicks.value - ticks.value))
})

const progress = computed(() => {
  const elapsed = Math.min(1, ticks.value / maxTicks.value)

  const val = props.countDirection === 'up' ? elapsed : 1 - elapsed
  return val * 100
})

function updateTicks() {
  if (ticks.value === maxTicks.value) return
  ticks.value = ticks.value + 1
  const complete = ticks.value >= props.totalTicks
  if (complete) {
    emit('end')
  }
}

const GREEN = '#16d2aa'
const ORANGE = '#ff8c5f'

onMounted(() => {
  maxTicks.value = props.totalTicks // props.totalTick might be reactive; save the initial value.
  intervalId.value = setInterval(updateTicks, props.tickLengthMs)
})

onBeforeUnmount(() => {
  clearInterval(intervalId.value)
})
</script>

<template>
  <div class="countdown">
    <VProgressCircular
      :size="props.size"
      :width="props.width"
      :modelValue="progress"
      :color="progress > 50 ? GREEN : ORANGE"
    >
      <template v-slot:default>
        <div class="countdown-label">
          <span
            :class="[
              'count-text',
              { green: progress > 50 },
              { orange: progress <= 50 },
            ]"
            >{{ displayNumber }}</span
          >
          <span class="seconds-text">seconds</span>
        </div>
      </template>
    </VProgressCircular>
  </div>
</template>

<style lang="scss" scoped>
.countdown {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.countdown-label {
  display: flex;
  flex-direction: column;

  .count-text {
    @include font-category('heading');
    font-weight: $font-weight-bold;
  }

  .seconds-text {
    z-index: 3;
    @include font-category('caption');
    color: $c-secondary-grey;
  }

  .orange {
    color: $c-warning-orange;
  }

  .green {
    color: $c-success-green;
  }
}
</style>
