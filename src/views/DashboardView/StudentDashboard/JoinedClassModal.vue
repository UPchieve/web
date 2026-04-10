<script lang="ts" setup>
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import Modal from '@/components/Modal.vue'
import Certdog from '@/assets/certdog.svg'

const props = defineProps({
  classCode: {
    type: String,
    required: true,
  },
})
const emit = defineEmits(['closeModal'])

AnalyticsService.captureEvent(EVENTS.STUDENT_SHOWN_JOINED_CLASS_MODAL, {
  classCode: props.classCode,
})

function closeModal() {
  emit('closeModal')
}
</script>

<template>
  <modal :close-modal="closeModal">
    <div class="content">
      <certdog class="img" />
      <h1>Woohoo!</h1>
      <h2>You've joined class {{ props.classCode }}</h2>
      <button type="button" class="uc-form-button" @click="closeModal">
        Great!
      </button>
    </div>
  </modal>
</template>

<style lang="scss" scoped>
.content {
  padding-bottom: 40px;
}

.img {
  height: auto;
  width: 100%;
}

h1 {
  font-size: 2rem;
  margin-top: 0;
}

h2 {
  font-size: 1.5rem;
}
</style>
