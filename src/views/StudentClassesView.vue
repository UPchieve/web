<script lang="ts" setup>
import type { AxiosError } from 'axios'
import moment from 'moment'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

import ArrowIcon from '@/assets/arrow.svg'
import BinderIcon from '@/assets/binder-icon.svg'
import CheckIcon from '@/assets/check.svg'
import CrossIcon from '@/assets/cross.svg'
import TaskBadge from '@/assets/task-badge.svg'
import UpdogCrying from '@/assets/updog-crying.svg'
import Loader from '@/components/Loader.vue'
import NetworkService from '@/services/NetworkService'

const $store = useStore()
const $router = useRouter()

const props = defineProps({
  classId: { type: String, required: true },
  assignmentId: { type: String, required: false },
})

type TeacherClass = {
  id: string
  active: boolean
  name: string
  topicId: number
  assignments: Assignment[]
  pastAssignments: Assignment[]
}

export type Assignment = {
  id: string
  classId: string
  description?: string
  dueDate?: Date
  isRequired: boolean
  minDurationInMinutes: number
  numberOfSessions: 1
  startDate?: Date
  submittedAt?: Date
  subjectId: number
  subjectName: string
  title?: string
}

const isLoading = ref<boolean>(true)
const errorMessage = ref<string | undefined>()

const allStudentClasses = ref<TeacherClass[]>([])
const currentClass = ref<TeacherClass | undefined>()
const selectedAssignment = ref<Assignment | undefined>()

const showStudentClassesView = computed(() => !props.assignmentId)
const subjects = computed(() => $store.state.subjects.subjects)

onMounted(async () => {
  isLoading.value = true
  try {
    const [
      {
        data: { classes },
      },
      {
        data: { assignments },
      },
    ] = await Promise.all([
      NetworkService.getStudentClasses(),
      NetworkService.getStudentAssignments(),
    ])

    allStudentClasses.value = getClassesWithAssignments(classes, assignments)
    updateCurrentClassSelected()
  } catch (err) {
    errorMessage.value =
      ((err as AxiosError).response?.data as { err?: string })?.err ??
      'Unknown error'
  } finally {
    isLoading.value = false
  }
})

function getClassesWithAssignments(
  classes: TeacherClass[],
  assignments: Assignment[]
) {
  const classesMap = new Map()
  for (const c of classes) {
    classesMap.set(c.id, { ...c, assignments: [], pastAssignments: [] })
  }
  for (const a of assignments) {
    if (isCurrentAssignment(a)) {
      classesMap.get(a.classId)?.assignments.push(a)
    } else {
      classesMap.get(a.classId)?.pastAssignments.push(a)
    }
  }

  return Array.from(classesMap.values())
}

function isCurrentAssignment(a: Assignment) {
  return moment(a.dueDate).isSameOrAfter(moment()) && !a.submittedAt
}

function updateCurrentClassSelected() {
  if (!allStudentClasses.value.length) return

  if (props.classId) {
    const c = allStudentClasses.value.find((c) => {
      return c.id === props.classId
    })
    if (c) {
      currentClass.value = c
      return
    }
  }

  currentClass.value = allStudentClasses.value[0]
  $router.replace(`/classes/${currentClass.value.id}`)
}

function viewClass(selectedClass: TeacherClass) {
  currentClass.value = selectedClass
  $router.replace(`/classes/${selectedClass.id}`)
}

function hasAnyAssignments(teacherClass?: TeacherClass) {
  if (!teacherClass) return false
  return teacherClass.assignments.length || teacherClass.pastAssignments.length
}

function getAssignmentDueDate(assignment: Assignment) {
  return assignment.dueDate
    ? moment(assignment.dueDate).format('MM/DD/YYYY')
    : 'None'
}

function hadCompletedAssignment(assignment: Assignment) {
  return !!assignment.submittedAt
}

function startSession(assignment: Assignment) {
  if (assignment.subjectName) {
    const topicName = subjects.value[assignment.subjectName].topicName
    $router.push(`/session/${topicName}/${assignment.subjectName}`)
    return
  }

  $router.push('/dashboard')
}

function viewAssignment(assignment: Assignment) {
  selectedAssignment.value = assignment
  $router.push(`/classes/${assignment.classId}/assignments/${assignment.id}`)
}
</script>

