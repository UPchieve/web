<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import LargeButton from '../LargeButton.vue'
import AnalyticsService from '../../services/AnalyticsService.js'
import { EVENTS } from '@/consts'
import { useRouter } from 'vue-router'
import UserService from '@/services/UserService'
import LoggerService from '@/services/LoggerService'

const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7
const AVG_WEEKS_PER_MONTH = 52 / 12
const AVG_SESSION_LENGTH_MINUTES = 35

const store = useStore()
const router = useRouter()
const props = defineProps<{
  requiredHours: number | null
  currentHours: number | null
  monthOptions: { value: number; label: string }[]
  targetMonth: number
  targetYear: number
}>()
const error = ref<string>('')
const user = computed(() => store.state.user.user)
const hasVolunteerRole = computed(() => store.getters['user/hasVolunteerRole'])
const isVolunteer = computed(() => store.getters['user/isVolunteer'])

const hoursRemaining = computed(() => {
  if (props.requiredHours === null) return null
  const remaining = (props.requiredHours ?? 0) - (props.currentHours ?? 0)
  return Math.max(0, remaining)
})

const weeksUntilDeadline = computed(() => {
  if (props.targetMonth === null || props.targetYear === null) return null
  const deadline = new Date(props.targetYear, props.targetMonth - 1, 1)
  const now = new Date()
  const weeks = Math.ceil((deadline.getTime() - now.getTime()) / MS_PER_WEEK)
  return Math.max(1, weeks)
})

const monthsUntilDeadline = computed(() => {
  if (weeksUntilDeadline.value === null) return null
  return Math.max(1, Math.round(weeksUntilDeadline.value / AVG_WEEKS_PER_MONTH))
})

const sessionPlan = computed(() => {
  if (sessionsNeeded.value === null || weeksUntilDeadline.value === null)
    return null

  const raw = sessionsNeeded.value / weeksUntilDeadline.value

  if (raw >= 1) {
    const label = `${props.monthOptions[props.targetMonth - 1].label} ${props.targetYear}`
    return { sessions: Math.ceil(raw), label }
  } else {
    const finishDate = new Date()
    finishDate.setDate(finishDate.getDate() + sessionsNeeded.value * 7)
    const finishMonth = finishDate.getMonth() // 0-indexed
    const finishYear = finishDate.getFullYear()
    const label = `${props.monthOptions[finishMonth].label} ${finishYear}`
    return { sessions: 1, label }
  }
})

const sessionsNeeded = computed(() => {
  if (hoursRemaining.value === null) return null
  return Math.ceil((hoursRemaining.value * 60) / AVG_SESSION_LENGTH_MINUTES)
})

const hoursPerWeek = computed(() => {
  if (hoursRemaining.value === null || weeksUntilDeadline.value === null)
    return null
  return (hoursRemaining.value / weeksUntilDeadline.value).toFixed(1)
})

const hoursPerMonth = computed(() => {
  if (hoursRemaining.value === null || monthsUntilDeadline.value === null)
    return null
  return (hoursRemaining.value / monthsUntilDeadline.value).toFixed(1)
})

const progressPercent = computed(() => {
  if (!props.requiredHours) return 0
  const percent = ((props.currentHours ?? 0) / props.requiredHours) * 100
  return Math.min(100, Math.round(percent))
})

const goalAlreadyMet = computed(() => {
  return hoursRemaining.value !== null && hoursRemaining.value === 0
})

const becomeAVolunteer = async () => {
  AnalyticsService.captureEvent(
    EVENTS.V_HOUR_CALCULATOR_BECOME_VOLUNTEER_CLICKED
  )
  try {
    await UserService.firstTransitionToVolunteerMode(router)
  } catch (e) {
    LoggerService.noticeError(
      e,
      `Failed to add or switch active role for user: ${user.value.id}`
    )
  }
}

watch(
  () => [goalAlreadyMet.value, sessionsNeeded.value],
  () => {
    if (goalAlreadyMet.value) {
      AnalyticsService.captureEvent(
        EVENTS.V_HOUR_CALCULATOR_PLAN_COMPLETED_SEEN,
        {
          requiredHours: props.requiredHours,
          currentHours: props.currentHours,
          targertMonth: props.targetMonth,
          targetYear: props.targetYear,
        }
      )
    } else if (sessionsNeeded.value !== null && sessionsNeeded.value > 0) {
      AnalyticsService.captureEvent(EVENTS.V_HOUR_CALCULATOR_PLAN_MADE, {
        requiredHours: props.requiredHours,
        currentHours: props.currentHours,
        targertMonth: props.targetMonth,
        targetYear: props.targetYear,
      })
    } else {
      AnalyticsService.captureEvent(EVENTS.V_HOUR_CALCULATOR_SEEN)
    }
  }
)

const switchRole = async () => {
  try {
    await UserService.switchActiveRole({ $store: store }, 'volunteer')
    await router.replace('/dashboard')
  } catch (err) {
    LoggerService.noticeError(
      (err instanceof Error ? err.message : null) ??
        'Error while switching account modes',
      { userId: user.value.id }
    )
    error.value =
      'Something went wrong while switching account modes. Please refresh the page and try again, or reach out to support@upchieve.org for help.'
  }
}
</script>

