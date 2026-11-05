<template>
  <div class="session-list">
    <div v-if="hasError" class="session-list__error">
      <p>Failed to load a list of students. Please try refreshing</p>
    </div>
    <div
      v-if="sortedExclusiveSessions.length"
      class="session-list__exclusive-callout"
      data-testid="exclusive-requests-callout"
    >
      <span class="session-list__exclusive-callout-emoji">🙋</span>
      <span>
        <strong v-if="sortedExclusiveSessions.length === 1"
          >A student has specifically requested your help!</strong
        >
        <strong v-else
          >{{ sortedExclusiveSessions.length }} students have specifically
          requested your help!</strong
        >
      </span>
    </div>
    <table class="table">
      <tr v-if="paginatedSessions.length">
        <th scope="rowgroup">Requests</th>
      </tr>
      <tbody>
        <tr
          v-for="(session, index) in paginatedSessions"
          :key="`session-${index}`"
          :id="session.id"
          :data-testid="`session-row-${session.id}`"
          class="session-row"
          :class="{ 'session-row--exclusive': session.isExclusive }"
          @click="sessionClicked(session)"
        >
          <td>
            <SessionListItem
              :session="{
                ...session,
                waitTime: waitTime(session).displayValue,
                isLongWait: isLongWait(waitTime(session).milliseconds),
                topic: session.type,
                isLocked: !session.isUnlocked,
              }"
            />
          </td>
        </tr>
      </tbody>

      <tfoot v-if="sortedSessions.length">
        <tr>
          <td colspan="3">
            <div class="page-controls">
              <span
                class="page-controls__range"
                data-testid="page-controls-range"
                >{{ pageStart }}–{{ pageEnd }} of
                {{ sortedSessions.length }}</span
              >
              <div class="page-controls__actions">
                <div class="page-controls__size">
                  <label for="page-size-dropdown">Show</label>
                  <FormSelect
                    name="page-size-dropdown"
                    :options="pageSizeOptions"
                    v-model="pageSize"
                    data-testid="page-size-select"
                  />
                </div>
                <div class="page-controls__buttons">
                  <button
                    type="button"
                    class="page-controls__button"
                    aria-label="Previous page"
                    data-testid="prev-page"
                    @click="changePage(currentPage - 1)"
                    :disabled="currentPage === 0"
                  >
                    <IonIcon :icon="chevronBackOutline" />
                  </button>
                  <button
                    type="button"
                    class="page-controls__button"
                    aria-label="Next page"
                    data-testid="next-page"
                    @click="changePage(currentPage + 1)"
                    :disabled="currentPage === totalPages - 1"
                  >
                    <IonIcon :icon="chevronForwardOutline" />
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </tfoot>
    </table>
    <div
      class="no-students-message-container"
      v-if="!sortedSessions?.length"
      data-testid="no-students-waiting-message"
    >
      Currently there are no students waiting for help.
      <div v-if="isVolunteer && !isAmbassador">
        <div
          id="no-students-ambassador-message"
          data-testid="no-students-ambassador-message"
        >
          While you wait, you can still earn volunteer hours by
          <HyperlinkButton
            class="ambassador-button"
            @click="openAmbassadorReferralModal"
            bold
            >becoming an UPchieve Ambassador!</HyperlinkButton
          >
        </div>
      </div>
    </div>
    <AmbassadorReferralModal
      v-if="ambassadorReferralModalIsOpen"
      :closeModal="closeAmbassadorReferralModal"
    />
  </div>
</template>

<script lang="ts" setup>
import { useStore } from 'vuex'
import { quizRoute } from '@/utils/quiz-route'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import SessionService from '@/services/SessionService'
import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import HyperlinkButton from '@/components/HyperlinkButton.vue'
import { getWaitTime } from '@/utils/session'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import { IonIcon } from '@ionic/vue'
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons'
import SessionListItem from '@/views/DashboardView/VolunteerDashboard/ListSessions/SessionListItem.vue'
import { minutesInMs } from '@/utils/time-utils'
const AmbassadorReferralModal = defineAsyncComponent(
  () => import('@/views/AmbassadorReferralModal.vue')
)

const hasError = ref<boolean>(false)
const ambassadorReferralModalIsOpen = ref<boolean>(false)

const store = useStore()
const router = useRouter()

