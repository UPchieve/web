<script lang="ts" setup>
import Modal from '@/components/Modal.vue'
import ShareInfoFieldsForm from '@/components/ShareInfoFieldsForm.vue'

const props = defineProps<{
  closeModal: () => void
  volunteerOccupations?: string[]
  numSessionsTutored: number
  numStudentsTutored: number
  totalHoursTutored: number
}>()
</script>

<template>
  <modal :closeModal="props.closeModal">
    <div class="content">
      <h1>Help your students get to know you better!</h1>
      <p>
        Here's what your students will see. Uncheck anything you'd rather keep
        private. You can change this anytime from your profile.
      </p>
    </div>
    <ShareInfoFieldsForm
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
