<script setup lang="ts">
import Modal from '@/components/Modal.vue'
import LargeButton from '@/components/LargeButton.vue'
import CrossIcon from '@/assets/cross.svg'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  closeModal: () => void
  nextTask: {
    title: string
    actionTime: string
    action: () => void
    actionText: string
  }
}>()

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.NEXT_TASK_MODAL_OPEN, {
    title: props.nextTask.title,
  })
})
onUnmounted(() => {
  AnalyticsService.captureEvent(EVENTS.NEXT_TASK_MODAL_ClOSED, {
    title: props.nextTask.title,
  })
})
</script>

<template>
  <modal :closeModal="props.closeModal">
    <div class="modal">
      <header>
        <h1 class="title">{{ nextTask.title }}</h1>
        <cross-icon
          class="upc-modal-close-icon"
          @click="closeModal"
          data-testid="close-modal-btn"
        />
      </header>
      <div class="content">
        <p>
          You’re almost ready to help students! Complete your
          <span class="callout">New Volunteer Checklist</span> to get started.
        </p>
        <p v-html="nextTask.actionTime"></p>
      </div>
      <large-button
        class="action-text"
        variant="primary-blue"
        @click="nextTask.action"
      >
        {{ nextTask.actionText }}
      </large-button>
    </div>
  </modal>
</template>

<style lang="scss" scoped>
header {
  @include flex-container(row, space-between, center);
}

.modal {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.title {
  @include font-category('display-small');
  @include child-spacing(bottom, 18px);
  text-align: left;
}

.callout {
  font-weight: 600;
}
.action-text {
  align-self: end;
}
</style>
