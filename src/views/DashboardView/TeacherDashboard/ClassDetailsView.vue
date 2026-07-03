<template>
  <div class="class-details-view" ref="classDetails">
    <router-view v-if="isChildRoute" />
    <div v-else class="main">
      <div class="class-header">
        <div class="class-info">
          <div class="start-col">
            <div class="subject-icon-container">
              <img
                v-if="classData.topicId"
                :src="topicIdToTopic[classData.topicId]?.iconLink"
                :alt="altImageText"
                class="subject-icon"
                aria-hidden
              />
              <task-badge v-else class="subject-icon" aria-hidden />
              <clever-logo v-if="classData.cleverId" class="clever-logo" />
            </div>
            <h1>{{ classData.name }}</h1>
            <span class="students-text"
              >{{ classData.totalStudents || '0' }}
              {{ classData.totalStudents == 1 ? 'student' : 'students' }}</span
            >
            <button
              type="button"
              v-if="!classData.cleverId"
              class="open-teacher-code-modal"
              @click="openTeacherCodeModal"
            >
              <LinkUnion /><span class="class-code-text">Class Code</span>
            </button>
          </div>
          <div class="end-col">
            <button
              type="button"
              class="edit-class-btn"
              @click="openEditClassModal()"
            >
              <Pencil class="pencil" /> Edit Class
            </button>
            <button
              type="button"
              class="create-assignment-btn"
              @click="openCreateAssignmentModal()"
            >
              Assign Tutoring
            </button>
          </div>
        </div>
      </div>
      <div class="tabs">
        <p
          class="tabs__header-type"
          :class="isSelected === 'students-tab' ? 'is-selected' : null"
          @click="openTab('students-tab')"
          data-testid="students-tab"
          role="button"
        >
          Students
        </p>
        <p
          class="tabs__header-type"
          :class="isSelected === 'assignments-tab' ? 'is-selected' : null"
          @click="openTab('assignments-tab')"
          data-testid="assignments-tab"
          role="button"
        >
          Assignments
        </p>
      </div>
      <div v-if="isSelected === 'students-tab'" class="classes-container">
        <loader v-if="isLoading" />
        <div v-else-if="!students.length">
          <div v-if="classData.cleverId" class="empty-sessions-container">
            <p>We can't seem to find any students in your Clever class</p>
            <p class="sub-text">
              If this is a mistake, try Clever Resync or reach out to your
              partnership manager.
            </p>
          </div>
          <div v-else class="empty-sessions-container">
            <Checklist />
            <p data-testid="no-students-msg" class="sub-text">
              You currently don't have any students in this class. Click here to
              share the code with your students!
            </p>
            <button
              type="button"
              v-if="!classData.cleverId"
              class="uc-form-button"
              @click="openTeacherCodeModal"
            >
              Get Code
            </button>
          </div>
        </div>
        <div v-else class="class-details">
          <div class="filter-controls">
            <FormSelect
              v-if="topics.length"
              class="topics-dropdown"
              name="topic"
              label="Subject"
              :placeholder="subjectPlaceholder"
              optionTextField="displayName"
              :reduce="(option) => option.name"
              :options="[
                ...topics,
                { name: 'other', displayName: 'All Subjects' },
              ]"
              v-model="filters.topic.name"
            />
            <FormDateInput
              class="date-input"
              label="Sessions From"
              id="session-activity-from"
              :placeholder="filters.sessionActivityFrom"
              v-model="filters.sessionActivityFrom"
            />
            <FormDateInput
              class="date-input"
              label="To"
              id="session-activity-to"
              :placeholder="filters.sessionActivityTo"
              v-model="filters.sessionActivityTo"
            />
          </div>
          <table class="classes-table">
            <tr>
              <th>Student</th>
              <th># of Sessions</th>
              <th>Time Tutored</th>
              <th>Last Session</th>
              <th>Details</th>
              <th></th>
              <th v-if="!classData.cleverId"></th>
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
                  type="button"
                  class="view-details-btn"
                  @click="viewStudentDetails(student)"
                  :data-testid="`view-details-btn-${student.id}`"
                >
                  View Details
                </button>
              </td>
              <td v-if="!classData.cleverId">
                <div class="menu-button">
                  <button
                    type="button"
                    @click="openStudentMenu(student)"
                    class="student-menu-btns"
                  >
                    <MenuButtonsIcon class="menu-btns" />
                  </button>
                </div>
                <div
                  class="student-menu"
                  v-if="toggledStudentMenuId === student.id"
                >
                  <button type="button" @click="removeStudent(student.id)">
                    <p><RemoveIcon /> Remove from class</p>
                  </button>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
      <div
        v-else
        :class="
          !assignments.length
            ? 'assignments-container-empty'
            : 'assignments-container'
        "
      >
        <div
          data-testid="no-assignments"
          v-if="!assignments.length"
          class="empty-assignments-container"
        >
          <h1>No Assignments Yet!</h1>
          <p>
            Create an assignment to kickstart your students' learning journey.
          </p>
          <button
            type="button"
            class="create-assignment-btn"
            @click="openCreateAssignmentModal()"
          >
            Assign Tutoring
          </button>
        </div>
        <div v-else class="assignments-cards" data-testid="has-assignments">
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
                <div class="assignment-heading">
                  <button
                    type="button"
                    class="assignment-info-btn"
                    @click="viewAssignment(assignment.id)"
                  >
                    <h1 :data-testid="'assignment-title-' + assignment.id">
                      {{ assignment.title }}
                    </h1>
                  </button>
                  <button
                    type="button"
                    class="assignment-menu-btns"
                    @click="toggleAssignmentMenu(assignment.id)"
                  >
                    <VerticalMenuButtonsIcon class="menu-btns" />
                  </button>
                  <div
                    v-if="toggledAssignmentMenuId === assignment.id"
                    class="assignment-menu"
                  >
                    <button
                      type="button"
                      @click="
                        openRemoveAssignmentConfirmationModal(assignment.id)
                      "
                    >
                      <div class="assignment-menu-item">
                        <TrashIcon class="trash-icon" />
                        <span class="delete-btn">Delete</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      @click="openEditAssignmentModal(assignment)"
                    >
                      <div class="assignment-menu-item">
                        <Pencil class="pencil-icon" />
                        <span>Edit</span>
                      </div>
                    </button>
                  </div>
                </div>
                <p
                  :data-testid="'assignment-due-date-' + assignment.id"
                  class="due-date-text"
                >
                  Due date: {{ formatTimestamp(assignment.dueDate) }}
                </p>
                <div v-if="!assignmentsCompletion[assignment.id]">
                  <p
                    data-testid="no-students-assigned"
                    class="no-students-assigned"
                  >
                    No students have been assigned.
                  </p>
                </div>
                <button
                  type="button"
                  v-else
                  class="student-completion"
                  @click="toggleStudentCompletion(assignment.id)"
                  data-testid="student-completion"
                >
                  Student completion
                  {{
                    assignmentsCompletion[assignment.id].completedStudents
                  }}/{{ assignmentsCompletion[assignment.id].totalStudents }}
                </button>
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
import { computed } from 'vue'
import { mapState, mapGetters } from 'vuex'
import Loader from '@/components/Loader.vue'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import ModalService from '@/services/ModalService'
import LinkUnion from '@/assets/LinkUnion.svg'
import Checklist from '@/assets/Checklist.svg'
import Check from '@/assets/check.svg'
import CleverLogo from '@/components/CleverLogo.vue'
import AssignmentIcon from '@/assets/AssignmentIcon.svg'
import Pencil from '@/assets/pencil.svg'
import { dayjs, secondsInMs } from '@/utils/time-utils'
import { EVENTS } from '@/consts'
import MenuButtonsIcon from '@/assets/Menu.svg'
import VerticalMenuButtonsIcon from '@/assets/VerticalMenuButtons.svg'
import TrashIcon from '@/assets/trash.svg'
import RemoveIcon from '@/assets/Remove.svg'
import { toastController } from '@ionic/vue'
import FormDateInput from '@/components/FormInputs/FormDateInput.vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import {
  getCurrentSchoolYearStartDate,
  minutesToHoursAndMinutes,
} from '@/utils/time-utils'

