<template>
  <modal class="create-assignment-wrapper">
    <div class="modal-container">
      <h1>{{ headingText }} Tutoring Assignment</h1>
      <FormInput
        label="Title"
        v-model="assignmentName"
        placeholder="Untitled Assignment"
        class="untitled"
      />
      <div class="assignment-details">
        <div class="assignment-details-row">
          <FormDateInput
            label="Start Date"
            class="date-input assignment-name"
            v-model="startDate"
            :placeholder="startDate"
            :minDate="new Date()"
          />
          <FormDateInput
            label="Due Date"
            class="date-input assignment-name"
            v-model="dueDate"
            :placeholder="dueDate"
            :minDate="minDueDate"
          />
        </div>
        <div class="assignment-details-row">
          <IonicSelect
            label="Assign to class(es)"
            name="classes"
            class="assignment-name"
            :options="classes"
            optionTextField="name"
            v-model="selectedClasses"
            :multiple="true"
            :disabled="isEdit"
            @ionChange="showClassStudents"
          />
          <IonicSelect
            label="Selected student(s)"
            name="students"
            class="assignment-name"
            :options="classStudents"
            optionTextField="firstName"
            :multiple="true"
            v-model="selectedStudents"
            :disabled="showStudentsInClassDisabled"
          />
        </div>
        <div class="assignment-details-row">
          <IonicSelect
            label="Subject"
            name="session-to-complete"
            class="session-dropdown"
            :options="allSubjects"
            :multiple="false"
            optionTextField="displayName"
            groupField="topicName"
            group="subjects"
            v-model="selectedSessionToComplete"
          />
          <FormInput
            label="Number of sessions to complete"
            v-model="numSessions"
            type="number"
            placeholder="1"
            class="assignment-name"
            :minValue="1"
          />
          <FormInput
            label="Minimum time per session"
            v-model="numMinutes"
            type="number"
            placeholder="10"
            class="assignment-name"
            :minValue="1"
          />
        </div>
        <div class="uc-form-element w-full">
          <div class="uc-row justify-between">
            <label for="description-input">Instructions</label>
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
          class="uc-form-button save-button"
          data-testid="create-assignment-btn"
          :disabled="!isFormValid"
          @click="createAssignment()"
        >
          {{ isEdit ? 'Save for this class' : 'Assign' }}
        </button>
      </div>
    </div>
  </modal>
</template>

<script>
import moment from 'moment'
import { mapGetters, mapState } from 'vuex'
import { EVENTS } from '@/consts'
import FormInput from '@/components/FormInput.vue'
import FormDateInput from '@/components/FormDateInput.vue'
import IonicSelect from '@/components/IonicSelect.vue'
import Modal from '@/components/Modal.vue'
import AnalyticsService from '@/services/AnalyticsService'

