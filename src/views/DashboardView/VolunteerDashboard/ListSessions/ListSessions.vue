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
    <table class="table table-striped">
      <tr>
        <th scope="col">Student</th>
        <th scope="col">Help Topic</th>
        <th scope="col">Wait Time</th>
      </tr>
      <tbody>
        <tr
          v-for="(session, index) in sortedSessions"
          :key="`session-${index}`"
          :id="session.id"
          :data-testid="`session-row-${session.id}`"
          class="session-row"
          :class="{ 'session-row--exclusive': session.isExclusive }"
          @click="sessionClicked(session)"
        >
          <td>
            <span
              v-if="session.isExclusive"
              class="session-row__eyebrow"
              data-testid="exclusive-eyebrow"
              >Specifically Requested You</span
            >
            <span v-if="session.isExclusive" class="exclusive-emoji">🙋</span>
            <!--            Anonymize first name of student for locked sessions only-->
            {{
              session.isUnlocked
                ? (session.student?.firstname ?? 'Student')
                : 'Student'
            }}
            <span
              v-if="session.student?.isShadowBanned && user.isAdmin"
              class="shadow-ban"
              >Shadow Banned</span
            >
          </td>
          <td :data-testid="`subject-${session.id}`">
            {{ session.isUnlocked ? '' : '🔒' }}{{ session.subjectDisplayName }}
          </td>
          <td :data-testid="`wait-time-${session.id}`">
            {{ waitTime(session) }}
          </td>
        </tr>
      </tbody>
    </table>
    <div
      class="no-students-message-container"
      v-if="!sortedSessions?.length"
      data-testid="no-students-waiting-message"
    >
      Currently there are no students waiting for help.
      <div
        v-if="isBecomeAnAmbassadorCtaEnabled && isVolunteer && !isAmbassador"
      >
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
import Case from 'case'
import { quizRoute } from '@/utils/quiz-route'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import { computed, defineAsyncComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import HyperlinkButton from '@/components/HyperlinkButton.vue'
const AmbassadorReferralModal = defineAsyncComponent(
  () => import('@/views/AmbassadorReferralModal.vue')
)

const hasError = ref<boolean>(false)
const ambassadorReferralModalIsOpen = ref<boolean>(false)
const MAX_AVAILABLE_SECTIONS = 5

const store = useStore()
const router = useRouter()

const props = defineProps<{
  showLockedSessions: boolean
  sessionClickOverride?: (session: any) => void
}>()

const user = computed(() => store.state.user.user)
const isBecomeAnAmbassadorCtaEnabled = computed(
  () => store.getters['featureFlags/isBecomeAnAmbassadorCtaEnabled']
)
const isVolunteer = computed(() => store.getters['user/isVolunteer'])
const isAmbassador = computed(() => store.getters['user/isAmbassador'])

const sortByCreatedAt = (first: any, second: any) => {
  if (first.createdAt < second.createdAt) return -1
  if (first.createdAt > second.createdAt) return 1
  return 0
}

const sortedUnlockedSessions = computed(() => {
  const sessions = [...store.getters['volunteer/unlockedOpenSessions']]
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
  // There must be no more than MAX_AVAILABLE_SECTIONS unlocked sessions for us to display the locked ones,
  // and to display locked ones, props.showLockedSessions must be true.
  if (
    sortedUnlockedSessions.value.length > MAX_AVAILABLE_SECTIONS ||
    !props.showLockedSessions
  ) {
    return [...sortedExclusiveSessions.value, ...sortedUnlockedSessions.value]
  }
  return [
    ...sortedExclusiveSessions.value,
    ...sortedUnlockedSessions.value,
    ...sortedLockedSessions.value,
  ]
})

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
  const { type, subTopic, id } = session
  const path = `/session/${Case.kebab(type)}/${Case.kebab(subTopic)}/${id}`

  if (type && subTopic && id) {
    router.push(path)
  } else {
    store.dispatch('user/clearSession')
  }
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

const mobileMode = computed(() => store.getters['app/mobileMode'])
const ticks = computed(() => store.state.volunteer.ticks)
function waitTime(args: { createdAt: any }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  ticks.value //This line makes waitTime recalculate as `ticks` changes in the store.
  const newTime = new Date().getTime() - new Date(args.createdAt).getTime()
  const seconds = Number((newTime / 1000).toFixed(0))
  const minutes = Number((newTime / (1000 * 60)).toFixed(0))
  const hours = Number((newTime / (1000 * 60 * 60)).toFixed(0))

  // Use shorter labels on mobile
  const minuteLabel = mobileMode.value ? 'm' : ' min'
  const minutesLabel = mobileMode.value ? 'm' : ' mins'
  const hourLabel = mobileMode.value ? 'h' : ' hr'
  const hoursLabel = mobileMode.value ? 'h' : ' hrs'

  if (seconds < 60) {
    return `< 1${minuteLabel}`
  }
  if (minutes < 60) {
    if (minutes === 1) return `${minutes}${minutesLabel}`
    return `${minutes}${minutesLabel}`
  }
  if (hours < 24) {
    if (hours === 1) return `${hours}${hourLabel}`
    return `${hours}${hoursLabel}`
  }
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

  // Tutor-exclusive request rows: tinted background overrides zebra,
  // brighter border to stand out, eyebrow + emoji prefix in the first cell.
  &--exclusive {
    background: #fff8e6 !important;
    border-left: 3px solid #f3c244;

    &:hover {
      background: darken(#fff8e6, 3%) !important;
    }
  }

  &__eyebrow {
    display: block;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 11px;
    font-weight: 600;
    color: #4d3a00;
    margin-bottom: 2px;
  }
}

.exclusive-emoji {
  margin-right: 4px;
}

.session-row td {
  text-align: left;
}
.shadow-ban {
  margin-right: 8px;
  font-size: 12px;
  border-radius: 5px;
  background: $c-warning-orange;
  color: #fff;
  padding: 5px;
  font-weight: 500;
  white-space: nowrap;
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
</style>
