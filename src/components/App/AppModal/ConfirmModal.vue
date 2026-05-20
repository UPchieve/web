<script lang="ts">
export default {
  name: 'ConfirmModal',
}
</script>

<script lang="ts" setup>
import { useStore } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'

type ConfirmModalData = {
  title: string
  message: string
  backText?: string
  acceptText: string
  acceptButtonVariant?: string
  heroImageUrl?: string
  onConfirm?: () => void
  onCancel?: () => void
}

type Props = {
  modalData: ConfirmModalData
}

const props = defineProps<Props>()
const $store = useStore()

function onConfirm() {
  $store.dispatch('app/modal/hide')
  props.modalData.onConfirm?.()
}

function onCancel() {
  $store.dispatch('app/modal/hide')
  props.modalData.onCancel?.()
}

defineExpose({
  onConfirm,
  onCancel,
})
</script>

<template>
  <div class="uc-column text-start">
    <h1 class="title">{{ modalData.title }}</h1>
    <img
      v-if="props.modalData.heroImageUrl"
      :src="props.modalData.heroImageUrl"
      class="hero-image"
    />
    <p class="message">{{ modalData.message }}</p>

    <div class="uc-row uc-column-sm justify-end gap-sm">
      <large-button
        v-if="props.modalData.backText"
        :showArrow="false"
        @click="onCancel"
      >
        {{ props.modalData.backText }}
      </large-button>
      <large-button
        v-if="!!props.modalData.onConfirm"
        :variant="props.modalData.acceptButtonVariant ?? 'primary-blue'"
        :showArrow="false"
        @click="onConfirm"
      >
        {{ props.modalData.acceptText }}
      </large-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title {
  @include font-category('display-small');
}

.message {
  @include font-category('body');
  padding: 1em 0;
}

.hero-image {
  object-fit: cover;
  border: 3px solid black;
  max-height: 300px;
}
</style>
