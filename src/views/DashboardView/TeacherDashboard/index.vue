<template>
  <div class="teacher-dashboard">
    <ClassDetails
      v-if="this.view === 'classDetails'"
      :classInfo="currentClassInfo"
      :classId="classId"
    />
    <StudentDetails
      v-else-if="this.view === 'studentDetails'"
      :classInfo="currentClassInfo"
      :className="currentClassInfo.name"
      :topics="topics"
    />
    <div v-else class="main">
      <div class="dashboard-banner">
        <div class="dashboard-text">
          <h1>Welcome, {{ user.user.firstName }}!</h1>
          <p>
            UPchieve gives your students access to unlimited, 1:1 virtual
            tutoring and college advice, 24/7. Set up classes with your teacher
            account to track and share student usage.
          </p>
          <a
            href="https://vimeo.com/998375372?share=copy"
            target="_blank"
            rel="noopener"
            >See How UPchieve Works for Your Students</a
          >
        </div>
        <ClassImg class="dashboard-img" />
      </div>
      <!-- TODO: Add error message on error. -->
      <loader v-if="isLoading" />
      <div v-else-if="!classes.length" class="empty-classes-container">
        <Checklist />
        <p>
          Providing extra help is about to get easier. Click here to get started!
        </p>
        <button class="uc-form-button" @click="openCreateTeacherClassModal">
          Add Class
        </button>
      </div>
      <div v-else-if="classes.length" class="classes-container">
        <div class="class-header">
          <div class="class-header-text">
            <h1>My Classes</h1>
            <p>
              Manage your current classes, add new ones, and keep track of your
              students' progress.
            </p>
          </div>
          <button class="add-class-btn" @click="openCreateTeacherClassModal()">
            + Add Class
          </button>
        </div>
        <div class="classes-container">
          <loader v-if="isLoading" />
          <table v-else class="classes-table">
            <tr>
              <th>Subject</th>
              <th>Class</th>
              <th>Students</th>
              <th>Class Code</th>
              <th>Details</th>
            </tr>
            <tr v-for="teacherClass in classes" :key="teacherClass.id">
              <td>
                <img
                  :src="
                    teacherClass.topicId
                      ? formattedTopics[teacherClass.topicId].iconLink
                      : ''
                  "
                  :alt="altImageText"
                  class="subject-icon"
                />
                <span>
                  {{
                    teacherClass.topicId
                      ? formattedTopics[teacherClass.topicId].displayName
                      : 'Other'
                  }}
                </span>
              </td>
              <td>{{ teacherClass.name }}</td>
              <td>{{ teacherClass.totalStudents }}</td>
              <td>
                <button @click="openTeacherCodeModal(teacherClass.code)">
                  <ExternalPage /> View Code
                </button>
              </td>
              <td>
                <button
                  class="view-details-btn"
                  @click="viewDetails(teacherClass)"
                >
                  Class Details <RightArrow />
                </button>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Loader from '@/components/Loader.vue'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import ClassDetails from './ClassDetailsView.vue'
import StudentDetails from './StudentDetailsView.vue'
import ClassImg from '@/assets/class.svg'
import Checklist from '@/assets/Checklist.svg'
import ExternalPage from '@/assets/ExternalPage.svg'
import RightArrow from '@/assets/RightArrow.svg'
import { mapState } from 'vuex'
import { EVENTS } from '@/consts'
import _ from 'lodash'

