<script lang="ts" setup>
import UpdogInvestigating from '@/assets/updog-investigate.svg'
import LargeButton from '@/components/LargeButton.vue'
import { useStore } from 'vuex'
import { computed } from 'vue'
import Modal from '@/components/Modal.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'accept'): void
}>()

const store = useStore()
const mobileMode = computed(() => store.getters['app/mobileMode'])
const isMobileLandscape = computed(() => store.getters['app/isMobileLandscape'])
</script>

<template>
  <Modal class="modal-container" :isOpen="props.isOpen">
    <UpdogInvestigating v-if="!isMobileLandscape" class="updog-illustration" />
    <div class="message">
      Before you screenshare, remember that
      <strong
        >UPchieve monitors sessions for the safety of all participants.</strong
      >
      <br /><br />
      When screensharing, all of our usual platform policies apply. Remember to
      also refrain from screensharing
      <strong>potentially sensitive personal information</strong>, like phone
      numbers and email addresses.
    </div>
    <div class="buttons-container" :class="{ mobile: mobileMode }">
      <LargeButton
        class="modal-button"
        variant="secondary"
        @click="emit('cancel')"
        >Go back</LargeButton
      >
      <LargeButton
        class="modal-button"
        variant="primary"
        :showArrow="false"
        @click="emit('accept')"
        >I accept</LargeButton
      >
    </div>
  </Modal>
</template>

<style lang="scss" scoped>
.modal-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5%;
  gap: 8px;
}

.message {
  padding-top: 8px;
  padding-bottom: 8px;
}

.buttons-container {
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: center;
  gap: 8px;

  &.mobile {
    flex-direction: column;
  }
}

.modal-button {
  width: 100%;
}

.updog-illustration {
  width: 50%;
  height: fit-content;
  align-self: center;
}
</style>
