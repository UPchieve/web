<template>
  <div class="session-list">
    <div v-if="hasError" class="session-list__error">
      <p>Failed to load a list of students. Please try refreshing</p>
    </div>
    <div v-if="isShowLockedSessionsEnabled" class="locked-sessions-toggle">
      <label for="show-locked-sessions-toggle"> Show locked sessions? </label>
      <ToggleButton
        data-testid="show-locked-sessions-toggle"
        id="show-locked-sessions-toggle"
        :value="showLockedSessionsToggle"
        @change="toggleShowLockedSessions"
        :labels="{ checked: 'Show', unchecked: 'Hide' }"
        :width="75"
      />
    </div>
    <table class="table table-striped">
      <tr>
        <th scope="col">Student</th>
        <th scope="col">Help Topic</th>
        <th scope="col">Wait Time</th>
        <th v-if="shouldShowLockedSessions" scope="col" />
      </tr>
      <tbody>
        <tr
          v-for="(session, index) in sortedSessions"
          :key="`session-${index}`"
          :id="session.id"
          :data-testid="`session-row-${session.id}`"
          :class="{
            'session-row': true,
            'session-row-locked': !session.isUnlocked,
          }"
          @click="
            session.isUnlocked ? gotoSession(session) : goToSubjectCert(session)
          "
        >
          <td>
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
          <td v-if="shouldShowLockedSessions">
            <div
              type="button"
              v-if="!session.isUnlocked"
              @click="goToSubjectCert(session)"
              class="unlock-subject-button"
            >
              <strong
                >Unlock{{ isNarrowScreen ? '' : ' Subject' }}
                <ArrowIcon class="arrow-icon"
              /></strong>
            </div>
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

<script lang="ts">
export function getShowLockedSessionKey(userId?: string) {
  return `SHOW_LOCKED_SESSIONS-${userId}`
}
</script>

<script lang="ts" setup>
import { useStore } from 'vuex'
import Case, { kebab } from 'case'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import ArrowIcon from '@/assets/arrow.svg'
import AmbassadorReferralModal from '@/views/AmbassadorReferralModal.vue'
import { computed, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import ToggleButton from '@/components/ToggleButton.vue'

const hasError = ref<boolean>(false)
const ambassadorReferralModalIsOpen = ref<boolean>(false)
const MAX_AVAILABLE_SECTIONS = 5

const store = useStore()
const router = useRouter()

const isNarrowScreen = computed(() => store.state.app.windowWidth < 500)
const user = computed(() => store.state.user.user)
const isBecomeAnAmbassadorCtaEnabled = computed(
  () => store.getters['featureFlags/isBecomeAnAmbassadorCtaEnabled']
)
const isVolunteer = computed(() => store.getters['user/isVolunteer'])
const isAmbassador = computed(() => store.getters['user/isAmbassador'])

const isShowLockedSessionsEnabled = computed(
  () => store.getters['featureFlags/isShowLockedSessionsEnabled']
)
const showLockedSessionsToggle = ref<boolean>(false)
const showLockedSessionsKey = computed(() => {
  return getShowLockedSessionKey(user.value?.id)
})
const shouldShowLockedSessions = computed(() => {
  if (!isShowLockedSessionsEnabled.value) return false
  if (showLockedSessionsToggle.value) return true
  const localStorageValue = localStorage.getItem(showLockedSessionsKey.value)
  return localStorageValue ? JSON.parse(localStorageValue) : false
})

const toggleShowLockedSessions = () => {
  showLockedSessionsToggle.value = !showLockedSessionsToggle.value
  localStorage.setItem(
    showLockedSessionsKey.value,
    JSON.stringify(showLockedSessionsToggle.value)
  )
}

onBeforeMount(() => {
  showLockedSessionsToggle.value = shouldShowLockedSessions.value
})

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
    !shouldShowLockedSessions.value
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

const ticks = computed(() => store.state.volunteer.ticks)
function waitTime(args: { createdAt: any }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  ticks.value //This line makes waitTime recalculate as `ticks` changes in the store.
  const newTime = new Date().getTime() - new Date(args.createdAt).getTime()
  const seconds = Number((newTime / 1000).toFixed(0))
  const minutes = Number((newTime / (1000 * 60)).toFixed(0))
  const hours = Number((newTime / (1000 * 60 * 60)).toFixed(0))

  if (seconds < 60) {
    return '< 1 min'
  }
  if (minutes < 60) {
    if (minutes === 1) return `${minutes} min`
    return `${minutes} mins`
  }
  if (hours < 24) {
    if (hours === 1) return `${hours} hr`
    return `${hours} hrs`
  }
}
</script>

<style lang="scss" scoped>
.locked-sessions-toggle {
  display: flex;
  flex-direction: row;
  gap: 2%;
  align-items: center;
  justify-content: end;
}

.session-list {
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

.session-row-locked {
  .unlock-subject-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: $c-success-green;
    font-size: 16px;
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