<template>
  <div class="result">
    <div class="header">Your Plan</div>

    <div class="body">
      <template v-if="goalAlreadyMet">
        <p class="goal-met">🎉 You've already hit your goal!</p>
        <p class="detail">
          Want to keep making a difference? Every session you tutor helps a real
          student get unstuck.
        </p>
      </template>

      <template v-else-if="sessionsNeeded !== null && sessionsNeeded > 0">
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">Progress</span>
            <span class="progress-percent"
              >{{ progressPercent }}% complete</span
            >
          </div>
          <div
            class="progress-track"
            role="progressbar"
            :aria-valuenow="progressPercent"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              class="progress-fill"
              :style="{ width: progressPercent + '%' }"
            />
          </div>
          <div class="progress-range">
            <span>0 hrs</span>
            <span>{{ requiredHours }} hrs</span>
          </div>
        </div>

        <div class="stat-grid">
          <div class="stat-box">
            <span class="stat-number">{{ hoursRemaining }}</span>
            <span class="stat-label">Hours Left</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">{{ monthsUntilDeadline ?? '—' }}</span>
            <span class="stat-label">Months Left</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">{{ hoursPerWeek ?? '—' }}</span>
            <span class="stat-label">Hrs / Week</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">{{ hoursPerMonth ?? '—' }}</span>
            <span class="stat-label">Hrs / Month</span>
          </div>
        </div>

        <div class="callout">
          <p class="callout-header">— When will you hit your goal? —</p>
          <p class="callout-intro">
            By volunteering on UPchieve, you can complete your goal with:
          </p>
          <div class="callout-highlight">
            Just
            <strong
              >{{ sessionPlan?.sessions }} session{{
                sessionPlan?.sessions === 1 ? '' : 's'
              }}/week</strong
            >
            <template v-if="sessionPlan?.label">
              until <strong>{{ sessionPlan.label }}</strong></template
            >
          </div>
          <p class="callout-impact">
            You could help up to
            <span class="impact-badge">{{ sessionsNeeded }}</span>
            students!
          </p>
        </div>
      </template>

      <template v-else>
        <p class="detail">
          💡 Did you know you can earn verified service hours by tutoring on
          UPchieve?
        </p>
        <div class="other-ways">
          <p class="other-ways-title">Other ways to earn hours on UPchieve:</p>
          <ul>
            <li>Refer new tutors to the platform</li>
            <li>Unlock/certify in new subjects to tutor</li>
            <li>Attend monthly volunteer training sessions</li>
          </ul>
        </div>
      </template>
    </div>

    <div class="footer" v-if="!isVolunteer">
      <large-button
        v-if="hasVolunteerRole"
        class="cta"
        variant="primary-blue"
        :show-arrow="false"
        @click="switchRole"
      >
        Switch to Volunteer View
      </large-button>
      <large-button
        v-else
        class="cta"
        variant="primary-blue"
        :show-arrow="false"
        @click="becomeAVolunteer"
      >
        Get Started
      </large-button>
      <p class="pro-tip">
        It’s 100% flexible. Volunteer on your own schedule, in subjects you’re
        comfortable with, and make a real difference for students just like you.
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.result {
  @include flex-container(column);
  background: white;
  border-radius: 10px;
  border: 1px solid $c-border-grey;
  overflow: hidden;
  gap: 0;
  padding: 0;
}

.header {
  background: $c-background-blue;
  color: $c-soft-black;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 12px 20px;
}

.body {
  @include flex-container(column);
  gap: 16px;
  padding: 20px;
  flex: 1;
}

.progress-section {
  @include flex-container(column);
  gap: 6px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.progress-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $c-secondary-grey;
}

.progress-percent {
  font-size: 12px;
  color: $c-secondary-grey;
}

.progress-track {
  height: 10px;
  background: $c-background-grey;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: $c-success-green;
  border-radius: 5px;
  transition: width 0.3s ease;
  min-width: 4px;
}

.progress-range {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: $c-secondary-grey;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-box {
  @include flex-container(column);
  align-items: center;
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  padding: 12px 8px;
  gap: 4px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: $c-soft-black;
  line-height: 1;
}

.stat-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: $c-secondary-grey;
}

.callout {
  @include flex-container(column);
  gap: 10px;
  background: $c-background-grey;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.callout-header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: $c-secondary-grey;
  margin: 0;
}

.callout-intro {
  font-size: 14px;
  color: $c-soft-black;
  margin: 0;
  line-height: 1.5;
}

.callout-highlight {
  background: white;
  border: 1px solid $c-border-grey;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 14px;
  color: $c-soft-black;
  line-height: 1.5;
}

.callout-impact {
  font-size: 14px;
  color: $c-soft-black;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}

.impact-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: $c-soft-black;
  color: white;
  font-weight: 700;
  font-size: 15px;
  border-radius: 4px;
  padding: 2px 8px;
  min-width: 36px;
}

.other-ways {
  border: 1px dashed $c-border-grey;
  border-radius: 6px;
  padding: 10px 12px;
  text-align: left;

  ul {
    margin: 4px 0 0;
    padding-left: 16px;
    list-style: disc;

    li {
      font-size: 12px;
      color: $c-secondary-grey;
      line-height: 1.6;
    }
  }
}

.other-ways-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: $c-secondary-grey;
  margin: 0;
}

.footer {
  @include flex-container(column);
  gap: 10px;
  padding: 16px 20px 20px;
  border-top: 1px solid $c-border-grey;
}

.cta {
  justify-content: center;
  align-self: center;
  font-size: 15px;
  font-weight: 600;
}

.detail {
  font-size: 15px;
  color: $c-soft-black;
  margin: 0 0 10px;
  line-height: 1.6;
}

.goal-met {
  font-size: 18px;
  font-weight: 600;
  color: $c-soft-black;
  margin: 0;
}

.pro-tip {
  font-size: 12px;
  color: $c-secondary-grey;
  margin: 0;
  padding: 8px 12px;
  border: 1px dashed $c-border-grey;
  border-radius: 6px;
  line-height: 1.5;
}
</style>
