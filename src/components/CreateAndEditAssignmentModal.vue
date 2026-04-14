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
            :minDate="new Date(minDueDate)"
          />
        </div>
        <div class="assignment-details-row">
          <FormSelect
            label="Assign to class(es)"
            name="classes"
            class="assignment-name"
            :options="classes"
            optionTextField="name"
            v-model="selectedClasses"
            :multiple="true"
            :disabled="isEdit"
          />
          <FormSelect
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
          <FormSelect
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
        <div class="uc-form-element">
          <div class="upload-files">
            <label for="upload-pdf">Upload Assignment Documents</label>
            <div class="file-dialog">
              <div
                title="Upload photo"
                tabindex="0"
                @click="openFileDialog"
                @keydown.enter="openFileDialog"
              >
                <FileDialog
                  ref="fileDialog"
                  class="upload-photo"
                  accept="image/*, application/pdf"
                  @file-selected="uploadDocument"
                  @file-too-large="handleFileTooLarge"
                  :multiple="true"
                  :maxFileSizeBytes="MAX_UPLOAD_SIZE_BYTES"
                />

                <div class="upload-button">
                  <span class="upload-text">Click to upload</span
                  ><PhotoUploadIcon class="toolbar-icon--photo" />
                </div>
              </div>
              <div class="uploaded-files" v-if="files.length > 0">
                <div
                  v-for="(file, index) in files"
                  :key="index"
                  class="file-item"
                >
                  <span class="file-name">{{ file.name }}</span>
                  <button
                    type="button"
                    class="delete-file"
                    @click="deleteFile(index)"
                    title="Remove file"
                  >
                    x
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="uc-form-element w-full">
            <div class="uc-row justify-between">
              <label for="description-input">Instructions</label>
            </div>
            <textarea
              type="text"
              id="description"
              autocomplete="off"
              class="description-input"
              name="description"
              v-model="description"
            ></textarea>
          </div>
        </div>
      </div>
      <div class="right-btns">
        <button
          type="button"
          class="uc-form-button cancel-button"
          @click="close()"
        >
          Cancel
        </button>
        <button
          type="button"
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
import { dayjs } from '@/utils/time-utils'
import { mapGetters, mapState } from 'vuex'
import { EVENTS } from '@/consts'
import FormInput from '@/components/FormInput.vue'
import FormDateInput from './FormInputs/FormDateInput.vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import Modal from '@/components/Modal.vue'
import FileDialog from '@/components/FileDialog.vue'
import PhotoUploadIcon from '@/assets/whiteboard_icons/photo-upload.svg'
import AnalyticsService from '@/services/AnalyticsService'
import ModalService from '@/services/ModalService'
import { BYTES_PER_MEGABYTE, formatBytes } from '@/utils/bytes'

export default {
  components: {
    Modal,
    FormInput,
    FormDateInput,
    FormSelect,
    FileDialog,
    PhotoUploadIcon,
  },
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
      return dayjs(this.startDate).add(1, 'day').endOf('day').toDate()
    },
    MAX_UPLOAD_SIZE_BYTES() {
      return BYTES_PER_MEGABYTE * 5
    },
  },

  data() {
    return {
      assignmentName: '',
      startDate: dayjs().format('YYYY-MM-DD'),
      dueDate: dayjs().add(7, 'days').endOf('day').format('YYYY-MM-DD'),
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
      files: [],
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
      this.startDate = dayjs(assignment.startDate).format('YYYY-MM-DD')
      this.dueDate = dayjs(assignment.dueDate).format('YYYY-MM-DD')
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

    openFileDialog(event) {
      this.$refs.fileDialog.openFileDialog(event)
    },

    async uploadDocument(eventData) {
      const files = eventData.files
      files.forEach((file) => {
        this.files.push(file)
      })
    },

    deleteFile(index) {
      this.files.splice(index, 1)
    },

    handleFileTooLarge(files) {
      const fileNames = files.map((file) => file.name).join(', ')
      const maxLabel = formatBytes(this.MAX_UPLOAD_SIZE_BYTES)
      void ModalService.showAlert(
        'File Too Large',
        `${fileNames} ${files.length > 1 ? 'are' : 'is'} too large! Max size allowed is ${maxLabel}. Please try again.`
      )
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
      const assignmentData = {
        description: this.description,
        title: this.assignmentName,
        numberOfSessions: this.numSessions,
        minDurationInMinutes: this.numMinutes,
        dueDate: dayjs(this.dueDate).endOf('day').toDate(),
        startDate: dayjs(this.startDate).startOf('day').toDate(),
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
          files: this.files,
        })
        this.$store.dispatch('app/modal/hide')
      } else {
        this.modalData.onAssignmentCreated({
          assignmentData,
          selectedClasses: this.selectedClasses,
          selectedStudents: this.selectedStudents,
          files: this.files,
        })
        AnalyticsService.captureEvent(EVENTS.ASSIGNMENT_CREATED, assignmentData)
        this.$store.dispatch('app/modal/hide')
        if (!this.$route.path.includes('assignments')) {
          this.$router.push(
            `/dashboard/teacher/class/${this.modalData.currentClass.id}/assignments`
          )
        }
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

.upload-files {
  @include flex-container(column, center, flex-start);
  width: 100%;

  .file-dialog {
    @include flex-container(row, flex-start, center);
    width: 100%;
    margin: 8px;

    &:hover {
      cursor: pointer;
    }

    .upload-button {
      @include flex-container(row, center, flex-end);
      gap: 6px;
      margin-left: 6px;

      .upload-text {
        font-size: 12px;
        white-space: nowrap;
      }
    }
  }

  .uploaded-files {
    width: 100%;
    margin-left: 1rem;

    .file-item {
      @include flex-container(row, flex-start, center);
      font-size: 12px;
      width: 100%;

      .file-name {
        margin-right: 1rem;
        word-break: break-all;
      }

      .delete-file {
        background: none;
      }
    }
  }
}

.uc-form-element {
  width: 100%;

  .uc-row {
    justify-content: space-between;
  }

  .description-input {
    width: 100%;
  }
}
</style>
