<template>
  <modal :closeModal="close" class="create-assignment-wrapper">
    <div class="modal-container">
      <h1>Create a Tutoring Assignment</h1>
      <FormInput
        label="Title"
        v-model="assignmentName"
        placeholder="Untitled Assignment"
        class="assignment-name"
      />
      <div class="assignment-details">
        <div class="assignment-details-row">
          <FormDateInput
            label="Start Date"
            class="date-input assignment-name"
            v-model="startDate"
            :placeholder="startDate"
          />
          <FormDateInput
            label="Due Date"
            class="date-input assignment-name"
            v-model="dueDate"
            :placeholder="dueDate"
          />
        </div>
        <div class="assignment-details-row">
          <FormSelect
            label="Assign to class(es)"
            class="classes-dropdown assignment-name"
            :multiple="true"
            :name="'classes'"
            :getSelectOptions="() => classes"
            v-model="selectedClasses"
            :optionTextField="'name'"
          />
        </div>
        <div class="assignment-details-row">
          <FormSelect
            label="Subject"
            class="session-dropdown"
            :name="'session-to-complete'"
            :getSelectOptions="() => allSubjects"
            v-model="selectedSessionToComplete"
            :optionTextField="'displayName'"
          />
          <FormInput
            label="Number of sessions to complete"
            v-model="numSessions"
            type="number"
            placeholder="1"
            class="assignment-name"
          />
          <FormInput
            label="Minimum time per session"
            v-model="numMinutes"
            type="number"
            placeholder="10"
            class="assignment-name"
          />
        </div>
        <div class="uc-form-element w-full">
          <div class="uc-row justify-between">
            <label for="description-input">Description</label>
          </div>
          <textarea
            type="text"
            id="description"
            class="description-input"
            name="description"
            v-model="description"
          ></textarea>
        </div>
      </div>
      <div class="right-btns">
        <button class="uc-form-button cancel-button" @click="close()">
          Cancel
        </button>
        <button
          class="uc-form-button"
          @click="createAssignment()"
          :disabled="!isFormValid"
        >
          Assign
        </button>
      </div>
    </div>
  </modal>
</template>

<script>
import Modal from '@/components/Modal.vue'
import FormInput from '@/components/FormInput.vue'
import FormDateInput from '@/components/FormDateInput.vue'
import FormSelect from '@/components/FormSelect.vue'
import moment from 'moment'
import AnalyticsService from '@/services/AnalyticsService'
import { mapState } from 'vuex'
import { EVENTS } from '@/consts'

export default {
  components: { Modal, FormInput, FormDateInput, FormSelect },
  name: 'CreateAssignmentModal',

  props: {
    modalData: {
      type: Object,
      required: true,
    },
  },

  computed: {
    ...mapState({
      subjects: (state) => state.subjects.subjects,
    }),
    isFormValid() {
      return (
        this.assignmentName &&
        this.startDate &&
        this.dueDate &&
        this.selectedClasses.length &&
        Object.keys(this.selectedSessionToComplete).length &&
        this.numSessions &&
        this.numMinutes
      )
    },
  },

  data() {
    return {
      assignmentName: '',
      startDate: moment().format('YYYY-MM-DD'),
      dueDate: moment().add(7, 'days').format('YYYY-MM-DD'),
      classes: [],
      selectedClasses: [],
      allSubjects: [],
      selectedSessionToComplete: {},
      numSessions: 1,
      numMinutes: 10,
      description: null,
    }
  },

  async created() {
    this.allSubjects = this.getActiveSubjects(this.subjects)
    this.classes = this.modalData.classes
  },

  methods: {
    close() {
      this.$store.dispatch('app/modal/hide')
    },

    getActiveSubjects(allSubj) {
      const properties = ['id', 'name', 'displayName', 'topicId']

      return Object.values(allSubj)
        .filter((subject) => subject.active)
        .map((subject) => {
          const filteredSubject = {}
          properties.forEach((prop) => {
            filteredSubject[prop] = subject[prop]
          })
          return filteredSubject
        })
    },

    async createAssignment() {
      const assignmentData = {
        description: this.description,
        title: this.assignmentName,
        numberOfSessions: this.numSessions,
        minDurationInMinutes: this.numMinutes,
        dueDate: moment(this.dueDate).toDate(),
        startDate: moment(this.startDate).toDate(),
        isRequired: false,
        subjectId: this.selectedSessionToComplete.id,
      }
      const selectedClasses = this.selectedClasses
      this.modalData.onAssignmentCreated({ assignmentData, selectedClasses })
      AnalyticsService.captureEvent(EVENTS.ASSIGNMENT_CREATED, assignmentData)
      this.$store.dispatch('app/modal/hide')
    },
  },
}
</script>

<style lang="scss">
.create-assignment-wrapper .upc-modal-form {
  @include breakpoint-above('medium') {
    max-width: 1000px !important;
  }
}
</style>

<style lang="scss" scoped>
.modal-container h1 {
  text-align: left;
  font-size: 15px;
  color: $c-secondary-grey;
}

.assignment-details-row {
  @include flex-container(row, space-between);
  justify-content: left;
  gap: 12px;
}

.assignment-details-col {
  @include flex-container(column, left);
}

.assignment-name,
.session-dropdown {
  max-width: 33%;
}

/* TODO: create custom textarea input*/
.description-input {
  @include flex-container(column);
  border: 1px solid $c-border-grey;
  border-radius: 4px;
  box-shadow: none;
  box-sizing: border-box;
  height: 100px;
  padding: 11px 13px;
  width: 100%;
  &:focus {
    outline: 1px solid $c-information-blue;
  }

  &-invalid {
    outline: 1px solid $c-error-red;
  }
}

.right-btns {
  @include flex-container(row, right, flex-end);
  margin-top: 12px;
  gap: 15px;
}

.right-btns button {
  width: 200px;
  padding: 20px;
}

.cancel-button {
  border: 1px solid #000000;
  background-color: white;
  color: #000;
}
</style>
