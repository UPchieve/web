<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const isLoading = computed(() => store.state.app.isLoading)
</script>

<template>
  <div
    :class="{
      'route-loader': true,
      loading: isLoading,
      hidden: !isLoading,
    }"
  >
    <div class="bar"></div>
  </div>
</template>

<style scoped lang="scss">
.route-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10000000;
  pointer-events: none;
  opacity: 0;
  transition:
    width 1350ms ease-in-out,
    opacity 350ms linear,
    left 50ms ease-in-out;
}

.bar {
  background-color: $c-success-green;
  height: 3px;
  width: 100%;
}

.hidden {
  opacity: 0;
}

.loading {
  opacity: 1;
  animation: loading 1000ms ease-in-out;
  animation-iteration-count: infinite;
}

@keyframes loading {
  0% {
    width: 0;
    left: 0;
  }
  50% {
    width: 100%;
    left: 0;
  }
  100% {
    width: 100%;
    left: 100%;
  }
}
</style>
