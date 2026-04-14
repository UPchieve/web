<template>
  <modal :closeModal="close">
    <h1>Student Completion</h1>
    <div
      class="student-completion-container"
      v-for="student in studentAssignmentCompletion"
      v-bind:key="student.first_name + student.last_name"
    >
      <div class="student-row">
        <span v-if="student.submitted_at" class="check-mark"
          ><Check
            class="check"
            :data-testid="
              student.first_name + student.last_name + '-checkmark'
            " /></span
        ><span v-else class="check-mark"></span
        ><span
          :data-testid="'student-' + student.first_name + student.last_name"
          >{{ student.first_name }} {{ student.last_name }}
          {{
            student.submitted_at
              ? `submitted on  ${formatTimestamp(student.submitted_at)}`
              : 'not submitted'
          }}</span
        >
      </div>
    </div>
  </modal>
</template>

<script>
import Modal from '@/components/Modal.vue'
import Check from '@/assets/check.svg'
import { dayjs } from '@/utils/time-utils'

export default {
  components: { Modal, Check },
  name: 'StudentCompletionModal',

  props: {
    modalData: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      studentAssignmentCompletion: [],
    }
  },

  async created() {
    this.studentAssignmentCompletion = this.modalData.studentCompletion
  },

  methods: {
    formatTimestamp(timestamp) {
      const date = dayjs(timestamp)
      return date.format('MM/DD/YYYY')
    },

    close() {
      this.$store.dispatch('app/modal/hide')
    },
  },
}
</script>

<style lang="scss" scoped>
h1 {
  font-size: 20px;
  text-align: start;
}

.student-completion-container {
  @include flex-container(column, flex-start, flex-start);
}

.check-mark {
  display: table-cell;
  padding-right: 8px;
  width: 40px;
  text-align: center;
  height: 20px;
}

.student-row {
  @include flex-container(row, flex-start);
  word-wrap: break-word;
  overflow-wrap: break-word;
}
</style>
