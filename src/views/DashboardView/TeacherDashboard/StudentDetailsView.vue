<template>
  <div>
    <div class="main">
      <div class="student-header">
        <button class="back-btn" @click="backToClasses()">Classes</button>
        <button class="back-btn" @click="backToClassDetails()">
          > Class Details
        </button>
        <span class="student-details"> > Student Details</span>
        <div class="student-info">
          <div class="img-container">
            <student-avatar class="img"></student-avatar>
          </div>
          <div class="student-info-text">
            <h1>{{ studentFirstName }} {{ studentLastName }}</h1>
            <h3>{{ className }}</h3>
          </div>
        </div>
      </div>
      <div class="filter-container">
        <div class="filter-controls">
          <label class="select-label"
            >Select Subject
            <IonicSelect
              v-if="topics.length"
              class="topics-dropdown"
              :name="'topic'"
              :placeholder="subjectPlaceholder"
              :optionTextField="'displayName'"
              :reduce="(option) => option.name"
              :options="[
                ...topics,
                { name: 'other', displayName: 'All Subjects' },
              ]"
              v-model="filters.topic.name"
              @update:modelValue="submitFilter"
            />
          </label>
          <div class="date-input-container">
            <label class="date-label"
              >from
              <FormDateInput
                id="session-activity-from"
                :placeholder="filters.sessionActivityFrom"
                v-model="filters.sessionActivityFrom"
                @update:modelValue="submitFilter"
              />
            </label>
            <label class="date-label"
              >to
              <FormDateInput
                id="session-activity-to"
                :placeholder="filters.sessionActivityTo"
                v-model="filters.sessionActivityTo"
                @update:modelValue="submitFilter"
              />
            </label>
          </div>
        </div>
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
import NetworkService from '@/services/NetworkService'
import { mapState } from 'vuex'
import StudentAvatar from '@/assets/user_avatars/student-avatar.svg'
import moment from 'moment'
import IonicSelect from '@/components/IonicSelect.vue'
import { vTooltip } from 'maz-ui'

export default {
  name: 'student-details',
  directives: {
    tooltip: vTooltip,
  },
  components: {
    Loader,
    StudentAvatar,
    FormDateInput,
    IonicSelect,
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
        topic: {
          name: '',
        },
        sessionActivityFrom: moment()
          .month('August')
          .date(1)
          .subtract(
            moment().isBefore(moment().month('August').date(1), 'day') ? 1 : 0,
            'year'
          )
          .format('YYYY-MM-DD'),
        sessionActivityTo: moment().format('YYYY-MM-DD'),
      },
      subjectPlaceholder: '',
    }
  },
  computed: {
    ...mapState({
      topics: (state) => state.subjects.topics,
      subjects: (state) => state.subjects.subjects,
    }),
  },

  props: {
    className: {
      type: String,
    },
    classInfo: {
      type: Object,
    },
  },

  async created() {
    // TODO: Clean-up routing: Shouldn't need these checks.
    if (this.$route.params.studentId) {
      this.classId = this.$route.params.classId
      this.studentId = this.$route.params.studentId
    } else if (this.$route.params.classId && !this.$route.params.studentId) {
      this.classId = this.$route.params.classId
      this.$router.push(`/dashboard/teacher/class/${this.classId}`)
    } else {
      this.$router.push(`/dashboard/teacher`)
    }

    await this.$store.dispatch('subjects/awaitTopics')
    if (this.classInfo.topicId) {
      const topic = this.topics.find((t) => t.id === this.classInfo.topicId)
      this.filters.topic.name = topic.name
      this.subjectPlaceholder = topic.displayName
    } else {
      this.filters.topic.name = 'other'
      this.subjectPlaceholder = 'All Subjects'
    }

    this.sessions = await this.getStudentSessionDetails()
  },

  methods: {
    backToClasses() {
      this.$router.push(`dashboard/teacher`)
    },
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

        let filteredSessionDetails = sessionDetails.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )

        if (filteredSessionDetails.length === 0) {
          return []
        }

        this.studentFirstName = filteredSessionDetails[0].firstName
        this.studentLastName = filteredSessionDetails[0].lastName
        const subjects = this.subjects
        const sessionsWithSubjects = filteredSessionDetails.map((session) => {
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
          'Unable to get sessions. Please refresh the page and try again.'
        return []
      } finally {
        this.isLoading = false
      }
    },

    filterSessions(sessions, subjects, filters) {
      const start = new Date(filters.sessionActivityFrom + 'T00:00')
      const end = new Date(filters.sessionActivityTo + 'T23:59:59')
      const filteredSubjects = Object.values(subjects)
        .filter(
          (subject) =>
            filters.topic.name === 'other' ||
            subject.topicName === filters.topic.name
        )
        .map((subject) => subject.name)

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

.sessions-container {
  @include flex-container(column, center, center);
}

.img-container {
  @include flex-container(column, flex-end, center);
  background: $c-student;
  width: 40px;
  height: 40px;
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
  margin: 16px 0;
}

.sessions-table th {
  background-color: #e3f2fd;
  padding: 8px 12px;
  font-size: 16px;
  font-weight: 500;

  @include breakpoint-below('small') {
    font-size: 12px;
    padding: 2px;
  }
}

.sessions-table tr {
  text-align: left;
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
  @include flex-container(column, flex-start);
  margin-bottom: 16px;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;

  @include breakpoint-below('small') {
    @include flex-container(row, center);
    max-width: 100%;
  }
}

.filter-controls {
  @include flex-container(row, center);
  width: 100%;
  max-width: 600px;
  margin: 10px 0;
  align-items: center;

  @include breakpoint-below('medium') {
    @include flex-container(column, center);
  }
}

.select-label {
  flex: 1;
  margin-right: 10px;

  @include breakpoint-below('medium') {
    width: 100%;
    margin: 0;
  }
}

.date-input-container {
  @include flex-container(row, center, space-between);

  @include breakpoint-below('medium') {
    @include flex-container(column, center);
    width: 100%;
  }
}

.date-label {
  @include flex-container(column, center, flex-start);
  margin-right: 10px;

  @include breakpoint-below('medium') {
    width: 100%;
  }
}
</style>