const props = defineProps<{
  showLockedSessions: boolean
  sessionClickOverride?: (session: any) => void
}>()
const emit = defineEmits(['changedPage'])

const isVolunteer = computed(() => store.getters['user/isVolunteer'])
const isAmbassador = computed(() => store.getters['user/isAmbassador'])

const sortByCreatedAt = (first: any, second: any) => {
  if (first.createdAt < second.createdAt) return -1
  if (first.createdAt > second.createdAt) return 1
  return 0
}

const sortedUnlockedSessions = computed(() => {
  const sessions = [...store.getters['volunteer/availableSessions']]
  sessions.sort(sortByCreatedAt)
  sessions.forEach((session: any) => {
    session.isUnlocked = true
  })
  return sessions
})
const sortedLockedSessions = computed(() => {
  const sessions = [...store.getters['volunteer/lockedOpenSessions']]
  sessions.forEach((session: any) => {
    session.isUnlocked = false
  })
  sessions.sort(sortByCreatedAt)
  return sessions
})
const sortedExclusiveSessions = computed(() => {
  const sessions = [...store.getters['volunteer/exclusiveSessions']]
  sessions.forEach((session: any) => {
    session.isUnlocked = true
  })
  sessions.sort(sortByCreatedAt)
  return sessions
})
const isReadyToTutor = computed(() => store.getters['volunteer/isReadyToTutor'])

const sessionClicked = (session) => {
  if (session.isExclusive) {
    AnalyticsService.captureEvent(
      EVENTS.VOLUNTEER_CLICKED_EXCLUSIVE_REQUEST_ROW,
      {
        sessionId: session.id,
        source: 'list-sessions-row',
        subject: session.subTopic,
        topic: session.type,
      }
    )
  }
  if (session.isUnlocked) {
    gotoSession(session)
  } else if (isReadyToTutor.value) {
    goToSubjectCert(session)
  } else if (props.sessionClickOverride) {
    /*
     * this is only reachable by users that also have a student role.
     * it is part of an experiment to better contextualize what being
     * volunteer will like by showing locked sessions while they onboard.
     */
    props.sessionClickOverride(session)
  }
}

const sortedSessions = computed(() => {
  // Exclusive requests pin to the top of the list — these students hand-picked
  // this volunteer specifically, so the prompt should be impossible to miss.
  // Locked sessions go last, and only when the volunteer has chosen to show them.
  if (!props.showLockedSessions) {
    return [...sortedExclusiveSessions.value, ...sortedUnlockedSessions.value]
  }
  return [
    ...sortedExclusiveSessions.value,
    ...sortedUnlockedSessions.value,
    ...sortedLockedSessions.value,
  ]
})

// Pagination logic
const pageSizeOptions = [5, 10, 15]
const pageSize = ref<number>(pageSizeOptions[1])
const currentPage = ref<number>(0)

const totalPages = computed(() =>
  Math.ceil(sortedSessions.value.length / pageSize.value)
)
const pageStart = computed(() => currentPage.value * pageSize.value + 1) // i.e. the 1 "1-10 of 15"
const pageEnd = computed(() =>
  // i.e. the 10 "1-10 of 15"
  Math.min(
    (currentPage.value + 1) * pageSize.value,
    sortedSessions.value.length // Handle partial final page
  )
)

const paginatedSessions = computed(() => {
  const sorted = sortedSessions.value
  const start = currentPage.value * pageSize.value
  return sorted.slice(start, start + pageSize.value)
})

// Clamp page number to [0, totalPages)
// so that it never goes out of range even as the session list changes.
function clampPage(page: number): number {
  return Math.min(Math.max(page, 0), Math.max(totalPages.value - 1, 0))
}
async function changePage(toPage: number) {
  const nextPage = clampPage(toPage)
  currentPage.value = nextPage
  // Wait for the new page's rows to render, then bring the top of the table into view
  await nextTick()
  emit('changedPage')
}
watch(totalPages, () => {
  currentPage.value = clampPage(currentPage.value)
})
// Exclusive sessions are pinned to the top of the first page, so jump there
// when a new one comes in to make sure the volunteer sees it.
watch(
  () => sortedExclusiveSessions.value.map((session) => session.id),
  (newIds, oldIds) => {
    if (newIds.some((id) => !oldIds.includes(id))) {
      currentPage.value = 0
    }
  }
)

