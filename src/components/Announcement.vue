<script lang="ts" setup>
import { ref } from 'vue'
import AnalyticsService from '@/services/AnalyticsService'

const props = defineProps({
  localStorageKey: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  body: {
    type: String,
    default: '',
  },
  position: {
    default: {
      top: 'initial',
      bottom: 'initial',
      right: 'initial',
      left: 'initial',
    },
  },
  showEvent: {
    type: String,
    default: '',
  },
  closeEvent: {
    type: String,
    default: '',
  },
})

const showAnnouncement = ref(
  JSON.parse(localStorage.getItem(props.localStorageKey) ?? 'true')
)
if (showAnnouncement.value === true && props.showEvent) {
  AnalyticsService.captureEvent(props.showEvent)
}
function close() {
  if (props.closeEvent) {
    AnalyticsService.captureEvent(props.closeEvent)
  }
  showAnnouncement.value = false
  localStorage.setItem(props.localStorageKey, JSON.stringify(false))
}
</script>

<template>
  <div
    v-if="showAnnouncement"
    class="announcement"
    :style="{
      top: position.top,
      bottom: position.bottom,
      left: position.left,
      right: position.right,
    }"
  >
    <div class="header">
      <div class="top">
        <span class="beta">New Beta Feature</span>
        <button type="button" class="close" @click="close">+</button>
      </div>
      <span class="title"> {{ title }} ⭐ </span>
    </div>
    <div class="body">
      {{ body }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.announcement {
  background-color: white;
  box-shadow:
    3px 3px 3px $c-shadow-header,
    3px -3px 3px $c-shadow-header,
    -3px -3px 3px $c-shadow-header,
    -3px 3px 3px $c-shadow-header;
  position: absolute;
  z-index: 9;
  padding: 8px;
  border-radius: 12px;
  width: 240px;

  @include breakpoint-below('medium') {
    bottom: 90px;
  }
}

.header {
  padding: 4px;
  border-bottom: 1px solid lightgray;
}

.main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.beta {
  font-size: 14px;
  color: lightslategray;
}

.title {
  font-size: 16px;
  font-weight: 500;
}

.close {
  font-size: 30px;
  font-weight: 300;
  transform: rotate(45deg);
  color: black;
}

.body {
  font-size: 14px;
  padding: 4px;
  font-weight: 500;
  white-space: pre-line;
}
</style>
