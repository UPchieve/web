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
          <button @click="openCreateTeacherClassModal()">+ Add Class</button>
        </div>
        <div class="classes-container" data-testid="classes-container">
          <loader v-if="isLoading" />
          <div
            v-for="teacherClass in classes"
            :key="teacherClass.id"
            class="teacher-class-card"
            @click="viewDetails(teacherClass)"
            :data-testid="`class-details-${teacherClass.id}`"
          >
            <div class="subject-icon-container">
              <img
                v-if="teacherClass.topicId"
                :src="topicIdToTopic[teacherClass.topicId].iconLink"
                :alt="altImageText"
                class="subject-icon relative"
                aria-hidden
              />
              <task-badge v-else class="subject-icon" aria-hidden />
              <clever-logo v-if="teacherClass.cleverId" class="clever-logo" />
            </div>
            <div class="uc-column justify-center flex-2 ml-4 mr-4">
              <div class="uc-row">
                <span class="class-name">{{ teacherClass.name }}</span>
                <span class="class-topic">{{
                  teacherClass.topicId
                    ? topicIdToTopic[teacherClass.topicId].displayName
                    : 'Other'
                }}</span>

                <a
                  v-if="!teacherClass.cleverId"
                  @click.stop="openTeacherCodeModal(teacherClass.code)"
                  class="class-code-link"
                >
                  <ExternalPage /> View Code
                </a>
              </div>
              <span class="class-num-students">
                {{ teacherClass.totalStudents || 0 }} Student{{
                  teacherClass.totalStudents !== 1 ? 's' : ''
                }}
              </span>
            </div>
            <button @click.stop="openCreateAssignmentModal(teacherClass)">
              Assign Tutoring
            </button>
          </div>
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
import CleverLogo from '@/assets/clever_logo.svg'
import ExternalPage from '@/assets/ExternalPage.svg'
import TaskBadge from '@/assets/task-badge.svg'
import OnboardingModal from '@/components/OnboardingModal.vue'
import TeacherOnboarding_Frame1 from '@/assets/teacher_onboarding_frames/TeacherOnboarding_Frame1.svg'
import TeacherOnboarding_Frame2 from '@/assets/teacher_onboarding_frames/TeacherOnboarding_Frame2.svg'
import TeacherOnboarding_Frame3 from '@/assets/teacher_onboarding_frames/TeacherOnboarding_Frame3.svg'
import TeacherOnboarding_Frame4 from '@/assets/teacher_onboarding_frames/TeacherOnboarding_Frame4.svg'
import { mapState, mapGetters } from 'vuex'
import { toastController } from '@ionic/vue'
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
    CleverLogo,
    ExternalPage,
    TaskBadge,
    OnboardingModal,
  },

  computed: {
    ...mapGetters({
      topicIdToTopic: 'subjects/topicIdToTopic',
    }),
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
    async showToast(message, isError) {
      const toast = await toastController.create({
        message,
        color: isError ? 'danger' : 'dark',
        duration: 2000,
        position: 'bottom',
      })
      await toast.present()
    },

    async getClassInfo(classId) {
      try {
        const {
          data: { teacherClass },
        } = await NetworkService.getTeacherClassById(classId)
        return teacherClass
      } catch (err) {
        const error =
          err?.response?.data?.err ??
          'Unable to get class information. Please refresh the page and try again.'
        this.showToast(error, true)
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
        const error =
          err?.response?.data?.err ??
          'Unable to load your classes. Please refresh the page and try again.'
        this.showToast(error, true)
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
        const error = err?.response?.data?.err ?? 'Unable to create class.'
        this.showToast(error, true)
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

    openCreateAssignmentModal(teacherClass) {
      AnalyticsService.captureEvent(EVENTS.ASSIGNMENT_OPEN_CREATE_MODAL)
      this.$store.dispatch('app/modal/show', {
        component: 'CreateAndEditAssignmentModal',
        data: {
          onAssignmentCreated: this.handleAssignmentCreated,
          classes: this.classes,
          currentClass: teacherClass,
          topics: this.topics,
        },
      })
    },

    // TODO: Move to service method.
    async handleAssignmentCreated({
      assignmentData,
      selectedClasses,
      selectedStudents,
    }) {
      try {
        const classIds = selectedClasses.map(
          (selectedClass) => selectedClass.id
        )
        const studentIds =
          selectedStudents.length > 0
            ? selectedStudents.map((selectedStudent) => selectedStudent.id)
            : []
        await Promise.all(
          classIds.map(async (classId) => {
            const assignmentInfo = { classId, ...assignmentData, studentIds }
            const {
              data: { assignment },
            } = await NetworkService.createAssignment(assignmentInfo)
            return { ...assignment, studentIds }
          })
        )
        this.showToast('Assignment created.')
      } catch (err) {
        const error = err?.response?.data?.err ?? 'Unable to create assignment.'
        this.showToast(error, true)
      }
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
  background-color: #fbfbfc;
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

.classes-container {
  margin: 0 auto;
  overflow-x: scroll;
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

.teacher-class-card {
  @include flex-container(row, start, space-between);
  background: #fff;
  border-radius: 9px;
  border: 1px solid $border-grey;
  color: $c-soft-black;
  min-width: 680px;
  margin-bottom: 15px;
  padding: 24px;

  &:hover {
    background-color: $c-background-blue;
    border-color: $c-information-blue;
    cursor: pointer;
  }

  .subject-icon-container {
    position: relative;
  }

  .subject-icon {
    height: 65px;
    width: 65px;
  }

  .class-name {
    font-size: 22px;
    font-weight: 600;
  }

  .class-topic {
    font-size: 20px;
    margin-left: 28px;
  }

  .class-code-link {
    color: $c-information-blue;
    cursor: pointer;
    font-size: 18px;
    margin-left: 28px;

    &:hover {
      text-decoration: underline;
    }
  }

  .class-num-students {
    font-size: 16px;
    font-weight: 500;
    margin-top: 4px;
  }

  button {
    align-self: center;
    background: $c-information-blue;
    border-radius: 20px;
    color: white;
    padding: 12px 20px;
  }

  .clever-logo {
    bottom: -4px;
    position: absolute;
    right: -4px;
    width: 22px;
  }
}
</style>
