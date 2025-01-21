<template>
  <div class="teacher-dashboard">
    <ClassDetails
      v-if="this.view === 'classDetails'"
      :classInfo="currentClassInfo"
      :classId="classId"
      :classes="classes"
      :topics="topics"
    />
    <StudentDetails
      v-else-if="this.view === 'studentDetails'"
      :classInfo="currentClassInfo"
      :className="currentClassInfo.name"
      :topics="topics"
    />
    <Assignment v-else-if="this.view === 'assignment'" />
    <div v-else>
      <div class="dashboard-banner">
        <div>
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
            >Demo Video: How UPchieve Works for Students</a
          >
        </div>
        <ClassImg class="dashboard-img" />
      </div>
      <!-- TODO: Add error message on error. -->
      <div v-if="isLoading" class="uc-row justify-center mt-5">
        <loader></loader>
      </div>
      <div v-else-if="!classes.length" class="empty-classes-container">
        <Checklist />
        <p class="center" data-testid="empty-classes-msg">
          Providing extra help is about to get easier. Click here to get
          started!
        </p>
        <button class="uc-form-button" @click="openCreateTeacherClassModal">
          Add Class
        </button>
      </div>
      <div v-else-if="classes.length" class="classes-container">
        <div class="class-header">
          <div>
            <h1>My Classes</h1>
            <p>
              Manage your current classes, add new ones, and keep track of your
              students' progress.
            </p>
          </div>
          <button @click="openCreateTeacherClassModal()">
            + Add Class
          </button>
        </div>
        <div class="classes-container" data-testid="classes-container">
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
                      ? topicIdToTopic[teacherClass.topicId].iconLink
                      : ''
                  "
                  :alt="altImageText"
                  class="subject-icon"
                />
                <span>
                  {{
                    teacherClass.topicId
                      ? topicIdToTopic[teacherClass.topicId].displayName
                      : 'Other'
                  }}
                </span>
              </td>
              <td>{{ teacherClass.name }}</td>
              <td>{{ teacherClass.totalStudents || '0' }}</td>
              <td>
                <button @click="openTeacherCodeModal(teacherClass.code)">
                  <ExternalPage /> View Code
                </button>
              </td>
              <td>
                <button
                  class="view-details-btn"
                  @click="viewDetails(teacherClass)"
                  :data-testid="`class-details-btn-${teacherClass.id}`"
                >
                  Class Details <RightArrow />
                </button>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <onboarding-modal
      v-if="isFirstDashboardVisit"
      :closeModal="() => $store.dispatch('user/firstDashboardVisit', false)"
      :pages="pages"
    />
  </div>
</template>

<script>
import Loader from '@/components/Loader.vue'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import ClassDetails from './ClassDetailsView.vue'
import StudentDetails from './StudentDetailsView.vue'
import Assignment from './AssignmentView.vue'
import ClassImg from '@/assets/class.svg'
import Checklist from '@/assets/Checklist.svg'
import ExternalPage from '@/assets/ExternalPage.svg'
import RightArrow from '@/assets/RightArrow.svg'
import OnboardingModal from '@/components/OnboardingModal.vue'
import TeacherOnboarding_Frame1 from '@/assets/teacher_onboarding_frames/TeacherOnboarding_Frame1.svg'
import TeacherOnboarding_Frame2 from '@/assets/teacher_onboarding_frames/TeacherOnboarding_Frame2.svg'
import TeacherOnboarding_Frame3 from '@/assets/teacher_onboarding_frames/TeacherOnboarding_Frame3.svg'
import TeacherOnboarding_Frame4 from '@/assets/teacher_onboarding_frames/TeacherOnboarding_Frame4.svg'
import { mapState, mapGetters } from 'vuex'
import { EVENTS } from '@/consts'
import _ from 'lodash'

