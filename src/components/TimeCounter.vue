<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const TICK_LENGTH_MS = 1000

const props = defineProps<{
  /** When to count from. Defaults to when the component mounts. */
  startedAt?: Date | number
}>()

const mountedAt = Date.now()
const now = ref(mountedAt)

const startMs = computed(() =>
  !props.startedAt ? mountedAt : new Date(props.startedAt).getTime()
)

const elapsedSeconds = computed(() =>
  // never negative, e.g. if startedAt is slightly ahead of this device's clock
  Math.max(0, Math.floor((now.value - startMs.value) / 1000))
)

const pad = (value: number) => String(value).padStart(2, '0')

// MM:SS, or HH:MM:SS once it reaches an hour
const display = computed(() => {
  const total = elapsedSeconds.value
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const minutesAndSeconds = `${pad(minutes)}:${pad(seconds)}`
  return hours > 0 ? `${pad(hours)}:${minutesAndSeconds}` : minutesAndSeconds
})

let intervalId: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  intervalId = setInterval(() => {
    now.value = Date.now()
  }, TICK_LENGTH_MS)
})

onBeforeUnmount(() => {
  clearInterval(intervalId)
})
</script>

<template>
  <span class="time-counter" role="timer">{{ display }}</span>
</template>

<style lang="scss" scoped>
.time-counter {
  // equal-width digits, so the text doesn't shift as it ticks
  font-variant-numeric: tabular-nums;
}
</style>