export default {
  components: { Modal, FormInput, FormDateInput, IonicSelect },
  name: 'CreateAndEditAssignmentModal',

  props: {
    modalData: {
      type: Object,
      required: true,
    },
  },

  computed: {
    ...mapGetters({
      subjectRequestRollout: 'featureFlags/subjectRequestRollout',
    }),
    ...mapState({
      subjects: (state) => state.subjects.subjects,
    }),
    isFormValid() {
      return (
        this.assignmentName &&
        this.startDate &&
        this.dueDate &&
        this.selectedClasses.length >= 1 &&
        Object.keys(this.selectedSessionToComplete).length &&
        this.numSessions &&
        this.numMinutes
      )
    },
    showStudentsInClassDisabled() {
      return this.selectedClasses.length !== 1
    },
    minDueDate() {
      return moment(this.startDate).add(1, 'day').endOf('day').toDate()
    },
  },

  data() {
    return {
      assignmentName: '',
      startDate: moment().format('YYYY-MM-DD'),
      dueDate: moment().add(7, 'days').endOf('day').format('YYYY-MM-DD'),
      classes: [],
      selectedClasses: [],
      allSubjects: [],
      selectedSessionToComplete: {},
      numSessions: 1,
      numMinutes: 10,
      description: null,
      classStudents: [],
      selectedStudents: [],
      headingText: 'Create a',
      isEdit: false,
      assignmentId: '',
      removedStudents: [],
    }
  },

  async created() {
    this.allSubjects = this.getActiveSubjects(this.subjects)

    if (this.modalData.assignment) {
      this.isEdit = true
      this.headingText = 'Edit'

      const { assignment } = this.modalData

      this.assignmentId = assignment.id
      this.assignmentName = assignment.title
      this.startDate = moment(assignment.startDate).format('YYYY-MM-DD')
      this.dueDate = moment(assignment.dueDate).format('YYYY-MM-DD')
      this.numSessions = assignment.numberOfSessions
      this.numMinutes = assignment.minDurationInMinutes
      this.description = assignment.description || ''

      const assignmentSubject = Object.values(this.subjects).find(
        (subject) => subject.id === assignment.subjectId
      )

      if (assignmentSubject) {
        const filteredSubjects =
          this.allSubjects.find(
            (subj) => subj.topicId === assignmentSubject.topicId
          )?.subjects || []

        this.selectedSessionToComplete = filteredSubjects.filter(
          (subj) => subj.id === assignment.subjectId
        )[0]
      }
    }

    this.classes = this.modalData.classes
    this.selectedClasses = this.classes.filter(
      (cls) => cls.id === this.modalData.currentClass.id
    )
    this.showClassStudents()
  },

  methods: {
    close() {
      this.$store.dispatch('app/modal/hide')
    },

    getActiveSubjects(allSubj) {
      const properties = ['id', 'name', 'displayName', 'topicId', 'topicName']
      const currentTopicId = this.modalData.currentClass.topicId
      const topicList = this.modalData.topics

      const filteredSubjects = Object.values(allSubj)
        .filter(
          (subject) =>
            subject.active || this.subjectRequestRollout.includes(subject.name)
        )
        .map((subject) => {
          const filteredSubject = {}
          properties.forEach((prop) => {
            filteredSubject[prop] = subject[prop]
          })
          return filteredSubject
        })

      const topicsAndSubjects = {}
      topicList.forEach((topic) => {
        topicsAndSubjects[topic.name] = {
          topicId: topic.id,
          topicName: topic.displayName,
          subjects: filteredSubjects.filter(
            (subj) => subj.topicName === topic.name
          ),
        }
      })

      return Object.values(topicsAndSubjects).sort((a, b) =>
        a.topicId === currentTopicId ? -1 : b.topicId === currentTopicId ? 1 : 0
      )
    },

    showClassStudents() {
      if (this.selectedClasses.length === 1) {
        this.classStudents = this.selectedClasses[0].students ?? []
        if (this.modalData.assignment) {
          const assignedStudents = this.modalData.assignment.studentIds

          this.selectedStudents = this.classStudents.filter((student) =>
            assignedStudents.includes(student.id)
          )
        } else {
          this.selectedStudents = this.selectedClasses[0].students ?? []
        }
      } else {
        this.classStudents = []
        this.selectedStudents = []
      }
    },

    async createAssignment() {
      let assignmentData = {
        description: this.description,
        title: this.assignmentName,
        numberOfSessions: this.numSessions,
        minDurationInMinutes: this.numMinutes,
        dueDate: moment(this.dueDate).toDate(),
        startDate: moment(this.startDate).toDate(),
        isRequired: false,
        subjectId: this.selectedSessionToComplete.id,
      }
      if (this.isEdit) {
        const currentStudentsAssigned = this.modalData.assignment.studentIds
        const selectedStudentIds = this.selectedStudents.map(
          (student) => student.id
        )
        const studentsToRemove = currentStudentsAssigned.filter(
          (id) => !selectedStudentIds.includes(id)
        )
        const studentsToAdd = selectedStudentIds.filter(
          (id) => !currentStudentsAssigned.includes(id)
        )

        assignmentData.id = this.assignmentId
        this.modalData.onAssignmentEdited({
          assignmentData,
          studentsToAdd,
          studentsToRemove,
          selectedStudents: selectedStudentIds,
        })
        this.$store.dispatch('app/modal/hide')
      } else {
        this.modalData.onAssignmentCreated({
          assignmentData,
          selectedClasses: this.selectedClasses,
          selectedStudents: this.selectedStudents,
        })
        AnalyticsService.captureEvent(EVENTS.ASSIGNMENT_CREATED, assignmentData)
        this.$store.dispatch('app/modal/hide')
      }
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
  font-size: 20px;
  color: $c-secondary-grey;
}

.assignment-details-row {
  @include flex-container(row, space-between);
  justify-content: left;
  gap: 12px;
  overflow: visible;
}

.assignment-details-col {
  @include flex-container(column, left);
}

.untitled {
  max-width: 67%;
  margin: 4px;
}

.assignment-name,
.session-dropdown {
  max-width: 33%;
  margin: 4px;
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
  margin: 4px;
}

.right-btns {
  @include flex-container(row, right, flex-end);
  margin-top: 12px;
  gap: 15px;
}

.right-btns button {
  min-width: 200px;
  padding: 20px;
}

.cancel-button {
  border: 1px solid #000000;
  background-color: white;
  color: #000;
}

.uc-form-button,
.save-button {
  width: auto;
}
</style>