export default {
  name: 'teacher-dashboard',
  components: {
    Loader,
    ClassDetails,
    StudentDetails,
    Assignment,
    ClassImg,
    Checklist,
    ExternalPage,
    RightArrow,
    OnboardingModal,
  },

  computed: {
    ...mapState({
      user: (state) => state.user,
      subjects: (state) => state.subjects.subjects,
      topics: (state) => state.subjects.topics,
      isFirstDashboardVisit: (state) => state.user.isFirstDashboardVisit,
    }),
    ...mapGetters({
      topicIdToTopic: 'subjects/topicIdToTopic',
    }),
  },

  data() {
    return {
      view: null,
      classes: [],
      error: '',
      isLoading: true,
      classId: '',
      studentId: '',
      currentClassInfo: {},
      showOnboardingModal: false,
      pages: [],
    }
  },
  watch: {
    $route(to) {
      if (
        to.params.classId &&
        !to.params.studentId &&
        !to.params.assignmentId
      ) {
        this.classId = to.params.classId
        this.view = 'classDetails'
      } else if (to.params.classId && to.params.studentId) {
        this.classId = to.params.classId
        this.view = 'studentDetails'
      } else if (to.params.classId && to.params.assignmentId) {
        this.view = 'assignment'
      } else {
        this.view = ''
      }
    },
  },

  async created() {
    this.pages = [
      {
        step: 1,
        heading:
          'Give your students unlimited access to live tutors & college counselors',
        text: 'Caring human beings are standing by, ready to help your students 24/7—especially when they need it most: late at night and in their homes',
        image: TeacherOnboarding_Frame1,
      },
      {
        step: 2,
        heading: 'Academic help in 30+ subjects',
        text: 'In under 5-10 mins your students get expert help completing assignments, filling learning gaps, and building confidence',
        image: TeacherOnboarding_Frame2,
      },
      {
        step: 3,
        heading: 'Connect tutoring to classwork',
        text: 'Assign tutoring sessions, complete with links and instructions, to tell students (and their tutors) exactly what to get help with',
        image: TeacherOnboarding_Frame3,
      },
      {
        step: 4,
        heading: 'Track & report on student usage',
        text: `See how your students are using the platform with "Class Details" and "Student Details"`,
        image: TeacherOnboarding_Frame4,
      },
    ]
    // TODO: Clean-up routing.
    if (
      this.$route.params.classId &&
      !this.$route.params.studentId &&
      !this.$route.params.assignmentId
    ) {
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
    } else if (this.$route.params.assignmentId) {
      this.view = 'assignment'
    } else {
      this.view = ''
    }

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
        this.classes = teacherClasses.filter((c) => !c.deactivatedOn)
      } catch (err) {
        this.error =
          err.response.data.err ??
          'Unable to load your classes. Please refresh the page and try again.'
      } finally {
        this.isLoading = false
      }
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
.teacher-dashboard {
  padding: 30px;
  height: 100%;
}

.dashboard-banner {
  @include flex-container(row, space-between, center);
  background: linear-gradient(to right, white, rgba(22, 210, 170, 0.1));
  border-radius: 8px;
  color: #343440;
  padding: 28px;
  width: 100%;

  @include breakpoint-below('small') {
    @include flex-container(column, center, center);
  }

  p {
    margin-right: 20px;
  }

  a {
    color: #1855d1;
    font-size: 16px;
    font-weight: 500;
  }

  .dashboard-img {
    height: 100%;

    @include breakpoint-below('small') {
      margin-top: 24px;
    }
  }
}

.empty-classes-container {
  @include flex-container(column, center, center);
  margin: 50px;

  p {
    color: #77778b;
    font-size: 16px;
    margin: 12px;
    width: 300px;
  }

  button {
    width: 200px;
  }
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
  margin: 0 auto;
  padding-bottom: 16px;
  width: 100%;
}

.class-header {
  @include flex-container(row, space-between);
  margin: 30px 16px;

  h1 {
    font-size: 24px;
  }

  p {
    color: #77778b;
    margin-bottom: 0;
  }

  button {
    align-self: center;
    border: 1px solid #1855d1;
    border-radius: 32px;
    font-size: 16px;
    padding: 10px 16px;
  }
}
</style>
