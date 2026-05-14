<template>
  <div class="assignment-container">
    <div class="breadcrumbs-container">
      <button type="button" class="back-btn" @click="backToAssignments()">
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
          type="button"
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
        <h2 class="instructions-header">
          <strong class="bold-text">Instructions for Students/Tutors: </strong>
        </h2>
        <p data-testid="description-text" class="instructions-text">
          {{ assignmentInfo.description || `No instructions provided.` }}
        </p>
      </div>
      <div v-if="isGettingStarted" class="teacher-notes">
        <h2 class="instructions-header">
          <strong class="bold-text"
            >Notes for teachers (Not shown to students):</strong
          >
        </h2>
        <div class="instructions-text">
          <h3 class="teacher-notes-text-headers">Before Class</h3>
          <ul>
            <li>
              <b>Review the demo video: </b
              ><button
                type="button"
                @click="goToYoutubeVideo"
                class="link-text"
              >
                This video
              </button>
              explains how and why to use UPchieve to your students.
            </li>
            <li>
              <b>Check the assignment: </b>On your Class page, open the “Getting
              Started with UPchieve” assignment and set your subject, start
              date, and due date. Remember to review the student instructions
              and make it relevant for your class!
            </li>
            <li>
              <b>Share your class: </b>
              Post your
              <button type="button" @click="copyURL" class="link-text">
                <span class="class-link">unique class link </span
                ><CopyIcon class="copy-icon" />
              </button>
              to your google classroom (or similar tool) so your students can
              join your class.
            </li>
          </ul>
          <h3 class="teacher-notes-text-headers">During Class (~15 minutes)</h3>
          <ul>
            <li>
              <b>Play the video: </b>Feel free to pause as needed! Students will
              join your class and find their assignment as they follow along
              with the steps in the video.
            </li>
            <li>
              <b>Do your first session together: </b>Students can try UPchieve
              using the “Getting Started with UPchieve” assignment. Share with
              your students that UPchieve is designed for out of school usage,
              so not to worry if they don't get matched today. It'll be much
              quicker after school!
            </li>
          </ul>
          <h3 class="teacher-notes-text-headers">After Class</h3>
          <ul>
            <li>
              <b>Check progress: </b>Visit your Class Details page to track your
              students' usage.
            </li>
            <li>
              <b>Encourage continued use: </b>Create additional assignments to
              make sure students are getting 1-on-1 help on the content they
              need support with.
            </li>
            <li>
              <b>Make it meaningful: </b>Add motivation for your students by
              giving them credit, extra credit, or opportunities to revise work
              by using UPchieve.
            </li>
            <li>
              <b>Celebrate success: </b>Students using UPchieve see improvements
              in homework, test scores, and grades!
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { EVENTS } from '@/consts'
import NetworkService from '@/services/NetworkService'
import AssignmentIcon from '@/assets/AssignmentIcon.svg'
import Calendar from '@/assets/calendar.svg'
import { dayjs } from '@/utils/time-utils'
import Loader from '@/components/Loader.vue'
import { useClipboard } from '@vueuse/core'
import { toastController } from '@ionic/vue'
import CopyIcon from '@/assets/copy-icon.svg'
import AnalyticsService from '@/services/AnalyticsService'

export default {
  name: 'Assignment',
  components: { AssignmentIcon, Calendar, Loader, CopyIcon },

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
      isGettingStarted: false,
    }
  },

  props: {
    currentClassCode: {
      type: String,
      required: false,
    },
  },

  async created() {
    this.assignmentId = this.$route.params.assignmentId
    this.assignmentInfo = await this.getAssignmentDetails(this.assignmentId)
    this.startDate = dayjs(this.assignmentInfo.startDate).format('MM/DD/YYYY')
    this.dueDate = dayjs(this.assignmentInfo.dueDate).format('MM/DD/YYYY')
    this.classId = this.$route.params.classId
    this.studentCompletion = await this.getAssignmentCompletionInfo(
      this.assignmentId
    )
    this.totalStudents = this.studentCompletion.length
    this.completedStudents = this.studentCompletion.filter(
      (student) => student.submitted_at !== null
    ).length
    this.isGettingStarted = this.assignmentInfo.isGettingStartedAssignment

    AnalyticsService.captureEvent(EVENTS.TEACHER_VIEWED_ASSIGNMENT, {
      isGettingStartedAssignment: this.isGettingStarted,
    })
  },

  methods: {
    async copyURL() {
      const { copy } = useClipboard()
      copy(`https://app.upchieve.org/join-class/${this.currentClassCode}`)

      const toast = await toastController.create({
        message: 'Your unique class link has been copied!',
        color: 'light',
        duration: 2000,
        position: 'top',
      })
      await toast.present()
      AnalyticsService.captureEvent(
        EVENTS.TEACHER_CLICKED_GETTING_STARTED_ASSIGNMENT_CLASS_LINK,
        {
          isGettingStartedAssignment: true,
        }
      )
    },

    goToYoutubeVideo() {
      window.open('https://www.youtube.com/watch?v=IjK1SjHAtlc', '_blank')
      AnalyticsService.captureEvent(
        EVENTS.TEACHER_CLICKED_GETTING_STARTED_ASSIGNMENT_VIDEO,
        {
          isGettingStartedAssignment: true,
        }
      )
    },

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
.line-break,
.teacher-notes {
  margin-left: 5em;
}

.instructions-header {
  font-weight: bolder;
  font-size: 16px;
}

.instructions-text {
  white-space: pre-wrap;

  .teacher-notes-text-headers {
    font-size: 16px;
    color: $c-secondary-grey;
  }
}

.teacher-notes {
  background-color: lighten($c-success-green, $amount: 45%);
  padding: 16px;
  border-radius: 8px;
  border: 3px solid $c-success-green;
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

.link-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: $c-information-blue;
  padding: 0;

  .copy-icon {
    width: 16px;
    height: 16px;
  }

  .class-link {
    font-weight: 600;
  }
}
</style>
