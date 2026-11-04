<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import CaretIcon from '@/assets/caret.svg'
import StudentIcon from '@/assets/user_avatars/student-icon.svg'
import Loader from '@/components/Loader.vue'
import PersonCard, { type LastSession } from '@/components/PersonCard.vue'
import { minutesInMs } from '@/utils/time-utils'
import type { PastStudent } from '@/types/volunteers'

interface Student extends PastStudent {
  lastSession: LastSession
}

function toLastSession(student: PastStudent): LastSession {
  return {
    subject: student.subjectDisplayName,
    date: student.createdAt,
    durationMinutes: student.timeTutored / minutesInMs(1),
  }
}

const $route = useRoute()
const $router = useRouter()
const store = useStore()

const mobileMode = computed(() => store.getters['app/mobileMode'])

const allStudents = ref<Student[]>([])
const students = ref<Student[]>([])
const isFetchingStudents = ref(true)
const error = ref('')
const page = ref(1)
const isLastPage = ref(false)
const studentLimitPerPage = 5

const isFirstPage = computed(() => page.value === 1)
const total = computed(() => allStudents.value.length)

function setCurrentPageFromQuery(query: typeof $route.query) {
  page.value = parseInt(query.page as string) || 1
}

async function fetchStudents() {
  isFetchingStudents.value = true
  try {
    const { pastStudents } = await NetworkService.getPastStudents()
    allStudents.value = pastStudents.map((student) => ({
      ...student,
      lastSession: toLastSession(student),
    }))

    paginate()
  } catch (err) {
    LoggerService.noticeError(err)
    error.value =
      'We were unable to load your students. Please try again later.'
  } finally {
    isFetchingStudents.value = false
  }
}

function paginate() {
  const maxPage = Math.max(
    1,
    Math.ceil(allStudents.value.length / studentLimitPerPage)
  )
  if (page.value > maxPage) {
    page.value = maxPage
    if (parseInt($route.query.page as string) !== page.value) {
      $router
        .replace({ query: { ...$route.query, page: page.value } })
        .catch(() => {})
    }
  }

  const start = (page.value - 1) * studentLimitPerPage
  const end = page.value * studentLimitPerPage

  isLastPage.value = end >= allStudents.value.length
  students.value = allStudents.value.slice(start, end)
}

//Create a new browser history entry and use as the source of truth for navigating
//using the back button.
function navigateTo(newPage: number) {
  $router.push({ query: { page: newPage } }).catch(() => {})
}

function goToNextPage() {
  if (isLastPage.value) return
  navigateTo(page.value + 1)
}

function goToPreviousPage() {
  if (isFirstPage.value) return
  navigateTo(page.value - 1)
}

// Watch the URL as the source of truth for the current page
// so the back button goes back on step instead of to the previous view
watch(
  () => $route.query,
  (query) => {
    setCurrentPageFromQuery(query)
    paginate()
  }
)

onMounted(async () => {
  setCurrentPageFromQuery($route.query)
  await fetchStudents()
})
</script>

<template>
  <div class="container">
    <section class="header">
      <h1 class="title">Messages</h1>
      <p class="subtitle">Students you've worked with before.</p>
    </section>

    <section class="students">
      <div v-if="error" class="info">
        {{ error }}
      </div>
      <loader
        v-else-if="isFetchingStudents"
        message="Retrieving your students"
        class="students-loader"
      />
      <template v-else-if="total > 0">
        <PersonCard
          v-for="student in students"
          :key="student.studentId"
          class="student-card"
          type="student"
          :user-id="student.studentId"
          :name="student.firstName"
          :last-session="student.lastSession"
        />
      </template>
      <div v-else class="students__no-students">
        <student-icon class="student-icon" />
        <h2 class="secondary-header">You haven't had any students yet!</h2>
        <p class="students__no-students-description">
          Once you've had a tutoring session, your students will show up here.
        </p>
      </div>
    </section>
    <div class="page-actions" v-if="total > 0">
      <button
        type="button"
        @click="goToPreviousPage"
        :class="{ 'page-actions__stepper--disabled': isFirstPage }"
        class="page-actions__stepper"
        :disabled="isFirstPage"
      >
        <caret-icon class="caret caret--previous" /><span v-if="!mobileMode"
          >Previous</span
        >
      </button>
      <div class="page-numbers">
        <span class="page-num page-num--active">
          {{ page }}
        </span>
      </div>
      <button
        type="button"
        @click="goToNextPage"
        :class="{ 'page-actions__stepper--disabled': isLastPage }"
        class="page-actions__stepper"
        :disabled="isLastPage"
      >
        <span v-if="!mobileMode">Next</span
        ><caret-icon class="caret caret--next" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  padding: 1em;

  @include breakpoint-above('large') {
    padding: 2.5em;
  }
}

.header {
  text-align: left;
  margin-bottom: 2em;
}

.title {
  @include font-category('display-small');
  margin-bottom: 1em;
}

.subtitle {
  @include font-category('body');
  color: $c-secondary-grey;
}

.secondary-header {
  font-size: 1.4rem;
}

.info {
  @include flex-container(row, center, center);
  font-weight: 500;
  font-size: 22px;
  margin: 3rem 1rem 0 1rem;
  text-align: center;
}

.students-loader {
  margin: 3rem 0;
  @include flex-container(column, center, center);
}

.students {
  &__no-students {
    @include flex-container(column, normal, center);
    margin: 4em 2em 2em;
    min-height: 60vh;
  }

  &__no-students-description {
    text-align: center;
  }
}

.student-icon {
  height: 40px;
  width: 40px;
}

.student-card {
  margin: 4px 0;
}
.page-actions {
  @include flex-container(row, space-around);
  padding: 1em 0;

  @include breakpoint-above('large') {
    justify-content: flex-end;
  }

  &__stepper {
    display: flex;
    align-items: center;

    margin-right: 1em;
    color: $c-information-blue;
    background: transparent;
    border: none;
    padding: 0;
    font: inherit;

    & .caret path {
      fill: $c-information-blue;
    }

    &:hover {
      cursor: pointer;
    }

    @include breakpoint-above('medium') {
      margin-right: 2em;
    }

    &--disabled {
      color: $c-disabled-grey;

      &:hover {
        cursor: default;
      }

      & .caret path {
        fill: $c-disabled-grey;
      }
    }
  }
}

.page-numbers {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.page-num {
  margin-right: 1em;

  @include breakpoint-above('medium') {
    margin-right: 2em;
  }

  &--active {
    color: $c-information-blue;
  }
}

.caret {
  &--previous {
    transform: rotate(90deg);
    margin-right: 0.4em;
  }

  &--next {
    transform: rotate(-90deg);
    margin-left: 0.4em;
  }
}
</style>
