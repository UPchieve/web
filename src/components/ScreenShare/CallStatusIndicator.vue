<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const displayCallStatus = computed(() => {
  return store.state.liveMedia.audio.displayCallStatus
})
function clearDisplayCallStatusImmediately() {
  store.dispatch('liveMedia/audio/dismissDisplayCallStatus')
}
</script>

<template>
  <div class="call-status-indicator" v-if="displayCallStatus">
    <div class="main" v-if="displayCallStatus?.main?.length > 0">
      <div class="icon" v-if="displayCallStatus.icon">
        <component :is="displayCallStatus.icon" />
      </div>
      <div class="title">{{ displayCallStatus.main }}</div>
      <button
        type="button"
        class="close"
        @click="clearDisplayCallStatusImmediately"
      >
        +
      </button>
    </div>
    <div class="secondary" v-if="displayCallStatus?.secondary?.length > 0">
      {{ displayCallStatus.secondary }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.call-status-indicator {
  display: flex;
  flex-direction: column;
  padding: 6px 22px;
  background-color: $selected-green;
  line-height: 150%;
}
.main {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title {
  flex-grow: 1;
  font-size: 16px;
  font-weight: 600;
}
.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  filter: invert(1);
}

.close {
  transform: rotate(45deg);
  font-size: 26px;
  font-weight: 400;
}
.secondary {
  font-size: 14px;
  font-weight: 400;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
