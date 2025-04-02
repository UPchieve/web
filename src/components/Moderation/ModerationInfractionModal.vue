<template>
  <Modal class="moderation-infraction-info-modal upc-modal">
    <h3>
      We detected a potential policy violation with your
      {{ moderationInfractionSource }} use
    </h3>
    <br />
    <div class="infraction-modal-body">
      {{ detailedMessage }}&nbsp;Don't worry, we'll manually review to confirm
      if this was a mistake. If you need support, send us a message or email us
      at support@upchieve.org. Thanks for your patience!
      <LargeButton @click="emit('close')" :show-arrow="false" variant="primary"
        >Close</LargeButton
      >
    </div>
  </Modal>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import Modal from '@/components/Modal.vue'
import LargeButton from '@/components/LargeButton.vue'
import { useStore } from 'vuex'

const props = defineProps<{
  moderationInfraction: {
    isBanned: boolean
    infraction: string[]
    source: string
  }
}>()

const detailedMessage = computed(() =>
  props.moderationInfraction?.isBanned
    ? "For everyone's safety, your screenshare and microphone have been disabled."
    : ''
)

const store = useStore()
const emit = defineEmits(['close'])

const moderationInfractionSource = computed(
  () => store.getters['liveMedia/moderationInfractionSource']
)
</script>

<style lang="scss" scoped>
.moderation-infraction-info-modal {
  display: flex;
  flex-direction: column;
  justify-content: center;

  .infraction-modal-body {
    display: flex;
    flex-direction: column;
    gap: 36px;
    margin-top: 0;
  }
}
</style>
