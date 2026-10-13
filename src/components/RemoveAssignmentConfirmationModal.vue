<script lang="ts" setup>
import { useAppModalStore } from '@/stores/app/modal'

const modalStore = useAppModalStore()

const props = defineProps({
  modalData: {
    type: Object,
    required: true,
  },
})

function close() {
  modalStore.hide()
}

function accept() {
  props.modalData.deleteAssignment(props.modalData.assignmentId)
  modalStore.hide()
}
</script>

<template>
  <div class="modal-container">
    <h1>Delete Assignment?</h1>
    <p>
      Are you sure you want to delete this assignment? This action cannot be
      undone.
    </p>
    <div class="buttons">
      <button type="button" class="uc-form-button cancel-button" @click="close">
        Cancel
      </button>
      <button type="button" class="uc-form-button" @click="accept">
        Delete Assignment
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.modal-container {
  text-align: left;

  h1 {
    font-size: 18px;
  }
}

.buttons {
  @include flex-container(row, right, flex-end);
  gap: 12px;

  button {
    width: auto;
    padding: 20px;
  }
}

.cancel-button {
  border: 1px solid #000000;
  background-color: white;
  color: #000;
}
</style>
