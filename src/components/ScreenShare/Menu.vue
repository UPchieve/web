<script lang="ts" setup>
import EndSessionButton from '@/components/EndSessionButton.vue'
import ReportSessionButton from '@/components/ReportSessionButton.vue'
import LargeButton from '@/components/LargeButton.vue'
import { onMounted, onUnmounted, ref } from 'vue'
import LogoutIcon from '@/assets/voice_message_icons/logout.svg'
import ReportIcon from '@/assets/voice_message_icons/report.svg'

const isOpen = ref(false)
function closeMenuHandler() {
  if (isOpen.value) {
    isOpen.value = false
  }
}
onMounted(() => {
  document.addEventListener('click', closeMenuHandler)
})
onUnmounted(() => {
  document.removeEventListener('click', closeMenuHandler)
})
</script>

<template>
  <div class="menu">
    <div v-if="isOpen" class="menu-open">
      <EndSessionButton
        class="end-button"
        :variant="'tertiary'"
        :icon="LogoutIcon"
        :end-text="'End session'"
      />
      <ReportSessionButton
        :variant="'tertiary'"
        class="report-button"
        :icon="ReportIcon"
      />
    </div>
    <LargeButton class="toggle" @click.stop="isOpen = !isOpen">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </LargeButton>
  </div>
</template>

<style scoped lang="scss">
.menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.menu-open {
  position: absolute;
  top: 40px;
  right: 16px;
  padding: 8px 0;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  border: 1px solid #e0e0e0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: start;
}

.toggle {
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  background-color: transparent;
  border: none;
}

.dot {
  border-radius: 50%;
  height: 5px;
  width: 5px;
  background: white;
  margin: 4px auto;
}

.report-button {
  background-color: transparent;
  border: none;
  white-space: nowrap;
  &:hover {
    background-color: transparent;
    text-decoration: underline;
  }
}
.end-button {
  background-color: transparent;
  border: none;
  white-space: nowrap;
  &:hover {
    text-decoration: underline;
  }
}
</style>
