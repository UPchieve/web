<template>
  <div class="session-list">
    <div v-if="hasError" class="session-list__error">
      <p>Failed to load a list of students. Please try refreshing</p>
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
          @click="
            session.isUnlocked ? gotoSession(session) : goToSubjectCert(session)
          "
        >
          <td>
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
          <button
            class="ambassador-button"
            @click="openAmbassadorReferralModal"
          >
            <strong>becoming an UPchieve Ambassador!</strong>
            <ArrowIcon class="arrow-icon" />
          </button>
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
import Case, { kebab } from 'case'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import ArrowIcon from '@/assets/arrow.svg'
import { computed, defineAsyncComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
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

const sortedSessions = computed(() => {
  // There must be no more than MAX_AVAILABLE_SECTIONS unlocked sessions for us to display the locked ones,
  // and to display locked ones, props.showLockedSessions must be true.
  if (
    sortedUnlockedSessions.value.length > MAX_AVAILABLE_SECTIONS ||
    !props.showLockedSessions
  ) {
    return sortedUnlockedSessions.value
  }
  return [...sortedUnlockedSessions.value, ...sortedLockedSessions.value]
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
    const route = `/training/${kebab(session.subTopic)}/quiz`
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
}

.session-row {
  cursor: pointer;
  &:hover {
    background: lighten($c-information-blue, 50%);
  }
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
    color: $c-information-blue;
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

.arrow-icon {
  fill: $c-success-green;
  height: 16px;
  width: 16px;
  margin-top: 2px;
  margin-left: 8px;
}
</style>
