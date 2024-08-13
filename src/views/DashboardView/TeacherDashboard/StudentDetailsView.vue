<template>
  <div class="teacher-dashboard">
    <div class="main">
      <div class="student-header">
        <button class="back-btn" @click="backToClassDetails()">
          Class Details
        </button>
        <span class="student-details"> > Student Details</span>
        <div class="student-info">
          <div class="img-container">
            <student-avatar class="img"></student-avatar>
          </div>
          <div class="student-info-text">
            <h1>{{ studentFirstName }}</h1>
            <h3>{{ className }}</h3>
          </div>
        </div>
      </div>
      <div class="filter-container">
        <div class="filter-controls">
          <label class="select-label"
            >Select Subject
            <FormSelect
              class="topics-dropdown"
              :name="'topic'"
              :placeholder="
                filters.topicId
                  ? topics.find((topic) => topic.id === filters.topicId)
                      .displayName
                  : 'Select Subject'
              "
              :optionTextField="'displayName'"
              :reduce="(option) => option.id"
              :getSelectOptions="() => topics"
              v-model="filters.topicId"
            />
          </label>
          <div class="date-input-container">
            <label class="date-label"
              >from
              <FormDateInput
                id="session-activity-from"
                :placeholder="filters.sessionActivityFrom"
                v-model="filters.sessionActivityFrom"
              />
            </label>
            <label class="date-label"
              >to
              <FormDateInput
                id="session-activity-to"
                :placeholder="filters.sessionActivityTo"
                v-model="filters.sessionActivityTo"
              />
            </label>
          </div>
        </div>
        <button class="filter-btn" @click="submitFilter()">
          Filter Sessions
        </button>
      </div>
      <div></div>
      <div class="sessions-container">
        <loader v-if="isLoading" />
        <table v-else class="sessions-table">
          <tr>
            <th>Subject</th>
            <th># of Messages</th>
            <th>Session Date</th>
            <th>Session Length</th>
          </tr>
          <tr v-for="session in sessions" :key="session.id">
            <td>{{ session.sessionSubject }}</td>
            <td>{{ session.messageCount }}</td>
            <td>{{ formatTimestamp(session.createdAt) }}</td>
            <td>{{ session.length }} Minutes</td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import Loader from '@/components/Loader.vue'
import FormDateInput from '@/components/FormDateInput.vue'
import FormSelect from '@/components/FormSelect.vue'
import NetworkService from '@/services/NetworkService'
import { mapState } from 'vuex'
import StudentAvatar from '@/assets/student-avatar.svg'
import moment from 'moment'