export default {
  name: 'teacher-dashboard',
  components: {
    Loader,
    ClassDetails,
    StudentDetails,
    ClassImg,
    Checklist,
    ExternalPage,
    RightArrow,
  },

  computed: {
    ...mapState({
      user: (state) => state.user,
      subjects: (state) => state.subjects.subjects,
    }),
  },

  data() {
    return {
      view: null,
      classes: [],
      error: '',
      isLoading: true,
      classId: '',
      topics: [],
      formattedTopics: {},
      studentId: '',
      currentClassInfo: {},
    }
  },
  watch: {
    $route(to) {
      if (to.params.classId && !to.params.studentId) {
        this.classId = to.params.classId
        this.view = 'classDetails'
      } else if (to.params.classId && to.params.studentId) {
        this.classId = to.params.classId
        this.view = 'studentDetails'
      } else {
        this.view = ''
      }
    },
  },

  async created() {
    this.topics = await this.getTopics()
    if (this.$route.params.classId && !this.$route.params.studentId) {
      this.classId = this.$route.params.classId
      if (_.isEmpty(this.currentClassInfo)) {
        this.currentClassInfo = await this.getClassInfo(this.classId)
      }
      this.view = 'classDetails'
    } else if (this.$route.params.studentId) {
      this.studentId = this.$route.params.studentId
      this.classId = this.$route.params.classId
      if (_.isEmpty(this.currentClassInfo)) {
        this.currentClassInfo = await this.getClassInfo(this.classId)
      }
      this.view = 'studentDetails'
    } else {
      this.view = ''
    }

    this.formattedTopics = await this.formatTopics()
    await this.getTeacherClasses()
  },

  methods: {
    async getClassInfo(classId) {
      try {
        const {
          data: { teacherClass },
        } = await NetworkService.getTeacherClassById(classId)
        return teacherClass
      } catch (err) {
        this.error =
          err.response.data.err ??
          'Unable to get class information. Please refresh the page and try again.'
      }
    },

    async getTeacherClasses() {
      this.isLoading = true
      try {
        const {
          data: { teacherClasses },
        } = await NetworkService.getTeacherClasses()
        // TODO: Filter by active vs. not active; Have a tab to switch between the two.
        this.classes = teacherClasses.filter((c) => c.active)
      } catch (err) {
        this.error =
          err.response.data.err ??
          'Unable to load your classes. Please refresh the page and try again.'
      } finally {
        this.isLoading = false
      }
    },

    async getTopics() {
      const {
        data: { topics },
      } = await NetworkService.getTopics()
      return topics
    },

    async formatTopics() {
      const topics = await this.getTopics()
      const allTopics = topics.reduce((topics, topic) => {
        topics[topic.id] = {
          displayName: topic.displayName,
          iconLink: topic.iconLink,
        }
        return topics
      }, {})
      return allTopics
    },

    async createTeacherClass({ className, topicId }) {
      this.isLoading = true
      try {
        const {
          data: { teacherClass },
        } = await NetworkService.createTeacherClass(className, topicId)
        this.classes.push({ ...teacherClass })
      } catch (err) {
        this.error = err.response.data.err ?? 'Unable to create class.'
      } finally {
        this.isLoading = false
      }
    },

    openCreateTeacherClassModal() {
      this.$store.dispatch('app/modal/show', {
        component: 'CreateTeacherClassModal',
        data: {
          createTeacherClass: this.createTeacherClass,
          topics: this.topics,
        },
      })
      AnalyticsService.captureEvent(EVENTS.TEACHER_OPENED_CREATE_CLASS_MODAL)
    },

    openTeacherCodeModal(code) {
      this.$store.dispatch('app/modal/show', {
        component: 'TeacherClassCodeModal',
        data: {
          code,
        },
      })
    },

    viewDetails(teacherClass) {
      this.classId = teacherClass.id
      this.currentClassInfo = teacherClass
      this.currentClassName = teacherClass.name
      this.$router.push(`/dashboard/teacher/class/${teacherClass.id}`)
    },
  },
}
</script>

<style lang="scss" scoped>
.main {
  margin: 24px;
}

.dashboard-banner {
  @include flex-container(columns);
  background-color: #fff;
  border-color: #000;
  border-radius: 8px;
  color: #343440;
  width: 100%;
  padding: 24px;
  width: 100%;
  height: 225px;
  justify-content: left;
  background: linear-gradient(to right, white, rgba(22, 210, 170, 0.1));
}

.dashboard-text {
  align-self: center;
}
.dashboard-text p {
  margin-right: 20px;
}

.dashboard-banner a {
  align-self: flex-start;
  padding-left: 0;
  color: #1855d1;
  font-size: 14px;
}

.dashboard-img {
  height: 100%;
}

.empty-classes-container {
  @include flex-container(column, center, center);
  margin: 24px;
  align-content: center;
  height: 300px;
}

.empty-classes-container p {
  margin: 12px;
  color: #77778b;
  width: 300px;
  font-size: 16px;
}

.empty-classes-container button {
  width: 200px;
}

.classes-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 10px;
  overflow: hidden;
  background-color: white;
  margin-top: 14px;
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
  padding: 18px;
  font-weight: 400;
  font-size: 15px;
}

.classes-table td button {
  color: #1855d1;
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

.get-code-btn {
  border-color: $button-primary-bg;
  padding: 0 12px;
  font-weight: 500;
}

.subject-icon {
  width: 15%;
  margin-right: 10px;
}

.classes-container {
  width: 100%;
  margin: 0 auto;
}

.class-header {
  @include flex-container(row, space-between);
  margin: 30px;
}

.class-header h1 {
  font-size: 24px;
}

.class-header p {
  color: #77778b;
  margin-bottom: 0;
}

.add-class-btn {
  padding: 10px 16px;
  font-size: 16px;
  align-self: center;
  border: 1px solid #1855d1;
  border-radius: 32px;
}
</style>
