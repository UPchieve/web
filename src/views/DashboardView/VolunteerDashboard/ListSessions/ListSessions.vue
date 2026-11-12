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
      <TransitionGroup
        tag="tbody"
        name="session-row"
        @before-leave="addClosingClass"
      >
        <tr
          v-for="session in paginatedSessions"
          :key="session.id"
          :id="session.id"
          :data-testid="`session-row-${session.id}`"
          class="session-row"
          :class="{
            'session-row--exclusive': session.isExclusive,
            'session-row--claimed': session.isClaimed,
          }"
          @click="sessionClicked(session)"
        >
          <td>
            <!-- Two wrappers so the row's height can collapse in CSS (see .session-row__content) -->
            <div class="session-row__content">
              <div class="session-row__content-inner">
                <SessionListItem
                  :session="{
                    ...session,
                    waitTime: waitTime(session).displayValue,
                    isLongWait: isLongWait(waitTime(session).milliseconds),
                    topic: session.type,
                    isLocked: !session.isUnlocked,
                  }"
                />
              </div>
            </div>
          </td>
        </tr>
      </TransitionGroup>

      <tfoot v-if="displaySessions.length">
        <tr>
          <td colspan="3">
            <div class="page-controls">
              <span
                class="page-controls__range"
                data-testid="page-controls-range"
                >{{ pageStart }}–{{ pageEnd }} of
                {{ displaySessions.length }}</span
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
      v-if="!displaySessions.length"
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
import {
  computed,
  defineAsyncComponent,
  nextTick,
  ref,
  watch,
  onBeforeUnmount,
} from 'vue'
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
  // The session is already gone; its row is only showing the "Claimed!" badge
  if (session.isClaimed) return
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

// Show a "Claimed!" badge on sessions that got picked up or cancelled before
// taking them out of the list.
// Locked sessions already linger in the store for a minute,
// so they just slide out when the store removes them.
const CLAIMED_BADGE_DURATION_MS = 1000
const claimedSessions = ref<{ session: any; index: number }[]>([])
const claimedTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const openSessionIds = computed(
  () => new Set(store.state.volunteer.allOpenSessions.map((s: any) => s.id))
)

watch(sortedSessions, (newSessions, oldSessions) => {
  const newIds = new Set(newSessions.map((s) => s.id))
  oldSessions.forEach((session, index) => {
    const isClaimedOrCancelled =
      session.isUnlocked && // an available session
      !newIds.has(session.id) && // that went away
      // Still open but hidden (e.g. held for another coach) isn't claimed
      !openSessionIds.value.has(session.id) &&
      !claimedTimeouts.has(session.id)
    if (!isClaimedOrCancelled) return

    claimedSessions.value.push({
      session: { ...session, isClaimed: true },
      index,
    })
    claimedTimeouts.set(
      session.id,
      setTimeout(() => {
        claimedTimeouts.delete(session.id)
        claimedSessions.value = claimedSessions.value.filter(
          (claimed) => claimed.session.id !== session.id
        )
      }, CLAIMED_BADGE_DURATION_MS)
    )
  })
})
onBeforeUnmount(() => {
  claimedTimeouts.forEach((timeout) => clearTimeout(timeout))
})

// The sessions to render: open sessions, plus claimed ones put back where they were
const displaySessions = computed(() => {
  const sessions = [...sortedSessions.value]
  const openIds = new Set(sessions.map((s) => s.id))
  const claimed = [...claimedSessions.value].sort((a, b) => a.index - b.index)
  for (const { session, index } of claimed) {
    if (openIds.has(session.id)) continue
    sessions.splice(Math.min(index, sessions.length), 0, session)
  }
  return sessions
})

function addClosingClass(el: Element) {
  if (!openSessionIds.value.has(el.id)) {
    el.classList.add('session-row--closing')
  }
}

// Pagination logic
const pageSizeOptions = [5, 10, 15]
const pageSize = ref<number>(pageSizeOptions[1])
const currentPage = ref<number>(0)

const totalPages = computed(() =>
  Math.ceil(displaySessions.value.length / pageSize.value)
)
const pageStart = computed(() => currentPage.value * pageSize.value + 1) // i.e. the 1 "1-10 of 15"
const pageEnd = computed(() =>
  // i.e. the 10 "1-10 of 15"
  Math.min(
    (currentPage.value + 1) * pageSize.value,
    displaySessions.value.length // Handle partial final page
  )
)

const paginatedSessions = computed(() => {
  const sessions = displaySessions.value
  const start = currentPage.value * pageSize.value
  return sessions.slice(start, start + pageSize.value)
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
@use 'sass:math';

$row-cell-padding-y: 8px;

.session-list {
  width: 100%;
  padding: 10px 20px;
  overflow-x: auto;
  word-wrap: anywhere;

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
  padding: $row-cell-padding-y 16px;
}

.session-row--claimed {
  cursor: default;
}

// Rows fade in as they appear, e.g. when a row from the next page moves up
.session-row-enter-from {
  opacity: 0;
}
.session-row-enter-active {
  transition: opacity 300ms ease-out;
}

// Exit animation for session rows
$row-slide-out-duration: 450ms;
$row-collapse-duration: 350ms;
$row-exit-duration: $row-slide-out-duration + $row-collapse-duration;
$row-reduced-motion-fade-duration: 800ms;

// The row's height can't animate from `auto`, so the content collapses with
// a one-row grid going from 1fr to 0fr, with the inner wrapper shrinking to fit.
.session-row__content {
  display: grid;
  grid-template-rows: 1fr;
}
.session-row__content-inner {
  min-height: 0;
  overflow: hidden;
}

.session-row--closing.session-row-leave-active {
  animation: session-row-slide-out $row-exit-duration both;
  pointer-events: none;

  td {
    animation: session-row-cell-collapse $row-collapse-duration ease-in-out
      $row-slide-out-duration both;
  }

  .session-row__content {
    animation: session-row-content-collapse $row-collapse-duration ease-in-out
      $row-slide-out-duration both;
  }
}

@keyframes session-row-slide-out {
  0% {
    transform: translateX(0);
    opacity: 1;
    animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45); // ease-in
  }
  // Done sliding once $row-slide-out-duration has passed, then holds
  #{math.percentage(math.div($row-slide-out-duration, $row-exit-duration))},
  100% {
    transform: translateX(40%);
    opacity: 0;
  }
}

@keyframes session-row-cell-collapse {
  from {
    padding-top: $row-cell-padding-y;
    padding-bottom: $row-cell-padding-y;
  }
  to {
    padding-top: 0;
    padding-bottom: 0;
    border-top-width: 0;
  }
}

@keyframes session-row-content-collapse {
  from {
    grid-template-rows: 1fr;
  }
  to {
    grid-template-rows: 0fr;
  }
}

// With reduced motion, a closed row only fades away slowly, and new rows
// appear without fading in
@keyframes session-row-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .session-row-enter-active {
    transition: none;
  }

  .session-row--closing.session-row-leave-active {
    animation: session-row-fade-out $row-reduced-motion-fade-duration ease-out
      both;

    td,
    .session-row__content {
      animation: none;
    }
  }
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
