<template>
  <div class="teacher-dashboard">
    <div class="main">
      <div class="class-header">
        <button class="back-btn" @click="backToClasses()">
          ← Back to your classes
        </button>
        <div class="class-info">
          <h1>{{ classInfo.name }}</h1>
          <span class="students-text"
            >{{ classInfo.totalStudents }} students</span
          >
          <button @click="openTeacherCodeModal">
            <LinkUnion /><span class="class-code-text">Class Code</span>
          </button>
        </div>
      </div>
      <div class="classes-container">
        <loader v-if="isLoading" />
        <div v-else-if="!students.length" class="empty-sessions-container">
          <Checklist />
          <p>
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
          <tr v-for="student in students" :key="student.id">
            <td>{{ student.firstName }}</td>
            <td>{{ student.numSessions }}</td>
            <td>{{ student.timeTutored }}</td>
            <td>{{ student.lastSession }}</td>
            <td>
              <button
                class="view-details-btn"
                @click="viewStudentDetails(student)"
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
    }
  },
  props: {
    topics: {
      type: Object,
    },
    classId: {
      type: String,
    },
    classInfo: {
      type: Object,
    },
  },
  async created() {
    if (this.studentId) {
      this.view = 'studentDetails'
    } else if (this.$route.params.classId && !this.$route.params.studentId) {
      this.students = await this.getStudents(this.classId)
      this.view = 'classDetails'
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

    viewStudentDetails(student) {
      this.studentId = student.id
      this.$router.push(`/dashboard/teacher/${this.classId}/${student.id}`)
    },
  },
}
</script>

<style lang="scss" scoped>
.main {
  @include flex-container(column, center);
  margin: 40px;
}

.teacher-dashboard {
  padding: 0 !important;
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
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.class-info h1 {
  font-size: 24px;
  margin-right: 14px;
  margin-bottom: 0;
}

.class-info button {
  font-size: 15px;
  color: #1855d1;
  justify-content: left;
}

.class-info span {
  font-size: 15px;
  margin-right: 14px;
}

.students-text {
  color: #666f7d;
}

.classes-container {
  margin-top: 16px;
}

.classes-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 10px;
  overflow: hidden;
  background-color: #ffffff;
}

.classes-table th {
  background-color: #e3f2fd;
  padding: 8px;
  font-size: 16px;
  font-weight: 500;
}
.classes-table tr {
  text-align: center;
}

.classes-table td {
  padding: 14px;
  font-weight: 400;
  font-size: 14px;
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
</style>
