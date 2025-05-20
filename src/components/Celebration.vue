<script setup lang="ts">
import { vConfetti } from '@neoconfetti/vue'
import { useStore } from 'vuex'
import { computed } from 'vue'

const store = useStore()
// Add 100 to fall off the edge of the screen
const stageWidth = computed(() => store.state.app.windowWidth + 100)
const stageHeight = computed(() => store.state.app.windowHeight + 100)

const showConfetti = computed(
  () => store.state.celebrations.confettiCelebrations.length > 0
)
const confettiCelebrations = computed(
  () => store.state.celebrations.confettiCelebrations
)

const prefersReducedMotion = computed(() => {
  return store.state.app.prefersReducedMotion
})
</script>

<template>
  <Transition name="fade">
    <div v-if="showConfetti" class="confetti">
      <div v-if="prefersReducedMotion" class="reduced-motion-confetti">🎉</div>
      <div
        v-else
        v-for="celebration in confettiCelebrations"
        :key="celebration.id"
        v-confetti="{
          colors: [
            '#16d2aa',
            '#FF8c5f',
            '#F44747',
            '#1855d1',
            '#fed766',
            '#f7aef8',
            '#76e5fd',
          ],
          force: 0.9,
          duration: celebration.duration,
          stageWidth,
          stageHeight,
        }"
      ></div>
    </div>
  </Transition>
</template>

<style scoped>
.confetti {
  position: fixed;
  top: -50px;
  left: 0;
  height: 200vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  overflow: hidden;
  pointer-events: none;
  z-index: 1000;
}

.reduced-motion-confetti {
  margin-top: 1em;
  font-size: 100px;
}
</style>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
