<template>
  <div class="teacher-dashboard">
    <div class="main">
      <div class="class-header">
        <button class="back-btn" @click="backToClasses()">
          <Arrow style="display: inline; transform: scale(-1, 1)" /> Back to
          your classes
        </button>
        <div class="class-info">
          <div class="start-col">
            <h1>{{ classInfo.name }}</h1>
            <span class="students-text"
              >{{ classInfo.totalStudents || '0' }}
              {{ classInfo.totalStudents == 1 ? 'student' : 'students' }}</span
            >
            <button
              class="open-teacher-code-modal"
              @click="openTeacherCodeModal"
            >
              <LinkUnion /><span class="class-code-text">Class Code</span>
            </button>
          </div>
          <div v-if="isAssignmentsEnabled" class="end-col">
            <button
              class="create-assignment-btn"
              @click="openCreateAssignmentModal()"
            >
              Assign Tutoring
            </button>
          </div>
        </div>
      </div>
      <div v-if="isAssignmentsEnabled" class="tabs">
        <p
          class="tabs__header-type"
          :class="isSelected === 'classDetails' ? 'is-selected' : null"
          @click="openTab(isSelected)"
        >
          Class Details
        </p>
        <p
          class="tabs__header-type"
          :class="isSelected === 'assignments' ? 'is-selected' : null"
          @click="openTab(isSelected)"
        >
          Assignments
        </p>
      </div>
      <div v-if="isSelected === 'classDetails'" class="classes-container">
        <loader v-if="isLoading" />
        <div v-else-if="!students.length" class="empty-sessions-container">
          <Checklist />
          <p data-testid="no-students-msg">
            You currently don't have any students in this class. Click here to
            share the code with your students!
          </p>
          <button class="uc-form-button" @click="openTeacherCodeModal">
            Get Code
          </button>
        </div>
        <table v-else class="classes-table">
          <tr>
            <th>Student</th>
            <th># of Sessions</th>
            <th>Time Tutored</th>
            <th>Last Session</th>
            <th>Details</th>
          </tr>
          <tr
            v-for="student in students"
            :key="student.id"
            data-testid="student-row"
          >
            <td>{{ student.firstName }} {{ student.lastName }}</td>
            <td>{{ student.numSessions }}</td>
            <td>{{ student.timeTutored }}</td>
            <td>{{ student.lastSession }}</td>
            <td>
              <button
                class="view-details-btn"
                @click="viewStudentDetails(student)"
                :data-testid="`view-details-btn-${student.id}`"
              >
                Student Details <RightArrow />
              </button>
            </td>
          </tr>
        </table>
      </div>
      <div
        v-else
        :class="
          !assignments.length
            ? 'assignments-container-empty'
            : 'assignments-container'
        "
      >
        <div v-if="!assignments.length" class="empty-assignments-container">
          <h1>No Assignments Yet!</h1>
          <p>
            Create an assignment to kickstart your students' learning journey.
          </p>
          <button
            class="create-assignment-btn"
            @click="openCreateAssignmentModal()"
          >
            Assign Tutoring
          </button>
        </div>
        <div v-else class="assignments-cards">
          <div
            v-for="assignment in assignments"
            :key="assignment.id"
            class="assignment-card-wrapper"
          >
            <div class="assignment-card">
              <div class="assignment-icon">
                <AssignmentIcon />
              </div>
              <div class="assignment-info">
                <button @click="viewAssignment(assignment.id)">
                  <h1>{{ assignment.title }}</h1>
                  <p>Due date: {{ formatTimestamp(assignment.dueDate) }}</p>
                </button>
                <button
                  v-if="assignmentsCompletion[assignment.id].totalStudents"
                  class="student-completion"
                  @click="toggleStudentCompletion(assignment.id)"
                >
                  Student completion
                  {{
                    assignmentsCompletion[assignment.id].completedStudents
                  }}/{{ assignmentsCompletion[assignment.id].totalStudents }}
                </button>
                <div v-else>
                  <p class="no-students-assigned">
                    No students have been assigned.
                  </p>
                </div>
              </div>
            </div>

            <div
              v-if="toggledAssignmentId === assignment.id"
              class="students-container"
            >
              <div
                v-for="student in assignmentsCompletion[assignment.id]
                  .studentsCompletion"
                :key="student.assignmentId"
                class="student-row"
              >
                <span v-if="student.submitted_at" class="check-mark"
                  ><Check class="check"
                /></span>
                <span v-else class="check-mark"></span>
                <p class="student-name">
                  {{ student.first_name }} {{ student.last_name }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Loader from '@/components/Loader.vue'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import RightArrow from '@/assets/RightArrow.svg'
import LinkUnion from '@/assets/LinkUnion.svg'
import Checklist from '@/assets/Checklist.svg'
import Check from '@/assets/check.svg'
import Arrow from '@/assets/RightArrow.svg'
import AssignmentIcon from '@/assets/AssignmentIcon.svg'
import moment from 'moment'
import { mapGetters } from 'vuex'
import { EVENTS } from '@/consts'

export default {
  name: 'ClassDetails',
  components: {
    Loader,
    RightArrow,
    LinkUnion,
    Checklist,
    AssignmentIcon,
    Check,
    Arrow,
  },

  data() {
    return {
      students: [],
      isLoading: true,
      viewSessions: false,
      student: {},
      studentId: '',
      isSelected: 'classDetails',
      assignments: [],
      toggledAssignmentId: '',
      assignmentsCompletion: {},
    }
  },
  computed: {
    ...mapGetters({
      isAssignmentsEnabled: 'featureFlags/isAssignmentsEnabled',
    }),
  },
  props: {
    classes: {
      type: Array,
    },
    classId: {
      type: String,
    },
    classInfo: {
      type: Object,
    },
  },

  async created() {
    if (
      this.$route.params.classId &&
      !this.$route.path.includes('assignments') &&
      !this.$route.params.studentId
    ) {
      this.students = await this.getStudents(this.classId)
    } else if (
      this.$route.params.classId &&
      this.$route.path.includes('assignments')
    ) {
      this.isSelected = 'assignments'
      this.assignments = await this.getClassAssignments()
      const assignmentIds = this.assignments.map((assignment) => assignment.id)
      this.allStudentsAssigned = await this.getStudentAssignments(assignmentIds)
    } else if (!this.$route.params.classId) {
      this.$router.push('/dashboard')
    }
    this.assignments = await this.getClassAssignments()
    const assignmentIds = this.assignments.map((assignment) => assignment.id)

    const getStudentAssignments = Object.assign(
      ...(await this.getStudentAssignments(assignmentIds).then((assignments) =>
        assignments.map((assignment) => ({
          [assignment.assignmentId]: assignment.studentAssignments,
        }))
      ))
    )

    this.assignmentsCompletion = this.getAssignmentCompletion(
      this.assignments,
      getStudentAssignments
    )
  },

  methods: {
    backToClasses() {
      this.$router.push('/dashboard')
    },

    formatTimestamp(timestamp) {
      const date = moment(timestamp)
      return date.format('MM/DD/YYYY')
    },

    async getStudents(classId) {
      try {
        const {
          data: { students },
        } = await NetworkService.getStudentsInTeacherClass(classId)
        const studentsAndSessions = await Promise.all(
          students.map(async (student) => {
            const {
              data: { sessionDetails },
            } = await NetworkService.getStudentSessionDetails(student.id)
            let minTutored = 0
            let lastSession = ''
            sessionDetails.forEach((session) => {
              const endedAt = new Date(session.endedAt)
              const startedAt = new Date(session.createdAt)
              const sessionLength = (endedAt - startedAt) / (1000 * 60)
              minTutored += sessionLength
              if (session.createdAt > lastSession)
                lastSession = session.createdAt
            })
            let hoursTutored = 0
            while (minTutored >= 60) {
              hoursTutored++
              minTutored -= 60
            }
            const timeTutored =
              hoursTutored > 0
                ? `${hoursTutored} hour(s) and ${Math.round(minTutored)} minute(s)`
                : `${Math.round(minTutored)} minutes`
            return {
              ...student,
              numSessions: sessionDetails.length,
              timeTutored,
              lastSession: lastSession
                ? this.formatTimestamp(lastSession)
                : 'Has not completed a session.',
            }
          })
        )
        return studentsAndSessions
      } catch (err) {
        this.error =
          err.response.data.err ??
          'Unable to load students. Please refresh the page and try again.'
      } finally {
        this.isLoading = false
      }
    },

    openTeacherCodeModal() {
      const code = this.classInfo.code
      this.$store.dispatch('app/modal/show', {
        component: 'TeacherClassCodeModal',
        data: {
          code,
        },
      })
    },

    openCreateAssignmentModal() {
      AnalyticsService.captureEvent(EVENTS.ASSIGNMENT_OPEN_CREATE_MODAL)
      this.$store.dispatch('app/modal/show', {
        component: 'CreateAssignmentModal',
        data: {
          onAssignmentCreated: this.handleAssignmentCreated,
          classes: this.classes,
        },
      })
    },

    async handleAssignmentCreated({ assignmentData, selectedClasses }) {
      try {
        const classIds = selectedClasses.map(
          (selectedClass) => selectedClass.id
        )
        const assignments = await Promise.all(
          classIds.map(async (classId) => {
            const assignmentInfo = { classId, ...assignmentData }
            const {
              data: { assignment },
            } = await NetworkService.createAssignment(assignmentInfo)
            return assignment
          })
        )
        this.assignments.push(...assignments)
        const assignmentIds = this.assignments.map(
          (assignment) => assignment.id
        )
        const getStudentAssignments = Object.assign(
          ...(await this.getStudentAssignments(assignmentIds).then(
            (assignments) =>
              assignments.map((assignment) => ({
                [assignment.assignmentId]: assignment.studentAssignments,
              }))
          ))
        )

        this.assignmentsCompletion = this.getAssignmentCompletion(
          this.assignments,
          getStudentAssignments
        )
      } catch (err) {
        this.error = err.response.data.err ?? 'Unable to create assignment.'
      }
    },

    viewStudentDetails(student) {
      this.studentId = student.id
      this.$router.push(
        `/dashboard/teacher/class/${this.classInfo.id}/student/${student.id}`
      )
    },

    async openTab(isSelected) {
      this.assignments = await this.getClassAssignments()
      const assignmentIds = this.assignments.map((assignment) => assignment.id)
      this.allStudentsAssigned = await this.getStudentAssignments(assignmentIds)
      if (
        isSelected === 'classDetails' &&
        !this.$route.path.includes('assignments')
      ) {
        this.isSelected = 'assignments'
        this.$router.push(
          `/dashboard/teacher/class/${this.classInfo.id}/assignments`
        )
      } else {
        this.isSelected = 'classDetails'
        this.$router.push(`/dashboard/teacher/class/${this.classInfo.id}`)
        this.students = await this.getStudents(this.classId)
      }
    },

    async getClassAssignments() {
      const {
        data: { assignments },
      } = await NetworkService.getAssignmentsByClassId(this.classId)
      return assignments
    },

    viewAssignment(assignmentId) {
      this.$router.push(
        `/dashboard/teacher/class/${this.classInfo.id}/assignment/${assignmentId}`
      )
    },

    async getStudentAssignments(assignmentIds) {
      const studentAssignments = await Promise.all(
        assignmentIds.map(async (assignmentId) => {
          const {
            data: { studentAssignments },
          } = await NetworkService.getStudentAssignmentCompletion(assignmentId)
          return { assignmentId, studentAssignments }
        })
      )
      return studentAssignments
    },

    toggleStudentCompletion(assignmentId) {
      if (this.toggledAssignmentId === assignmentId) {
        this.toggledAssignmentId = null
      } else {
        this.toggledAssignmentId = assignmentId
      }
    },

    getAssignmentCompletion(assignments, completionData) {
      const result = {}

      assignments.forEach((assignment) => {
        const { id } = assignment
        const studentsCompletion = completionData[id] || []
        const totalStudents = studentsCompletion.length
        const completedStudents = studentsCompletion.filter(
          (student) => student.submitted_at !== null
        ).length

        result[id] = {
          studentsCompletion,
          totalStudents,
          completedStudents,
        }
      })

      return result
    },
  },
}
</script>

<style lang="scss" scoped>
.main {
  @include flex-container(column, center);
  margin-top: 40px;
  flex-grow: 1;
}

.teacher-dashboard {
  @include flex-container(column, center);
  padding: 0 !important;
  height: 90vh;
}

.class-header {
  margin-left: 40px;
  margin-right: 40px;
}

.empty-sessions-container {
  @include flex-container(column, center, center);
  margin: 24px;
  align-content: center;
  height: 300px;
}

.empty-sessions-container p {
  margin: 12px;
  color: #77778b;
  width: 300px;
  font-size: 16px;
  text-align: center;
}

.empty-sessions-container button {
  width: 200px;
}

.class-code-text {
  margin-left: 5px;
  color: #1855d1;
}

.class-header p {
  color: #77778b;
}

.class-info {
  @include flex-container(row, space-between, left);
  margin-bottom: 10px;

  h1 {
    font-size: 24px;
    margin-right: 14px;
    margin-bottom: 0;
  }
}

.start-col {
  @include flex-container(row, left, center);

  span {
    font-size: 15px;
    margin-right: 14px;
  }
}

.create-assignment-btn {
  background-color: #1855d1;
  border-radius: 24px;
  padding: 10px 16px;
  color: #ffffff;
  font-size: 16px;
}

.open-teacher-code-modal {
  font-size: 15px;
  color: #1855d1;
}

.students-text {
  color: #666f7d;
}

.classes-container {
  margin: 16px 40px 0 40px;
  flex-grow: 1;
}

.classes-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 10px;
  overflow: hidden;
  background-color: #ffffff;

  th {
    background-color: #e3f2fd;
    padding: 8px;
    font-size: 16px;
    font-weight: 500;
  }

  tr {
    text-align: center;
  }

  td {
    padding: 14px;
    font-weight: 400;
    font-size: 14px;
  }
}

