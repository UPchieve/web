<script lang="ts" setup>
const C_SUCCESS_GREEN = '#16d2aa'
const {
  bgColor = C_SUCCESS_GREEN,
  initials,
  widthPx = 50,
} = defineProps<{
  initials: string
  widthPx?: number
  bgColor?: string
}>()
</script>

<template>
  <svg
    :width="widthPx"
    :height="widthPx"
    viewBox="0 0 100 100"
    role="img"
    aria-label="User avatar"
  >
    <circle cx="50" cy="50" r="50" :fill="bgColor" />
    <text
      x="50"
      y="50"
      text-anchor="middle"
      dominant-baseline="central"
      font-family="Inter, system-ui, sans-serif"
      font-weight="400"
      font-size="48"
      fill="white"
    >
      {{ initials }}
    </text>
  </svg>
</template>
