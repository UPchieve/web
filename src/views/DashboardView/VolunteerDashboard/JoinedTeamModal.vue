<script lang="ts" setup>
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import Modal from '@/components/Modal.vue'
import Certdog from '@/assets/certdog.svg'

const props = defineProps({
  teamName: {
    type: String,
    required: true,
  },
  teamCode: {
    type: String,
    required: true,
  },
})
const emit = defineEmits(['closeModal'])

AnalyticsService.captureEvent(EVENTS.VOLUNTEER_SHOWN_JOINED_TEAM_MODAL, {
  classCode: props.teamCode,
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
      <h2>You've joined team {{ props.teamName }}</h2>
      <p>
        You can view your team dashboard by clicking "My Team" on the sidebar
      </p>
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