export default {
  name: 'ClassDetails',

  provide() {
    return {
      classData: computed(() => this.classData),
      assignmentsCompletion: computed(() => this.assignmentsCompletion),
    }
  },

  components: {
    Loader,
    LinkUnion,
    Checklist,
    AssignmentIcon,
    Check,
    CleverLogo,
    Pencil,
    MenuButtonsIcon,
    VerticalMenuButtonsIcon,
    RemoveIcon,
    TrashIcon,
    FormDateInput,
    FormSelect,
  },

  data() {
    return {
      isLoading: true,
      unfilteredStudents: [],
      viewSessions: false,
      student: {},
      studentId: '',
      assignments: [],
      toggledAssignmentId: '',
      assignmentsCompletion: {},
      classes: [],
      className: '',
      topicId: '',
      toggledStudentMenuId: '',
      toggledAssignmentMenuId: '',
      classData: {},
      filters: {
        topic: {
          name: '',
        },
        sessionActivityFrom:
          getCurrentSchoolYearStartDate().format('YYYY-MM-DD'),
        sessionActivityTo: dayjs().format('YYYY-MM-DD'),
      },
    }
  },

  mounted() {
    this.$refs.classDetails.addEventListener('click', this.closeMenu)
  },

  beforeUnmount() {
    this.$refs.classDetails.removeEventListener('click', this.closeMenu)
  },

  async created() {
    try {
      this.isLoading = true
      this.classData = await this.getClassInfo(this.classId)
      this.className = this.classData.name
      this.topicId = this.classData.topicId

      // TODO: Pass teacher classes from parent view instead.
      const {
        data: { teacherClasses },
      } = await NetworkService.getTeacherClasses()
      this.classes = teacherClasses.filter((c) => !c.deactivatedOn)

      await this.$store.dispatch('subjects/awaitTopics')
      if (this.classData.topicId) {
        const topic = this.topics.find((t) => t.id === this.classData.topicId)
        this.filters.topic.name = topic.name
        this.subjectPlaceholder = topic.displayName
      } else {
        this.filters.topic.name = 'other'
        this.subjectPlaceholder = 'All Subjects'
      }

      await Promise.all([this.getClassStudents(), this.showAssignments()])
    } catch {
      this.showToast(
        'Something went wrong. Please refresh the page and try again.',
        true
      )
    } finally {
      this.isLoading = false
    }
  },

  computed: {
    students() {
      const from = new Date(this.filters.sessionActivityFrom + 'T00:00:00Z')
      const to = new Date(this.filters.sessionActivityTo + 'T23:59:59')
      const filteredSubjectNames = Object.values(this.subjects)
        .filter((subject) =>
          this.filters.topic.name === 'other'
            ? true
            : subject.topicName === this.filters.topic.name
        )
        .map((subject) => subject.name)

      return this.unfilteredStudents
        .map((student) => {
          const filteredSessionDetails = student.sessionDetails.filter(
            (session) =>
              filteredSubjectNames.includes(session.name) &&
              session.startedAt >= from &&
              session.startedAt <= to
          )
          const minTutored = filteredSessionDetails.reduce(
            (acc, curr) => acc + (curr.endedAt - curr.startedAt) / (1000 * 60),
            0
          )

          const timeTutored = minutesToHoursAndMinutes(
            minTutored,
            ({ hours, minutes }) => {
              return hours > 0
                ? `${hours} hr and ${Math.round(minutes)} m`
                : `${Math.round(minutes)} minutes`
            }
          )

          const lastSessionDate = filteredSessionDetails.sort(
            (a, b) => b.endedAt - a.endedAt
          )[0]?.endedAt
          const lastSession = lastSessionDate
            ? dayjs(lastSessionDate).format('MM/DD/YYYY')
            : 'Has not completed a session.'

          return {
            ...student,
            numSessions: filteredSessionDetails.length,
            timeTutored,
            lastSession,
          }
        })
        .sort((a, b) => {
          if (a.lastSession === 'Has not completed a session.') return 1
          if (b.lastSession === 'Has not completed a session.') return -1

          const dateA = dayjs(a.lastSession, 'MM/DD/YYYY')
          const dateB = dayjs(b.lastSession, 'MM/DD/YYYY')

          return dateB.diff(dateA)
        })
    },
    classId() {
      return this.$route.params.classId
    },
    isSelected() {
      return this.$route.name === 'ClassDetailsView'
        ? 'students-tab'
        : 'assignments-tab'
    },
    isChildRoute() {
      return (
        this.$route.name === 'StudentDetailsView' ||
        this.$route.name === 'AssignmentView'
      )
    },
    ...mapState({
      topics: (state) => state.subjects.topics,
      subjects: (state) => state.subjects.subjects,
    }),
    ...mapGetters({
      topicIdToTopic: 'subjects/topicIdToTopic',
    }),
  },

  methods: {
    async uploadFiles(assignmentIds, files) {
      const responses = await Promise.allSettled(
        assignmentIds.map((assignmentId) =>
          NetworkService.uploadFiles({ assignmentId, files })
        )
      )
      const failed = responses.filter(
        (r) => !!r.reason?.response?.data?.moderationFailures
      )
      if (failed.length) {
        await this.handleAssignmentAttachmentModerationFailure(
          failed[0].reason.response.data.moderationFailures
        )
      }
    },
    async handleAssignmentInfoModerationFailure(failures, assignmentTitle) {
      const moderationIssues = failures.map((issueKey) => {
        return issueKey.replace('_', ' ')
      })
      await this.showToast(
        `The assignment "${assignmentTitle}" could not be edited due to a safety policy violation in the content. Please review your assignment content for: ${moderationIssues}`,
        true
      )
    },
    async handleAssignmentAttachmentModerationFailure(fileNameToFailuresMap) {
      const fileName = Object.keys(fileNameToFailuresMap)[0]
      const moderationIssues = fileNameToFailuresMap[fileName].map(
        (issueKey) => {
          return issueKey.replace('_', ' ')
        }
      )
      await this.showToast(
        `The files could not be attached to the assignment due to a safety policy violation in the content of file "${fileName}" - Please review your file content for: ${moderationIssues}`,
        true
      )
    },
    async showToast(message, isError) {
      const toast = await toastController.create({
        message,
        color: isError ? 'danger' : 'dark',
        duration: secondsInMs(5),
        position: 'bottom',
      })
      await toast.present()
    },

    formatTimestamp(timestamp) {
      const date = dayjs(timestamp)
      return date.format('MM/DD/YYYY')
    },

    closeMenu(event) {
      if (
        !event.target.classList.contains('menu-btns') &&
        (this.toggledStudentMenuId || this.toggledAssignmentMenuId)
      ) {
        this.toggledStudentMenuId = null
        this.toggledAssignmentMenuId = null
      }
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

    async getClassStudents() {
      try {
        const {
          data: { students },
        } = await NetworkService.getStudentsInTeacherClass(this.classId)
        this.unfilteredStudents = await Promise.all(
          students.map(async (student) => {
            const {
              data: { sessionDetails },
            } = await NetworkService.getStudentSessionDetails(student.id)

            return {
              ...student,
              sessionDetails: sessionDetails.map((session) => ({
                name: session.name,
                startedAt: new Date(session.createdAt),
                endedAt: new Date(session.endedAt),
              })),
            }
          })
        )
      } catch (err) {
        // TODO: There is no place where this error (and others) is shown.
        this.error =
          err.response.data.err ??
          'Unable to load students. Please refresh the page and try again.'
      }
    },

    openTeacherCodeModal() {
      const code = this.classData.code
      this.$store.dispatch('app/modal/show', {
        component: 'TeacherClassCodeModal',
        data: {
          code,
        },
      })
    },

    openEditClassModal() {
      this.$store.dispatch('app/modal/show', {
        component: 'EditTeacherClassModal',
        data: {
          classInfo: this.classData,
          topics: this.topics,
          updateTeacherClass: this.updateTeacherClass,
          deactivateTeacherClass: this.deactivateTeacherClass,
        },
      })
    },

    openCreateAssignmentModal() {
      AnalyticsService.captureEvent(EVENTS.ASSIGNMENT_OPEN_CREATE_MODAL)
      this.$store.dispatch('app/modal/show', {
        component: 'CreateAndEditAssignmentModal',
        data: {
          onAssignmentCreated: this.handleAssignmentCreated,
          classes: this.classes,
          currentClass: this.classData,
          topics: this.topics,
        },
      })
    },

    openEditAssignmentModal(assignment) {
      AnalyticsService.captureEvent(EVENTS.TEACHER_CLICKED_EDIT_ASSIGNMENT, {
        isGettingStartedAssignment: assignment.isGettingStartedAssignment,
      })
      this.$store.dispatch('app/modal/show', {
        component: 'CreateAndEditAssignmentModal',
        data: {
          onAssignmentEdited: this.handleEditAssignment,
          classes: this.classes,
          currentClass: this.classData,
          topics: this.topics,
          assignment: assignment,
        },
      })
    },

    openRemoveAssignmentConfirmationModal(assignmentId) {
      this.$store.dispatch('app/modal/show', {
        component: 'RemoveAssignmentConfirmationModal',
        data: {
          showTemplateButtons: false,
          deleteAssignment: this.deleteAssignment,
          assignmentId,
        },
      })
      this.toggledAssignmentMenuId = ''
    },

    async handleAssignmentCreated({
      assignmentData,
      selectedClasses,
      selectedStudents,
      files,
    }) {
      try {
        const classIds = selectedClasses.map(
          (selectedClass) => selectedClass.id
        )
        const studentIds =
          selectedStudents.length > 0
            ? selectedStudents.map((selectedStudent) => selectedStudent.id)
            : []
        let assignments = []
        try {
          assignments = await Promise.all(
            classIds.map(async (classId) => {
              const assignmentInfo = { classId, ...assignmentData, studentIds }
              const response =
                await NetworkService.createAssignment(assignmentInfo)
              const assignment = response.data?.assignment
              return { ...assignment, studentIds }
            })
          )
        } catch (err) {
          if (err.response?.data?.moderationFailures) {
            await this.handleAssignmentInfoModerationFailure(
              err.response?.data.moderationFailures,
              assignmentData.title
            )
            return
          }
        }
        const selectedClassAssignment = assignments.find(
          (a) => a.classId === this.$route.params.classId
        )
        if (selectedClassAssignment) {
          this.assignments.push(selectedClassAssignment)
        }
        const assignmentIds = assignments.map((assignment) => assignment.id)
        const studentAssignments = this.mapStudentAssignments(assignmentIds)

        this.assignmentsCompletion = this.getAssignmentCompletion(
          this.assignments,
          studentAssignments
        )

        if (files.length) {
          await this.uploadFiles(assignmentIds, files)
        }
      } catch (err) {
        this.error = err.response.data.err ?? 'Unable to create assignment.'
      }
    },

    async mapStudentAssignments(assignmentIds) {
      const assignments = await this.getStudentAssignments(assignmentIds)
      return Object.fromEntries(
        assignments.map((a) => [a.assignmentId, a.studentAssignments])
      )
    },

    async handleEditAssignment({
      assignmentData,
      studentsToAdd,
      studentsToRemove,
      selectedStudents,
      files,
    }) {
      try {
        const response = await NetworkService.editAssignment({
          ...assignmentData,
          studentsToAdd: studentsToAdd,
          studentsToRemove: studentsToRemove,
        })

        //Changes the assignment info in the UI
        const updatedAssignments = this.assignments.map((assnmt) =>
          assnmt.id === response.assignment.id
            ? { ...response.assignment, studentIds: selectedStudents }
            : assnmt
        )
        this.assignments = updatedAssignments
        const assignmentIds = updatedAssignments.map(
          (assignment) => assignment.id
        )
        const getStudentAssignments = await this.mapStudentAssignments([
          response.assignment.id,
        ])

        this.assignmentsCompletion[response.assignment.id] =
          this.getSingleAssignmentCompletion(
            response.assignment.id,
            getStudentAssignments
          )

        if (files.length) {
          assignmentIds.forEach(async (assignmentId) => {
            await NetworkService.uploadFiles({ assignmentId, files })
          })
        }
      } catch (err) {
        if (err.response.data?.moderationFailures) {
          await this.handleAssignmentInfoModerationFailure(
            err.response?.data.moderationFailures,
            assignmentData.title
          )
          return
        }
        this.error = err.response.data.err ?? 'Unable to edit assignment.'
      }
    },

    viewStudentDetails(student) {
      this.studentId = student.id
      this.$router.push(
        `/dashboard/teacher/class/${this.classData.id}/student/${student.id}`
      )
    },

    openStudentMenu(student) {
      if (this.toggledStudentMenuId === student.id) {
        this.toggledStudentMenuId = null
      } else {
        this.toggledStudentMenuId = student.id
      }
    },

    async showAssignments() {
      this.assignments = await this.getClassAssignments()
      const assignmentIds = this.assignments.map((assignment) => assignment.id)

      const getStudentAssignments =
        await this.mapStudentAssignments(assignmentIds)
      this.assignmentsCompletion = this.getAssignmentCompletion(
        this.assignments,
        getStudentAssignments
      )
    },

    async openTab(tabTo) {
      if (tabTo === 'students-tab') {
        this.$router.push(`/dashboard/teacher/class/${this.classData.id}`)
      } else if (tabTo === 'assignments-tab') {
        this.$router.push(
          `/dashboard/teacher/class/${this.classData.id}/assignments`
        )
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
        `/dashboard/teacher/class/${this.classData.id}/assignments/${assignmentId}`
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

    toggleAssignmentMenu(assignmentId) {
      if (this.toggledAssignmentMenuId === assignmentId) {
        this.toggledAssignmentMenuId = null
      } else {
        this.toggledAssignmentMenuId = assignmentId
      }
    },

    getAssignmentCompletion(assignments, completionData) {
      const result = {}

      assignments.forEach((assignment) => {
        const completion = this.getSingleAssignmentCompletion(
          assignment.id,
          completionData
        )
        if (completion) {
          result[assignment.id] = completion
        }
      })

      return result
    },

    getSingleAssignmentCompletion(assignmentId, completionData) {
      const studentsCompletion = completionData[assignmentId] || null

      if (studentsCompletion && studentsCompletion.length > 0) {
        const totalStudents = studentsCompletion.length
        const completedStudents = studentsCompletion.filter(
          (student) => !!student.submittedAt
        ).length

        return {
          studentsCompletion,
          totalStudents,
          completedStudents,
        }
      }

      return null // Return null if there are no students or no completion data
    },

    async updateTeacherClass(classData) {
      try {
        const {
          data: { updatedClass },
        } = await NetworkService.updateTeacherClass(classData)
        this.classData = updatedClass
      } catch (err) {
        this.error = err.response.data.err ?? 'Unable to edit class.'
      }
    },

    async deactivateTeacherClass(classId) {
      try {
        await NetworkService.deactivateTeacherClass(classId)
        this.$router.push('/dashboard')
      } catch (err) {
        this.error = err.response.data.err ?? 'Unable to deactivate class.'
      }
    },

    async removeStudent(studentId) {
      try {
        const {
          data: { removedId },
        } = await NetworkService.removeStudentFromClass({
          studentId,
          classId: this.classData.id,
        })
        if (!removedId) {
          ModalService.showAlert(
            'Error',
            'This student was unable to be removed from class.'
          )
        }
        this.toggledStudentMenuId = ''
        this.unfilteredStudents = this.unfilteredStudents.filter(
          (student) => student.userId !== removedId[0].studentid
        )
      } catch (err) {
        this.error =
          err.response.data.err ?? 'Unable to remove student from class.'
      }
    },

    async deleteAssignment(assignmentId) {
      try {
        await NetworkService.deleteAssignment(assignmentId)
        this.toggledAssignmentMenuId = ''
        this.assignments = this.assignments.filter(
          (assignment) => assignment.id !== assignmentId
        )
      } catch (err) {
        this.error =
          err.response.data.err ?? 'Unable to remove assignment from class.'
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.main {
  @include flex-container(column, center);
  flex-grow: 1;
}

.class-details-view {
  padding: 0;
  height: 100%;
}

.class-details {
  width: 100%;
}

.filter-controls {
  @include flex-container(row, center, flex-start);
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
  width: fit-content;

  @include breakpoint-below('medium') {
    @include flex-container(column, center);
  }
}

.topics-dropdown {
  background-color: #ffffff;
  border-radius: 5px;
  margin: 0px;
  min-width: 200px;
}

.date-input {
  margin: 0px;
}

.empty-sessions-container {
  @include flex-container(column, center, center);
  height: 300px;

  p {
    color: $c-soft-black;
    font-size: 24px;
    font-weight: 600;
    margin: 0;
    text-align: center;

    &.sub-text {
      font-size: 16px;
      margin: 12px;
      color: $c-secondary-grey;
      font-weight: 400;
      width: 400px;
    }
  }

  button {
    width: 200px;
  }
}

.class-code-text {
  margin-left: 5px;
  color: $c-information-blue;
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

.end-col {
  @include flex-container(row, right, center);
  gap: 16px;
}

.edit-class-btn {
  @include flex-container(row, center, center);
  background-color: #ffffff;
  gap: 6px;
  border-radius: 24px;
  padding: 10px 12px;
  border: $c-border-grey 1px solid;
  color: $c-soft-black;
  max-height: 44px;
  font-weight: 500;
}

.pencil {
  height: 100%;
  padding: 6px;
}
.create-assignment-btn {
  background-color: $c-information-blue;
  border-radius: 24px;
  padding: 10px 16px;
  color: #ffffff;
  font-size: 16px;
}

.open-teacher-code-modal {
  font-size: 15px;
  color: $c-information-blue;
}

.students-text {
  color: #666f7d;
}

.classes-container {
  margin-top: 16px;
  flex-grow: 1;
  @include flex-container(column, center, center);
}

.classes-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 10px;
  overflow: hidden;
  background-color: #ffffff;

  th {
    background-color: #e3f2fd;
    padding: 8px 12px;
    font-size: 16px;
    font-weight: 500;
  }

  tr {
    text-align: left;
  }

  td {
    padding: 12px 8px;
    font-weight: 400;
    font-size: 14px;
  }
}

.view-details-btn {
  font-size: 14px;
  color: $c-information-blue;
  font-weight: 500;
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
  min-height: 40vh;
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
  margin-bottom: 16px;
}

.assignment-card {
  @include flex-container(row, flex-start, flex-start);
  padding: 12px 8px;
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  background-color: #ffffff;
  margin-bottom: 16px;

  @include breakpoint-below('medium') {
    width: 80%;
  }

  @include breakpoint-above('medium') {
    width: 350px;
  }

  .assignment-icon {
    margin: 0 8px;
  }

  .assignment-info {
    @include flex-container(column, flex-start, flex-start);
    overflow: hidden;
    flex-grow: 1;

    h1 {
      font-size: 18px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      width: 250px;
      text-align: left;

      @include breakpoint-below('medium') {
        width: 120px;
      }
    }

    due-date-text,
    .no-students-assigned {
      font-size: 16px;
      margin: 8px 0 0;
    }

    .student-completion,
    .no-students-assigned {
      padding-left: 0;
      margin-top: 1.25rem;
      color: $c-information-blue;
      font-weight: 500;
      text-align: left;
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

.menu-button {
  @include flex-container(column, center, center);
  width: 30px;
  height: 30px;
}

.menu-button:hover {
  border-radius: 100%;
  background-color: $c-background-grey;
}

.student-menu {
  @include flex-container(column, center, center);
  border: 1px solid $c-border-grey;
  border-radius: 6px;
  padding: 8px;
  position: absolute;
  right: 7%;
  width: auto;
  z-index: 3;
  background-color: #fff;

  p {
    margin-bottom: 0;
  }
}

.assignment-heading {
  @include flex-container(row, space-between, center);
  width: 100%;
}

.assignment-menu-btns {
  text-align: right;
}

.assignment-info-btn {
  padding: 0;
}

.assignment-menu {
  @include flex-container(column, center, flex-start);
  border-radius: 4px;
  padding: 16px;
  position: absolute;
  left: 90%;
  top: 30%;
  width: 160px;
  z-index: 10;
  background-color: #fff;
  gap: 10px;
  box-shadow: 0px 8px 20px 4px rgba(0, 0, 0, 0.12);
}

.assignment-menu-item {
  @include flex-container(row, flex-start, center);
  gap: 10px;

  .delete-btn {
    color: red;
  }

  .trash-icon {
    fill: red;
    height: 20px;
    width: auto;
  }

  .pencil-icon {
    height: 20px;
    width: auto;
  }
}

.subject-icon-container {
  position: relative;
}
.subject-icon {
  height: 40px;
  margin-right: 12px;
  width: 40px;
}

.clever-logo {
  bottom: -4px;
  position: absolute;
  right: 4px;
  width: 20px;
}
</style>
