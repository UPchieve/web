<script lang="ts" setup>
import { reactive, ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { debounce } from 'lodash-es'
import UnreadFilterChip from '@/components/UnreadFilterChip.vue'
import SearchInput from '@/components/SearchInput.vue'
import SortDropdown from '@/components/SortDropdown.vue'
import {
  DEFAULT_PERSON_SORT,
  PERSON_SORT_OPTIONS,
  sortPeople,
  parsePersonSortQuery,
  type PersonSort,
} from '@/utils/person-sort'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import CaretIcon from '@/assets/caret.svg'
import StudentIcon from '@/assets/user_avatars/student-icon.svg'
import Loader from '@/components/Loader.vue'
import LargeButton from '@/components/LargeButton.vue'
import ActivityDot from '@/components/ActivityDot.vue'
import DirectMessagePanel from '@/components/DirectMessagePanel.vue'
import PersonCard, { type LastSession } from '@/components/PersonCard.vue'
import { minutesInMs } from '@/utils/time-utils'
import type { PastStudent } from '@/types/volunteers'
import MessageIcon from '@/assets/message-circle.svg'
import { vTooltip } from 'maz-ui'

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
const isDirectMessagesEnabled = computed(
  () => store.getters['featureFlags/isDirectMessagesEnabled']
)
const unreadDirectMessageSenderIds = computed<string[]>(
  () => store.getters['user/unreadDirectMessageSenderIds']
)

function hasUnreadMessages(student: Student) {
  return unreadDirectMessageSenderIds.value.includes(student.studentId)
}

function messageButtonLabel(student: Student) {
  return hasUnreadMessages(student)
    ? `Message ${student.firstName}, new message`
    : `Message ${student.firstName}`
}

function messagingUnavailableText(student: Student) {
  if (student.directMessageUnavailableReason === 'UNAVAILABLE')
    return "You can't message this student right now."
  return `${student.firstName} can't receive direct messages yet. You can message them from your session recap page.`
}

const allStudents = ref<Student[]>([])
const filteredStudents = ref<Student[]>([])
const students = ref<Student[]>([])
const filters = reactive({
  search: '',
  unreadOnly: false,
  sort: DEFAULT_PERSON_SORT as PersonSort,
})
const isFetchingStudents = ref(true)
const error = ref('')
const page = ref(1)
const isLastPage = ref(false)
const studentLimitPerPage = 5

const isFirstPage = computed(() => page.value === 1)
const total = computed(() => filteredStudents.value.length)

const isUnreadFilterActive = computed(
  () => isDirectMessagesEnabled.value && filters.unreadOnly
)
const hasActiveFilters = computed(
  () => filters.search.trim() !== '' || isUnreadFilterActive.value
)

function passesSearch(student: Student) {
  const search = filters.search.trim().toLowerCase()
  return !search || student.firstName.toLowerCase().includes(search)
}

function passesUnreadFilter(student: Student) {
  return !isUnreadFilterActive.value || hasUnreadMessages(student)
}

const unreadCount = computed(
  () => allStudents.value.filter(passesSearch).filter(hasUnreadMessages).length
)

function setCurrentPageFromQuery(query: typeof $route.query) {
  page.value = parseInt(query.page as string) || 1
  filters.search = typeof query.search === 'string' ? query.search : ''
  filters.unreadOnly = query.unreadOnly === 'true'
  filters.sort = parsePersonSortQuery(query.sort)
}

function applyFilter() {
  filteredStudents.value = allStudents.value
    .filter((student) => passesSearch(student) && passesUnreadFilter(student))
    .sort(sortPeople(filters.sort))
}

async function fetchStudents() {
  isFetchingStudents.value = true
  try {
    const { pastStudents } = await NetworkService.getPastStudents()
    allStudents.value = pastStudents.map((student) => ({
      ...student,
      lastSession: toLastSession(student),
    }))

    applyFilter()
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
    Math.ceil(filteredStudents.value.length / studentLimitPerPage)
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

  isLastPage.value = end >= filteredStudents.value.length
  students.value = filteredStudents.value.slice(start, end)
}

function buildQuery(query: {
  page?: number
  search?: string
  unreadOnly?: boolean
  sort?: PersonSort
}) {
  const search = query.search ?? filters.search
  const unreadOnly = query.unreadOnly ?? filters.unreadOnly
  const sort = query.sort ?? filters.sort
  return {
    page: query.page ?? page.value,
    ...(search.trim() ? { search } : {}),
    ...(unreadOnly ? { unreadOnly: 'true' } : {}),
    ...(sort !== DEFAULT_PERSON_SORT ? { sort } : {}),
  }
}

//Create a new browser history entry and use as the source of truth for navigating
//using the back button. Steps back through pages and filter changes.
function navigateTo(query: Parameters<typeof buildQuery>[0]) {
  $router.push({ query: buildQuery(query) }).catch(() => {})
}

function goToNextPage() {
  if (isLastPage.value) return
  navigateTo({ page: page.value + 1 })
}

function goToPreviousPage() {
  if (isFirstPage.value) return
  navigateTo({ page: page.value - 1 })
}

const syncSearchToUrl = debounce(() => {
  $router.replace({ query: buildQuery({ page: 1 }) }).catch(() => {})
}, 300)

function setSearch(value: string) {
  filters.search = value
  page.value = 1
  applyFilter()
  paginate()
  syncSearchToUrl()
}

function toggleUnreadFilter({ value }: { value: boolean }) {
  navigateTo({ page: 1, unreadOnly: value })
}

function setSort(value: PersonSort) {
  navigateTo({ page: 1, sort: value })
}

function clearFilters() {
  syncSearchToUrl.cancel()
  navigateTo({ page: 1, search: '', unreadOnly: false, sort: filters.sort })
}

const activeConversation = ref<Student | null>(null)

function openConversation(student: Student) {
  if (!isDirectMessagesEnabled.value || !student.canDirectMessage) return
  activeConversation.value = student
}

function closeConversation() {
  activeConversation.value = null
}

// Watch the URL as the source of truth for the current page
// so the back button goes back on step instead of to the previous view
watch(
  () => $route.query,
  (query) => {
    setCurrentPageFromQuery(query)
    applyFilter()
    paginate()
  }
)

watch(unreadDirectMessageSenderIds, () => {
  applyFilter()
  paginate()
})

onMounted(async () => {
  setCurrentPageFromQuery($route.query)
  await fetchStudents()
})

onUnmounted(() => {
  syncSearchToUrl.cancel()
})
</script>

<template>
  <div class="container">
    <section class="header">
      <h1 class="title">Messages</h1>
      <div class="header__row">
        <p class="subtitle">Students you've worked with before.</p>
        <div class="filters" data-testid="student-filters">
          <SearchInput
            :model-value="filters.search"
            @update:model-value="setSearch"
          />
          <UnreadFilterChip
            v-if="isDirectMessagesEnabled"
            :value="filters.unreadOnly"
            :count="unreadCount"
            @change="toggleUnreadFilter"
          />
          <SortDropdown
            :model-value="filters.sort"
            :options="PERSON_SORT_OPTIONS"
            aria-label="Sort students"
            @update:model-value="setSort"
          />
        </div>
      </div>
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
        >
          <template v-if="isDirectMessagesEnabled" #actions>
            <span
              v-if="!student.canDirectMessage"
              class="message-button-tooltip"
              data-testid="message-button-tooltip"
              v-tooltip="{
                text: messagingUnavailableText(student),
                color: 'black',
                position: 'top',
              }"
            >
              <LargeButton
                class="message-button"
                data-testid="message-button"
                :aria-label="messagingUnavailableText(student)"
                :disabled="true"
                :show-arrow="false"
                variant="outlined"
              >
                <span class="message-button__icon">
                  <MessageIcon aria-hidden="true" />
                  <ActivityDot
                    v-if="hasUnreadMessages(student)"
                    class="message-button__unread-dot"
                    data-testid="unread-message-dot"
                    aria-hidden="true"
                  />
                </span>
              </LargeButton>
            </span>
            <LargeButton
              v-else
              class="message-button"
              data-testid="message-button"
              :aria-label="messageButtonLabel(student)"
              @click="openConversation(student)"
              :show-arrow="false"
              variant="outlined"
            >
              <span class="message-button__icon">
                <MessageIcon aria-hidden="true" />
                <ActivityDot
                  v-if="hasUnreadMessages(student)"
                  class="message-button__unread-dot"
                  data-testid="unread-message-dot"
                  aria-hidden="true"
                />
              </span>
            </LargeButton>
          </template>
        </PersonCard>
      </template>
      <div
        v-else-if="hasActiveFilters && allStudents.length > 0"
        class="students__no-students"
        data-testid="no-matching-students"
      >
        <student-icon class="student-icon" />
        <h2 class="secondary-header">No students match these filters.</h2>
        <button
          type="button"
          class="clear-filters-button"
          data-testid="clear-filters-button"
          @click="clearFilters"
        >
          Clear filters
        </button>
      </div>
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
    <DirectMessagePanel
      v-if="activeConversation"
      :partner-id="activeConversation.studentId"
      :partner-name="activeConversation.firstName"
      partner-type="student"
      @close="closeConversation"
    />
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
  margin-bottom: 1.5em;

  &__row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1em;

    @include breakpoint-above('large') {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
}

.title {
  @include font-category('display-small');
  margin-bottom: 0.5em;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;

  @include breakpoint-above('large') {
    justify-content: flex-end;
  }
}

.clear-filters-button {
  margin-top: 1em;
  padding: 0;
  border: none;
  background: transparent;
  color: $c-information-blue;
  font: inherit;
  cursor: pointer;
}

.subtitle {
  @include font-category('body');
  color: $c-secondary-grey;
  margin-bottom: 0;
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

.message-button-tooltip {
  display: inline-flex;
  font-size: 12px;
}

.message-button {
  border-width: 2px;
  border-radius: 24px;
  height: 40px;

  :deep(.ButtonTemplate-content) {
    overflow: visible;
  }

  &__icon {
    position: relative;
    display: inline-flex;
    width: 20px;
    height: 20px;
  }

  &__unread-dot {
    position: absolute;
    top: -3px;
    right: -4px;
    width: 12px;
    height: 12px;
    background-color: $c-warning-orange;
  }
}
</style>
