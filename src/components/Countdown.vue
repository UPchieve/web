<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    tickLengthMs: number
    totalTicks: number
    countDirection: 'up' | 'down'
  }>(),
  {
    tickLengthMs: 1000,
    countDirection: 'down',
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
    <VProgressCircular :modelValue="progress" color="green" />
    <span>
      <strong>{{ displayNumber }}</strong> seconds
    </span>
  </div>
</template>

<style scoped>
.countdown {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
</style>
