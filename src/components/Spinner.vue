<script lang="ts" setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  containerWidth: {
    type: Number,
    default: 80,
  },
  containerHeight: {
    type: Number,
    default: 80,
  },
  thickness: {
    type: Number,
    default: 8,
  },
  width: {
    type: Number,
    default: 64,
  },
  height: {
    type: Number,
    default: 64,
  },
})

const loaderStyle = computed(() => {
  return {
    height: `${props.height}px`,
    width: `${props.width}px`,
    'border-width': `${props.thickness}px`,
  }
})
const containerStyle = computed(() => {
  return {
    height: `${props.containerHeight}px`,
    width: `${props.containerWidth}px`,
  }
})
</script>
<template>
  <div class="loader" :style="containerStyle">
    <div :style="loaderStyle"></div>
    <div :style="loaderStyle"></div>
    <div :style="loaderStyle"></div>
    <div :style="loaderStyle"></div>
  </div>
</template>

<style lang="scss" scoped>
.loader {
  display: inline-flex;
  position: relative;
  justify-content: center;
  align-items: center;
  opacity: 1;

  & div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    border-style: solid;
    border-color: $upchieve-green;
    border-radius: 50%;
    animation: ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: $upchieve-green transparent transparent transparent;
  }

  & div:nth-child(1) {
    animation-delay: -0.45s;
  }

  & div:nth-child(2) {
    animation-delay: -0.3s;
  }

  & div:nth-child(3) {
    animation-delay: -0.15s;
  }
}

@keyframes ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