function openAmbassadorReferralModal() {
  AnalyticsService.captureEvent(
    EVENTS.AMBASSADOR_NO_STUDENTS_EARN_VOLUNTEER_HOURS_CTA_CLICKED
  )
  ambassadorReferralModalIsOpen.value = true
}

function closeAmbassadorReferralModal() {
  AnalyticsService.captureEvent(EVENTS.REFERRAL_MODAL_CLOSE)
  ambassadorReferralModalIsOpen.value = false
}

function gotoSession(session: any) {
  SessionService.goToSession(session)
}

function goToSubjectCert(session: any) {
  AnalyticsService.captureEvent(EVENTS.LOCKED_SESSIONS_CLICKED_UNLOCK_SUBJECT, {
    subject: session.subTopic,
  })
  const isComputedUnlockSession = store.getters[
    'subjects/isComputedUnlockSubject'
  ](session.subTopic)
  if (isComputedUnlockSession) {
    // These subjects require you to take multiple quizzes to unlock them.
    // Send the user to the Training page
    const route = `/training?openTo=${session.subTopic}`
    router.push(route)
  } else {
    const quizSubject = store.getters['subjects/quizSubjectToUnlock'](
      session.subTopic
    )
    const route = quizRoute(quizSubject)
    router.push(route)
  }
}

const ticks = computed(() => store.state.volunteer.ticks)
function waitTime(args: { createdAt: any }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  ticks.value //This line makes waitTime recalculate as `ticks` changes in the store.
  return getWaitTime(args)
}

function isLongWait(msDuration: number) {
  return msDuration > minutesInMs(3)
}
</script>

<style lang="scss" scoped>
.session-list {
  width: 100%;
  padding: 10px 20px;
  overflow-x: auto;

  &__error {
    color: $c-error-red;
    text-align: center;
  }

  // Highlight strip above the table when one or more students have
  // specifically requested this tutor.
  &__exclusive-callout {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    margin-bottom: 12px;
    background: #fff8e6;
    border: 1px solid #f3c244;
    border-radius: 6px;
    color: #4d3a00;
    font-size: 14px;
  }

  &__exclusive-callout-emoji {
    font-size: 20px;
    line-height: 1;
  }
}

.session-row {
  cursor: pointer;
  &:hover {
    background: lighten($c-information-blue, 50%);
  }

  &--exclusive {
    background: #fff8e6 !important;
    border-left: 3px solid #f3c244;

    &:hover {
      background: darken(#fff8e6, 3%) !important;
    }
  }
}

.session-row td {
  text-align: left;
  padding: 8px 16px;
}

.no-students-message-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;

  .ambassador-button {
    display: inline-flex;
    align-items: center;
  }
}

#no-students-ambassador-message {
  button {
    line-height: 2;
    color: $c-success-green;
  }
}

tfoot td {
  padding: 0;
  border-top: 1px solid $c-border-grey;
}

th {
  @include font-category('heading');
  font-weight: $font-weight-medium;
}

// Range text on the left; page size + prev/next grouped on the right.
.page-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  padding: $spacing-xs $spacing-sm;
  font-size: 14px;
  color: $c-default-grey;

  &__range {
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__size {
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    label {
      margin: 0;
      font-weight: 400;
    }

    // FormSelect is built for full-width forms (w-full, 48px tall, top
    // margin), so shrink it down to a compact inline control here.
    :deep(.uc-form-element) {
      width: auto;
      margin-top: 0;

      label:empty {
        display: none;
      }
    }

    // The popover sizes itself to match the select, so the select needs a
    // fixed width or the options collapse to an unreadable sliver.
    :deep(ion-select) {
      min-height: 32px;
      width: 72px;
      padding: 0 $spacing-xs;
      font-size: 14px;
      border-radius: $radius-sm;
    }
  }

  &__buttons {
    display: flex;
    gap: $spacing-xs;
  }

  &__button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    background: #fff;
    border: 1px solid $border-grey;
    border-radius: $radius-sm;
    color: $c-default-grey;
    cursor: pointer;

    &:hover:not(:disabled) {
      border-color: $button-secondary-border-hover;
    }

    &:disabled {
      color: $c-disabled-grey;
      cursor: not-allowed;
    }
  }
}
</style>