export default {
  name: 'student-details',
  components: {
    Loader,
    StudentAvatar,
    FormDateInput,
    FormSelect,
  },

  data() {
    return {
      classId: '',
      studentId: '',
      sessions: [],
      studentFirstName: '',
      studentLastName: '',
      isLoading: true,
      filters: {
        topicId: '',
        sessionActivityFrom: moment().subtract(7, 'days').format('YYYY-MM-DD'),
        sessionActivityTo: moment().format('YYYY-MM-DD'),
      },
    }
  },
  computed: {
    ...mapState({
      subjects: (state) => state.subjects.subjects,
    }),
  },

  props: {
    className: {
      type: String,
    },
    topics: {
      type: Array,
    },
    classInfo: {
      type: Object,
    },
  },

  async created() {
    this.topics.forEach((topic) => {
      if (topic.id == this.classInfo.topicId) this.filters.topicId = topic.id
    })
    if (this.$route.params.studentId) {
      this.classId = this.$route.params.classId
      this.studentId = this.$route.params.studentId
    } else if (this.$route.params.classId && !this.$route.params.studentId) {
      this.classId = this.$route.params.classId
      this.$router.push(`/dashboard/teacher/class/${this.classId}`)
    } else {
      this.$router.push(`/dashboard/teacher`)
    }
    this.sessions = await this.getStudentSessionDetails()
  },

  methods: {
    backToClassDetails() {
      this.$router.push(`/dashboard/teacher/class/${this.classId}`)
    },

    formatTimestamp(timestamp) {
      const date = moment(timestamp)
      return date.format('MM/DD/YYYY')
    },

    async getStudentSessionDetails() {
      this.isLoading = true
      try {
        const {
          data: { sessionDetails },
        } = await NetworkService.getStudentSessionDetails(this.studentId)
        this.studentFirstName = sessionDetails[0].firstName
        const subjects = this.subjects
        const sessionsWithSubjects = sessionDetails.map((session) => {
          const created = new Date(session.createdAt)
          const ended = new Date(session.endedAt)
          const sessionLength = (ended - created) / (1000 * 60)
          return {
            ...session,
            sessionSubject: subjects[session.name].displayName,
            length: Math.round(sessionLength),
          }
        })
        return this.filterSessions(
          sessionsWithSubjects,
          this.subjects,
          this.filters
        )
      } catch (err) {
        err.response.data.err ??
          'Unable to get class. Please refresh the page and try again.'
      } finally {
        this.isLoading = false
      }
    },

    filterSessions(sessions, subjects, filters) {
      const start = new Date(filters.sessionActivityFrom)
      const end = new Date(filters.sessionActivityTo)
      const topicId = filters.topicId
      //TODO: show all sessions in all subjects when no subject
      //is selected during class creation
      const filteredSubjects = Object.values(subjects)
        .filter((subject) => subject.topicId === topicId)
        .map((subject) => subject.name)

      end.setDate(end.getDate() + 1)
      end.setHours(23, 59, 59, 999)

      const filtered = sessions.filter((session) => {
        const createdAt = new Date(session.createdAt)
        return (
          createdAt >= start &&
          createdAt <= end &&
          filteredSubjects.includes(session.name)
        )
      })

      return filtered
    },

    async submitFilter() {
      this.sessions = await this.getStudentSessionDetails()
    },
  },
}
</script>

<style lang="scss" scoped>
.main {
  @include flex-container(column, center);
  margin: 40px;
}

.back-btn {
  color: #1855d1;
  margin-bottom: 16px;
  font-size: 14px;
}

.student-details {
  color: #666f7d;
  font-size: 14px;
}

.student-info {
  @include flex-container(row);
  margin-top: 20px;
}

.img-container {
  background: #f9bef9;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  border-radius: 50%;
  overflow: hidden;
}

.img {
  max-width: 100%;
  max-height: 100%;
}

.student-info h1 {
  font-size: 24px;
  margin: 0 12px;
}

.student-info h3 {
  font-size: 16px;
  margin: 6px 12px;
}

.sessions-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 10px;
  overflow: hidden;
  background-color: white;
  margin-top: 16px;

  @include breakpoint-below('small') {
    display: inline-block;
  }
}

.sessions-table th {
  background-color: #e3f2fd;
  padding: 8px;
  font-size: 16px;
  font-weight: 500;

  @include breakpoint-below('small') {
    font-size: 12px;
    padding: 2px;
  }
}

.sessions-table tr {
  text-align: center;
}

.sessions-table td {
  padding: 14px;
  font-weight: 400;
  font-size: 14px;

  @include breakpoint-below('small') {
    font-size: 12px;
    padding: 2px;
  }
}

.topics-dropdown {
  background-color: #ffffff;
  border-radius: 5px;
}

.filter-container {
  @include flex-container(column, center);
  align-items: center;
  margin-bottom: 16px;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;

  @include breakpoint-below('small') {
    @include flex-container(column, center);
    max-width: 100%;
  }
}

.filter-controls {
  @include flex-container(row, center);
  width: 100%;
  max-width: 600px;
  margin: 10px 0;
  align-items: center;

  @include breakpoint-below('small') {
    @include flex-container(column, center);
  }
}

.select-label {
  flex: 1;
  margin-right: 10px;
}

.date-input-container {
  @include flex-container(row, center, space-between);

  @include breakpoint-below('small') {
    @include flex-container(column, center);
    align-items: center;
  }
}

.date-label {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-right: 10px;
}

.filter-btn {
  padding: 8px 14px;
  font-size: 14px;
  color: #666f7d;
  align-self: center;
  border: 1px solid #343440;
  border-radius: 32px;
  font-weight: 500;
}
</style>
