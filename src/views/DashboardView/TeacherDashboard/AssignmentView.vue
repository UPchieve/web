<template>
  <div class="assignment-container">
    <div class="breadcrumbs-container">
      <button class="back-btn" @click="backToAssignments()">
        ← Back to assignments
      </button>
    </div>
    <div class="loader-container" v-if="isLoading">
      <loader class="loader" />
    </div>
    <div v-else>
      <h1 class="assignment-header">
        <AssignmentIcon /><span class="assignment-title">{{
          assignmentInfo.title
        }}</span>
      </h1>
      <div class="assignment-info">
        <button
          class="student-completion-btn"
          @click="openStudentCompletionModal"
          data-testid="student-completion"
        >
          Student Completion {{ completedStudents }}/{{ totalStudents }}
        </button>
        <div class="dates-container">
          <span
            ><Calendar class="calendar-icon" /><strong class="bold-text"
              >Start date:</strong
            >
            {{ this.startDate }}</span
          >
          <span
            ><strong class="bold-text">Due date:</strong>
            {{ this.dueDate }}</span
          >
        </div>
        <div class="tutoring-sessions-container">
          <p>
            <strong class="bold-text">Tutoring Sessions:</strong>
            {{ assignmentInfo.numberOfSessions }} Session(s) Required,
            {{ assignmentInfo.minDurationInMinutes }} minutes per session
          </p>
        </div>
        <div v-if="assignmentDocs.length" class="assignment-uploads-container">
          <p>
            <strong class="bold-text">Assignment Documents:</strong>
          </p>
          <div class="documents-list">
            <div
              v-for="doc in assignmentDocs"
              :key="doc.name"
              class="document-item"
            >
              <a :href="doc.url" target="_blank" class="document-link">
                {{ doc.name }}
              </a>
            </div>
          </div>
        </div>
      </div>
      <div class="line-break"></div>
      <div class="instructions">
        <p><strong class="bold-text">Instructions:</strong></p>
        <p data-testid="description-text" class="instructions-text">
          {{ assignmentInfo.description || `No instructions provided.` }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import NetworkService from '@/services/NetworkService'
import AssignmentIcon from '@/assets/AssignmentIcon.svg'
import Calendar from '@/assets/calendar.svg'
import moment from 'moment'
import Loader from '@/components/Loader.vue'

export default {
  name: 'Assignment',
  components: { AssignmentIcon, Calendar, Loader },

  data() {
    return {
      isLoading: true,
      assignmentId: '',
      assignmentInfo: {},
      startDate: '',
      dueDate: '',
      studentCompletion: [],
      totalStudents: 0,
      completedStudents: 0,
      assignmentDocs: '',
    }
  },

  async created() {
    this.assignmentId = this.$route.params.assignmentId
    this.assignmentInfo = await this.getAssignmentDetails(this.assignmentId)
    this.startDate = moment(this.assignmentInfo.startDate).format('MM/DD/YYYY')
    this.dueDate = moment(this.assignmentInfo.dueDate).format('MM/DD/YYYY')
    this.classId = this.$route.params.classId
    this.studentCompletion = await this.getAssignmentCompletionInfo(
      this.assignmentId
    )
    this.totalStudents = this.studentCompletion.length
    this.completedStudents = this.studentCompletion.filter(
      (student) => student.submitted_at !== null
    ).length
  },

  methods: {
    async getAssignmentDetails(assignmentId) {
      try {
        const {
          data: { assignment },
        } = await NetworkService.getAssignmentById(assignmentId)
        this.assignmentDocs = await this.getAssignmentDocuments(
          this.assignmentId
        )

        return assignment
      } catch (err) {
        this.error =
          err.response.data.err ??
          'Unable to load assignment. Please refresh the page and try again.'
      } finally {
        this.isLoading = false
      }
    },

    backToAssignments() {
      this.$router.push(`/dashboard/teacher/class/${this.classId}/assignments`)
    },

    async getAssignmentCompletionInfo(assignmentId) {
      const {
        data: { studentAssignments },
      } = await NetworkService.getStudentAssignmentCompletion(assignmentId)
      return studentAssignments
    },

    openStudentCompletionModal() {
      this.$store.dispatch('app/modal/show', {
        component: 'StudentCompletionModal',
        data: {
          studentCompletion: this.studentCompletion,
        },
      })
    },

    async getAssignmentDocuments(assignmentId) {
      const {
        data: { assignmentDocuments },
      } = await NetworkService.getAssignmentDocuments(assignmentId)
      return assignmentDocuments
    },
  },
}
</script>

<style lang="scss" scoped>
.back-btn {
  color: $c-information-blue;
  margin-bottom: 16px;
  font-size: 14px;
}

.assignment {
  color: #666f7d;
  font-size: 14px;
}

.assignment-header {
  margin-left: 1em;
}
.calendar-icon {
  height: 16px;
  margin-right: 4px;
}

.bold-text {
  font-weight: 500;
}
.assignment-container {
  margin: 40px;
}
.assignment-title {
  margin-left: 12px;
  font-size: 28px;
}

.assignment-info,
.instructions,
.line-break {
  margin-left: 5em;
}

.instructions-text {
  white-space: pre-wrap;
}

.breadcrumbs-container {
  margin-left: 2em;
}

.dates-container {
  @include flex-container(row, flex-start);
  gap: 2em;
  margin-bottom: 1em;
}

.assignment-info {
  border-bottom: solid 2px #d9d9d9;
  margin-bottom: 1em;
}

.student-completion-btn {
  padding: 0;
  margin: 0.8rem 0;
  color: $c-information-blue;
  font-weight: 500;
}

.assignment-uploads-container {
  @include flex-container(row, flex-start, center);
}

.documents-list {
  margin-left: 8px;
  margin-bottom: 16px;
}

.document-link {
  color: $c-information-blue;
  cursor: pointer;
  text-decoration: underline;
  font-size: 14px;

  &:hover {
    color: darken($c-information-blue, 10%);
  }
}

.loader-container {
  @include flex-container(column, center, center);
  margin-top: 24px;
}
</style>
