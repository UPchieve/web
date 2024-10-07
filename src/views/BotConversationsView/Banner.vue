<script lang="ts" setup>
import CrossIcon from '@/assets/cross.svg'

const { dismiss, message } = defineProps<{
  dismiss: () => void
  message: string
}>()
</script>

<template>
  <div class="banner">
    <div class="message">{{ message }}</div>
    <button class="close-button">
      <cross-icon class="cross-icon-svg" @click="dismiss" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.banner {
  color: white;
  padding: 12px 8px 12px 18px;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: $c-background-blue;
  width: 100%;
  color: $c-soft-black;
}
.message {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.close-button {
  transform: scale(0.5);
  stroke: $c-soft-black !important;
  stroke-width: 2px !important;
  flex-shrink: 1;
}
.close-button:hover {
  filter: brightness(0.9);
}
</style>