<template>
  <div class="h-full">
    <router-view
      :assignment="selectedAssignment"
      :startSession="startSession"
    />
    <div class="uc-column h-full" v-if="showStudentClassesView">
      <div class="header">
        <h1>My Classes</h1>
      </div>

      <div v-if="isLoading" class="uc-row justify-center mt-5">
        <loader></loader>
      </div>

      <div
        v-else-if="errorMessage"
        class="uc-column items-center justify-center h-full"
      >
        <updog-crying />
        <p class="mt-4">
          Oops, something went wrong. Please refresh the page and try again!
        </p>
        <p>Error: {{ errorMessage }}</p>
      </div>

      <div v-else-if="!allStudentClasses.length">
        You don't have any classes yet!
      </div>

      <div v-else class="uc-column h-full">
        <div class="uc-row tabs-container">
          <div
            v-for="(teacherClass, index) in allStudentClasses"
            :key="teacherClass.id"
            class="tabs"
            :class="{
              selected: teacherClass.id === currentClass?.id,
              'first-child': index === 0,
            }"
            @click="viewClass(teacherClass)"
            role="button"
          >
            <h2>{{ teacherClass.name }}</h2>
          </div>
          <div class="divider"></div>
        </div>
        <section>
          <div v-if="hasAnyAssignments(currentClass)">
            <div class="uc-row items-center">
              <binder-icon />
              <h3 class="ml-2">To-dos</h3>
            </div>
            <h4 class="mt-2 mb-4">Upcoming</h4>
            <div
              v-for="assignment in currentClass?.assignments"
              :key="assignment.id"
              class="assignment-card"
            >
              <div class="uc-row items-center">
                <img
                  v-if="assignment.subjectName"
                  :src="subjects[assignment.subjectName].topicIconLink"
                  class="assignment-task-badge"
                  aria-hidden
                />
                <task-badge v-else class="assignment-task-badge" aria-hidden />
                <div class="uc-column ml-3">
                  <a class="title link" @click="viewAssignment(assignment)">{{
                    assignment.title
                  }}</a>
                  <p class="meta-text">
                    Due Date:
                    {{ getAssignmentDueDate(assignment) }}
                  </p>
                </div>
              </div>
              <button class="outlined" @click="startSession(assignment)">
                Start Session <arrow-icon class="icon" />
              </button>
            </div>

            <h4 class="mt-4 mb-2">Past</h4>
            <div
              v-for="assignment in currentClass?.pastAssignments"
              :key="assignment.id"
              class="assignment-card past"
            >
              <div class="uc-row items-center">
                <div
                  class="assignment-badge-past-status"
                  :class="{ completed: hadCompletedAssignment(assignment) }"
                >
                  <check-icon
                    v-if="hadCompletedAssignment(assignment)"
                    class="icon"
                  />
                  <cross-icon v-else class="icon" />
                </div>
                <div class="uc-column ml-3">
                  <p class="title">{{ assignment.title }}</p>
                  <p class="meta-text">
                    Due Date: {{ getAssignmentDueDate(assignment) }}
                  </p>
                </div>
              </div>
              <div
                class="assignment-status-text"
                :class="{ completed: hadCompletedAssignment(assignment) }"
              >
                {{
                  hadCompletedAssignment(assignment)
                    ? 'Completed'
                    : 'Incomplete'
                }}
              </div>
            </div>
          </div>
          <div v-else class="uc-row justify-center">
            You don't have any tasks yet!
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.assignment-badge-past-status svg.icon path {
  fill: white;
}
</style>

<style lang="scss" scoped>
$padding-horizontal: 45px;

h1 {
  font-size: 24px;
  margin-bottom: 0;
}

.header {
  padding: 30px $padding-horizontal;
}

h2 {
  font-size: 20px;
  font-weight: 400;
  margin-bottom: 0;
}

.tabs-container {
  overflow-x: scroll;
  position: relative;
}

.tabs {
  padding: 12px 24px;

  &.selected {
    border-bottom: 4px solid #61ceac;
  }

  &.first-child {
    margin-left: $padding-horizontal;
  }
}

.divider {
  background-color: #d8dee5;
  bottom: 0;
  height: 4px;
  position: absolute;
  width: 100%;
  z-index: -1;
}

section {
  background-color: white;
  height: 100%;
  padding: 30px $padding-horizontal;
}

h3 {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 0;
}

h4 {
  color: #565961;
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 0;
}

.assignment-card {
  @include flex-container(row, space-between, center);
  background-color: white;
  border: 1px solid #d8dee5;
  border-radius: 9px;
  padding: 20px 24px;

  &.past {
    background: #f1f3f6;
  }

  .title {
    color: #343440;
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 0;

    &.link:hover {
      color: $c-information-blue;
      cursor: pointer;
      text-decoration: underline;
    }
  }

  .meta-text {
    color: #343440;
    font-size: 14px;
    margin-bottom: 0;
  }
}

button.outlined {
  background-color: white;
  border-radius: 20px;
  border: 1px solid $c-information-blue;
  color: $c-information-blue;
  padding: 10px 30px;

  .icon {
    fill: currentColor;
    height: 16px;
    width: 16px;
  }

  &:hover {
    background-color: lighten($c-information-blue, 50%);
  }
}

.assignment-task-badge {
  height: 45px;
  width: 45px;
}

.assignment-badge-past-status {
  @include flex-container(row, center, center);
  background-color: #abb2bd;
  border-radius: 50%;
  height: 40px;
  padding: 4px;
  width: 40px;

  &.completed {
    background-color: #16d2aa;
  }

  .icon {
    height: 60%;
  }
}

.assignment-status-text {
  color: #666f7d;
  font-size: 20px;
  font-weight: 600;
  padding-right: 70px;

  &.completed {
    color: #16d2aa;
  }
}
</style>