.view-details-btn {
  padding: 8px 14px;
  font-size: 14px;
  color: #1855d1;
  align-self: center;
  border: 1px solid #1855d1;
  border-radius: 32px;
  font-weight: 500;
}

.back-btn {
  @include flex-container(row, center, center);
  gap: 8px;
  color: #1855d1;
  margin-bottom: 16px;
  font-size: 14px;
}

.assignments-container {
  @include flex-container(column, flex-start, flex-start);
  background-color: #ffffff;
  flex-grow: 1;
}

.assignments-container-empty {
  @include flex-container(column, center, center);
  background-color: #ffffff;
  flex-grow: 1;
}

.empty-assignments-container {
  @include flex-container(column, center, center);
  gap: 0.5em;
  h1 {
    font-size: 20px;
  }
}

.assignment-card-wrapper {
  @include flex-container(column, flex-start, center);
  position: relative;
  margin-bottom: 20px;
}

.students-container {
  @include flex-container(column, flex-start);
  background-color: #ffffff;
  border: solid 1px #d8dee5;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  padding: 8px;
  position: absolute;
  top: 90%;
  left: 20%;
  width: 100%;
  z-index: 3;
}

.assignment-card {
  @include flex-container(row, flex-start, flex-start);
  padding: 12px 8px;
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  background-color: #ffffff;
  margin-bottom: 16px;
  width: 350px;

  .assignment-icon {
    margin: 0 8px;
  }

  .assignment-info {
    @include flex-container(column, flex-start, flex-start);
    overflow: hidden;
    flex-grow: 1;

    button {
      display: block;
      text-align: left;
      width: 100%;
    }

    h1 {
      font-size: 18px;
      margin: 0;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    p {
      font-size: 16px;
      margin: 8px 0 0;
    }

    .student-completion,
    .no-students-assigned {
      padding-left: 6px;
      margin-top: 1.25rem;
      color: #1855d1;
      font-weight: 500;
    }

    .no-students-assigned {
      color: $c-secondary-grey;
    }
  }
}

.assignments-cards {
  @include flex-container(row, flex-start, flex-start);
  flex-grow: 1;
  margin: 20px;
  gap: 24px;
  flex-wrap: wrap;
  z-index: 1;
}

.student-row {
  @include flex-container(row, flex-start);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.student-name {
  flex: 1;
  overflow: hidden;
}

.check-mark {
  display: table-cell;
  padding-right: 8px;
  width: 40px;
  text-align: center;
  height: 20px;
}

.tabs {
  @include flex-container(row, flex-start, left);
  margin-top: 1em;
  text-align: left;
  gap: 2em;
  border-bottom: 4px solid #d8dee5;
  z-index: 0;

  &__header-type {
    padding-bottom: 0.8em;
    font-size: 16px;
    margin-bottom: -4px;
    margin-left: 40px;
    border-bottom: 4px solid transparent;
    padding-right: 0.5em;
    text-align: left;

    &:hover {
      cursor: pointer;
    }
  }
}

.is-selected {
  border-bottom: 4px solid $c-success-green;
  z-index: 5;
}
</style>
