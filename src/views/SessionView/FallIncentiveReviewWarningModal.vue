<template>
  <modal :closeModal="closeModal" class="review-warning-modal-wrapper">
    <div class="review-warning-modal">
      <div class="header-info">
        <cross-icon v-if="!mobileMode" class="cross-icon" @click="closeModal" />
        <div class="header">Have a productive session!</div>
        <div class="subtitle">
          We'll be reviewing this session to ensure that you have a great
          learning experience & qualify to earn and learn this week!
        </div>
      </div>
    </div>
  </modal>
</template>

<script setup lang="ts">
import { useStore } from 'vuex'
import Modal from '@/components/Modal.vue'
import CrossIcon from '@/assets/cross.svg'
import { computed } from 'vue'

const store = useStore()
const mobileMode = computed(() => store.getters['app/mobileMode'])

const { closeModal } = defineProps<{
  closeModal: () => void
}>()
</script>

<style lang="scss" scoped>
.review-warning-modal {
  text-align: left;
}

.header {
  font-size: 24px;
  font-weight: bold;
}

.subheading {
  font-size: 18px;
  font-weight: 600;
}

.subtitle {
  font-weight: 400;
  margin-top: 0.8em;
}

.cross-icon {
  height: 10px;
  width: 10px;
  margin-left: 100%;
  vertical-align: top;

  &:hover {
    cursor: pointer;
  }
}
</style>
