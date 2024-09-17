<template>
  <div class="teacher-dashboard">
    <div class="main">
      <div class="class-header">
        <button class="back-btn" @click="backToClasses()">
          ← Back to your classes
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
            <button class="create-assignment-btn">Create Assignments</button>
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
      <div class="classes-container">
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
            <td>{{ student.firstName }}</td>
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
    </div>
  </div>
</template>

<script>
import Loader from '@/components/Loader.vue'
import NetworkService from '@/services/NetworkService'
import RightArrow from '@/assets/RightArrow.svg'
import LinkUnion from '@/assets/LinkUnion.svg'
import Checklist from '@/assets/Checklist.svg'
import moment from 'moment'
import { mapGetters } from 'vuex'

export default {
  name: 'ClassDetails',
  components: {
    Loader,
    RightArrow,
    LinkUnion,
    Checklist,
  },

  data() {
    return {
      students: [],
      isLoading: true,
      viewSessions: false,
      view: '',
      student: {},
      studentId: '',
      isSelected: 'classDetails',
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
    if (this.$route.params.classId && !this.$route.params.studentId) {
      this.students = await this.getStudents(this.classId)
    } else if (!this.$route.params.classId) {
      this.$router.push('/dashboard')
    }
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
      const classes = this.classes
      this.$store.dispatch('app/modal/show', {
        component: 'CreateAssignmentModal',
        data: {
          classes,
        },
      })
    },

    viewStudentDetails(student) {
      this.studentId = student.id
      this.$router.push(
        `/dashboard/teacher/class/${this.classInfo.id}/student/${student.id}`
      )
    },

    openTab(isSelected) {
      if (isSelected === 'classDetails') this.isSelected = 'assignments'
      else this.isSelected = 'classDetails'
    },
  },
}
</script>

<style lang="scss" scoped>
.main {
  @include flex-container(column, center);
  margin-top: 40px;
}

.teacher-dashboard {
  padding: 0 !important;
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
  font-size: 12px;
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
  color: #1855d1;
  margin-bottom: 16px;
  font-size: 14px;
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
