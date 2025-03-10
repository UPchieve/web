<script lang="ts" setup>
import CrossIcon from '@/assets/cross.svg'
import Modal from '@/components/Modal.vue'
import StudentAssignmentView from '@/views/StudentAssignmentView.vue'
import type { Assignment } from '@/views/StudentClassesView.vue'
import { type PropType } from 'vue'
import AssignmentIcon from '@/assets/AssignmentIcon.svg'

const props = defineProps({
  assignment: { type: Object as PropType<Assignment>, required: true },
  closeModal: { type: Function, required: true },
  isStudent: { type: Boolean, required: true },
})
</script>

<template class="full-modal">
  <modal>
    <div class="assignment-title">
      <div class="uc-row justify-between title-close-icon">
        <div class="assignment-header">
          <assignment-icon />
          <h1>
            {{ props.isStudent ? `Your Assignment` : `Student's Assignment` }}
          </h1>
        </div>
        <cross-icon
          class="cross-icon"
          @click="closeModal"
          role="button"
          aria-label="Close"
        />
      </div>
      <div v-if="!props.isStudent" class="assignment-text">
        <p>
          This student has an assignment assigned by their teacher. View the
          details to guide your session effectively.
        </p>
      </div>
    </div>
    <div class="text-start">
      <p class="assignment-modal-text">
        {{ isStudent ? props.assignment.className : `Assignment` }}
      </p>
      <student-assignment-view
        :assignment-id="props.assignment.id"
        :assignment="props.assignment"
        :isStudent="props.isStudent"
      />
    </div>
  </modal>
</template>

<style lang="scss" scoped>
:deep(.upc-modal-form) {
  padding: 0;
  background-color: #f1f8fe;
}

:deep(.upc-modal-form--bottom-padding) {
  padding-top: 16px;
}

.cross-icon {
  height: 12px;
  width: 12px;

  &:hover {
    cursor: pointer;
  }
}

.assignment-title {
  background-color: #fff;
  padding: 24px;
}

.assignment-header {
  @include flex-container(row, center, center);
  gap: 12px;

  h1 {
    text-align: left;
    font-size: 24px;
    margin-bottom: 0;
  }
}

.assignment-text {
  text-align: left;
  padding-top: 8px;

  p {
    margin-bottom: 0;
  }
}

.assignment-modal-text {
  color: $c-default-grey;
  font-weight: 500;
}
.text-start {
  margin: 20px;
  background-color: #fff;
  padding: 16px;
  border-radius: 8px;
}
</style>
