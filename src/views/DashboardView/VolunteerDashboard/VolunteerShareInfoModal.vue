<script lang="ts" setup>
import { ref } from 'vue'
import Modal from '@/components/Modal.vue'
import ShareInfoFieldsForm from '@/components/ShareInfoFieldsForm.vue'
import LoggerService from '@/services/LoggerService'

const props = defineProps<{
  closeModal: () => void
  volunteerOccupations?: string[]
  numSessionsTutored: number
  numStudentsTutored: number
  totalHoursTutored: number
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
        private. You can change this anytime from your profile.
      </p>
    </div>
    <ShareInfoFieldsForm
      ref="shareInfoFormRef"
      :volunteerOccupations="volunteerOccupations"
      :numSessionsTutored="numSessionsTutored"
      :numStudentsTutored="numStudentsTutored"
      :totalHoursTutored="totalHoursTutored"
      @saved="props.closeModal"
    />
  </modal>
</template>

<style lang="scss" scoped>
h1 {
  font-size: 1.5rem;
  margin-top: 0;
}
</style>
