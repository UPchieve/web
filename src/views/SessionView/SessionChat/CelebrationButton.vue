<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { vTooltip } from 'maz-ui'

const emit = defineEmits(['click'])
const show = ref(false)
const celebrateButtonWiggle = ref(true)

onMounted(() => {
  // animate in
  show.value = true
  setTimeout(() => {
    celebrateButtonWiggle.value = false
  }, 3000)
})
</script>

<template>
  <transition name="celebrate-button">
    <div
      v-if="show"
      class="celebrate-button-container"
      v-tooltip="{
        text: 'Send confetti',
        color: 'black',
        position: 'top',
        open: true,
      }"
    >
      <button
        type="button"
        class="celebrate-button"
        :class="{ wiggle: celebrateButtonWiggle }"
        @click="emit('click')"
      >
        🎉
      </button>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.celebrate-button-container {
  /* extra styling for v-tooltip */
  &:before {
    border-radius: 3px;
    font-size: 14px;
    font-weight: 500;
    padding-left: 8px;
    padding-right: 8px;
    left: -1em;
    color: #fff;
    transition-property: all;
    transition-duration: 200ms;
    opacity: 0;
  }
  &:hover:before {
    opacity: 1;
  }
}
.celebrate-button {
  font-size: 1.25em;
  margin-bottom: 0;
  transition: all 100ms ease-in;
}

.celebrate-button:hover {
  left: 0;
  bottom: 0;
  animation: wiggle 0.5s ease-in-out;
  animation-iteration-count: 3;
}
.celebrate-button.wiggle {
  animation: wiggle 0.5s infinite ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .celebrate-button:hover,
  .celebrate-button.wiggle {
    animation: none;
  }
}

.celebrate-button-enter-active {
  transition: all 400ms ease-in;
}
.celebrate-button-enter-from,
.celebrate-button-leave-to {
  transform: scale(0.75);
  opacity: 0;
}
</style>

<style>
@keyframes wiggle {
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(0deg);
  }
  70% {
    transform: rotate(10deg);
  }
  80% {
    transform: rotate(-10deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
</style>
