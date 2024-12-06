<script lang="ts" setup>
import type { AxiosError } from 'axios'
import moment from 'moment'
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'

import type { Assignment } from './StudentClassesView.vue'
import ArrowIcon from '@/assets/arrow.svg'
import CalendarIcon from '@/assets/calendar.svg'
import TaskBadge from '@/assets/task-badge.svg'
import UpdogCrying from '@/assets/updog-crying.svg'
import Loader from '@/components/Loader.vue'
import NetworkService from '@/services/NetworkService'

const $store = useStore()

const props = defineProps({
  assignmentId: { type: String, required: true },
  assignment: { type: Object, required: false },
  goBack: { type: Function, required: false },
  startSession: { type: Function, required: false },
})

const isLoading = ref<boolean>(false)
const errorMessage = ref<string | undefined>()

const currentAssignment = ref<Assignment | undefined>(
  props.assignment as Assignment
)
const subjects = computed(() => $store.state.subjects.subjects)

onMounted(async () => {
  if (!props.assignment) {
    isLoading.value = true

    try {
      const {
        data: { assignment },
      } = await NetworkService.getAssignmentById(props.assignmentId)
      currentAssignment.value = assignment
    } catch (err) {
      errorMessage.value =
        ((err as AxiosError).response?.data as { err?: string })?.err ??
        'Unknown error'
    } finally {
      isLoading.value = false
    }
  }
})

function formatDate(date?: Date) {
  if (date) {
    return moment(date).format('MM/DD/YYYY')
  }
  return 'None'
}

function getAssignmentTutoringDetails(assignment: Assignment) {
  const details = []
  if (assignment.numberOfSessions) {
    details.push(
      `${assignment.numberOfSessions} session${assignment.numberOfSessions !== 1 ? 's' : ''}`
    )
  }

  if (assignment.minDurationInMinutes) {
    details.push(`${assignment.minDurationInMinutes} minutes per session`)
  }

  if (assignment.subjectName) {
    const subjectDisplayName =
      subjects.value[assignment.subjectName].displayName
    details.push(`completed in ${subjectDisplayName}`)
  } else {
    details.push('completed in any subject')
  }

  return details.join(', ')
}
</script>

<template>
  <div>
    <div
      v-if="props.goBack"
      class="back mb-5"
      role="button"
      @click="props.goBack()"
    >
      <arrow-icon class="back-arrow" />
      Back to All Assignmentss
    </div>
    <div v-if="isLoading" class="uc-row justify-center">
      <loader />
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
    <div v-else-if="currentAssignment" class="uc-row w-full">
      <img
        v-if="currentAssignment.subjectName"
        :src="subjects[currentAssignment.subjectName].topicIconLink"
        class="assignment-task-badge"
        aria-hidden
      />
      <task-badge v-else class="assignment-task-badge" aria-hidden />

      <div class="uc-column w-full ml-3">
        <h1>{{ currentAssignment.title }}</h1>
        <div class="uc-row mt-4 items-center justify-start">
          <calendar-icon class="cal-icon mr-2" />
          <span class="light-bold mr-1">Start Date:</span>
          {{ formatDate(currentAssignment.startDate) }}
          <span class="light-bold ml-2 mr-1">Due Date:</span>
          {{ formatDate(currentAssignment.dueDate) }}
        </div>
        <div class="mt-2 mb-2">
          <span class="light-bold mr-1">Tutoring Session:</span>
          {{ getAssignmentTutoringDetails(currentAssignment) }}
        </div>
        <div class="line-divider"></div>
        <div class="uc-column mt-3">
          <p class="bold">Instructions:</p>
          {{ currentAssignment.description }}
        </div>
        <button
          class="uc-form-button mt-5"
          v-if="props.startSession"
          @click="props.startSession(currentAssignment)"
        >
          Start your session
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.back {
  color: $c-information-blue;

  .back-arrow {
    fill: $c-information-blue;
    transform: rotate(180deg);
  }
}

.cal-icon {
  height: 20px;
  width: 20px;
}

h1 {
  font-size: 28px;
  font-weight: 500;
  margin-bottom: 0;
}

.assignment-task-badge {
  height: 40px;
  width: 40px;
}

p {
  margin-bottom: 0;
}

.line-divider {
  background-color: #d9d9d9;
  height: 1px;
  width: 100%;
}

.uc-form-button {
  padding: 12px 24px 12px 24px;
  width: fit-content;
}
</style>
