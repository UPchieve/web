<script lang="ts" setup>
import CrossIcon from '@/assets/cross.svg'
import Modal from '@/components/Modal.vue'
import StudentAssignmentView from '@/views/StudentAssignmentView.vue'
import type { Assignment } from '@/views/StudentClassesView.vue'
import { type PropType } from 'vue'

const props = defineProps({
  assignment: { type: Object as PropType<Assignment>, required: true },
  closeModal: { type: Function, required: true },
})
</script>

<template>
  <modal>
    <div class="uc-row justify-end">
      <cross-icon
        class="cross-icon"
        @click="closeModal"
        role="button"
        aria-label="Close"
      />
    </div>
    <div class="text-start">
      <student-assignment-view
        :assignment-id="props.assignment.id"
        :assignment="props.assignment"
      />
    </div>
  </modal>
</template>

<style lang="scss">
.cross-icon {
  height: 20px;
  width: 20px;

  &:hover {
    cursor: pointer;
  }
}
</style>
