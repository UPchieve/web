<script lang="ts" setup>
import { ref } from 'vue'
import Modal from '@/components/Modal.vue'
import ShareInfoFieldsForm from '@/components/ShareInfoFieldsForm.vue'
import LoggerService from '@/services/LoggerService'
import type { ShareableVolunteerData } from '@/utils/build-share-info-message'

const props = defineProps<{
  closeModal: () => void
  info: ShareableVolunteerData
}>()

const shareInfoFormRef = ref<InstanceType<typeof ShareInfoFieldsForm>>()

async function handleDismiss() {
  try {
    await shareInfoFormRef.value?.optOut()
  } catch (err) {
    LoggerService.noticeError(err)
  }
  props.closeModal()
}
</script>

<template>
  <modal :closeModal="handleDismiss">
    <div class="content">
      <h1>Help your students get to know you better!</h1>
      <p>
        Here's what your students will see. Uncheck anything you'd rather keep
        private. You can change this anytime from
        <router-link :to="`/profile`">your profile</router-link>.
      </p>
    </div>
    <ShareInfoFieldsForm
      ref="shareInfoFormRef"
      :info="info"
      @saved="props.closeModal"
    />
  </modal>
</template>

<style lang="scss" scoped>
h1 {
  font-size: 1.5rem;
  margin-top: 0;
}

:deep(.upc-modal-form) {
  max-width: 800px;
}
</style>
