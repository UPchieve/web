<script setup lang="ts">
import { EVENTS } from '@/consts'
import TaskCard from './TaskCard.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { computed, ref, watch } from 'vue'
import NetworkService from '@/services/NetworkService.js'
import config from '@/config.js'
import { useStore } from 'vuex'
import { hoursToHoursAndMinutes } from '@/utils/time-utils'
import { flow, reduce, get, isBoolean } from 'lodash-es'
import Loader from '@/components/Loader.vue'
import InformationIcon from '@/assets/information.svg'
import ClockIcon from '@/assets/icons/clock_icon.svg'
import ChatIcon from '@/assets/icons/chat-outline-rounded.svg'
import NotesIcon from '@/assets/icons/notes-checkmark.svg'
import LargeButton from '@/components/LargeButton.vue'
import HyperlinkButton from '@/components/HyperlinkButton.vue'

interface ImpactStats {
  numHoursSelected: string | number
  totalQuizzesPassed: string
  numRequestsFilled: number
  numHoursTutored: string | { hours: number; minutes: number }
  timeTutoredThisWeek: string | { hours: number; minutes: number }
  numElapsedAvailabilityHours: string
  totalStudentsHelped: string
  numReferralHours: string | { hours: number; minutes: number }
}

// (1) Hours selected
const userHasSchedule = flow([get, isBoolean])

const store = useStore()

const isLoadingImpactSummary = ref(true)
const lastUpdated = ref('')
const user = computed(() => store.state.user.user)
const isCustomVolunteerPartner = computed(() => {
  return config.customVolunteerPartnerOrgs.some(
    (org: string) => org === user.value.volunteerPartnerOrg
  )
})

const hourTrackingGuide = computed(() => {
  if (isCustomVolunteerPartner.value)
    return 'https://cdn.upchieve.org/docs/Verizon-Volunteer-Hour-Tracking-Resource.pdf'
  return 'https://cdn.upchieve.org/docs/volunteer-hour-tracking-guide.pdf'
})

const isVerifyHoursButtonEnabled = computed(
  () => store.getters['featureFlags/isVerifyHoursButtonEnabled']
)

const allSubjectNames = computed(
  () => store.getters['subjects/allSubtopicNames']
)

const impactStats = computed<ImpactStats>(() => {
  if (isCustomVolunteerPartner.value) {
    return getCustomImpactStats({
      availability: user.value.availability,
      totalVolunteerHours: user.value.totalVolunteerHours,
      pastSessions: user.value.pastSessions,
      totalQuizzesPassed: user.value.totalQuizzesPassed,
    }) as unknown as ImpactStats
  }

  return getImpactStats({
    availability: user.value.availability,
    pastSessions: user.value.pastSessions,
    hoursTutored: user.value.hoursTutored,
    hoursTutoredThisWeek: user.value.hoursTutoredThisWeek,
    elapsedAvailability: user.value.elapsedAvailability,
    totalQuizzesPassed: user.value.totalQuizzesPassed,
    totalStudentsHelped: user.value.uniqueStudentsHelpedCount,
    numReferredVolunteers: user.value.numReferredVolunteers,
  })
})
function getImpactStats({
  availability,
  pastSessions,
  hoursTutored,
  hoursTutoredThisWeek,
  totalQuizzesPassed,
  elapsedAvailability,
  totalStudentsHelped,
  numReferredVolunteers,
}: {
  availability: string
  pastSessions: string
  hoursTutored: string
  hoursTutoredThisWeek: string
  totalQuizzesPassed: string
  elapsedAvailability: string
  totalStudentsHelped: string
  numReferredVolunteers: number
}) {
  let numHoursSelected: string | number = 0

  if (userHasSchedule(availability, 'Thursday.5p')) {
    numHoursSelected = reduce(
      availability,
      (weeklyHourCount, dayHours) => {
        // Tally up num hours for each day
        const hoursSelectedForDay = reduce(
          dayHours,
          (dailyHourCount, hourVal) => {
            // Add 1 if hour val is true
            return dailyHourCount + (hourVal ? 1 : 0)
          },
          0
        )

        return weeklyHourCount + hoursSelectedForDay
      },
      0
    )
  }

  // (3) Requests filled
  const numRequestsFilled = get(pastSessions, 'length', 0)

  const formatFn = ({ hours, minutes }: { hours: number; minutes: number }) =>
    `${hours}h ${minutes}m`

  // (4) Hours tutored
  const numHoursTutored = hoursToHoursAndMinutes(
    Number(hoursTutored ?? 0),
    formatFn
  )

  // (5) Hours tutored this week
  const timeTutoredThisWeek = hoursToHoursAndMinutes(
    hoursTutoredThisWeek ? Number(hoursTutoredThisWeek) : 0,
    formatFn
  )

  // (6) Elapsed availability
  const numElapsedAvailabilityHours = `${elapsedAvailability} h`

  const numReferralHours = hoursToHoursAndMinutes(
    (numReferredVolunteers * 12) / 60,
    formatFn
  )

  numHoursSelected = `${numHoursSelected} h`

  return {
    numHoursSelected,
    totalQuizzesPassed,
    numRequestsFilled,
    numHoursTutored,
    timeTutoredThisWeek,
    numElapsedAvailabilityHours,
    totalStudentsHelped,
    numReferralHours,
  }
}
function getCustomImpactStats({
  availability,
  totalVolunteerHours,
  pastSessions,
  totalQuizzesPassed,
}: {
  availability: string
  totalVolunteerHours: string
  pastSessions: string
  totalQuizzesPassed: string
}) {
  let numHoursSelected = 0

  if (userHasSchedule(user, 'availability.Thursday.5p')) {
    numHoursSelected = reduce(
      availability,
      (weeklyHourCount, dayHours) => {
        // Tally up num hours for each day
        const hoursSelectedForDay = reduce(
          dayHours,
          (dailyHourCount, hourVal) => {
            // Add 1 if hour val is true
            return dailyHourCount + (hourVal ? 1 : 0)
          },
          0
        )

        return weeklyHourCount + hoursSelectedForDay
      },
      0
    )
  }

  // (3) Requests filled
  const numRequestsFilled = get(pastSessions, 'length', '--')

  // (4) Hours volunteered
  const numHoursVolunteered = Number(totalVolunteerHours) || '--'

  return [
    {
      label: 'Hours of availability selected',
      value: `${numHoursSelected} hours selected`,
    },
    {
      label: 'Number of quizzes passed',
      value: `${totalQuizzesPassed} quizzes passed`,
    },
    {
      label: 'Number of requests filled',
      value: `${numRequestsFilled} requests filled`,
    },
    {
      label: 'Total hours of volunteering completed',
      value: `${numHoursVolunteered} hours volunteered`,
    },
  ]
}

async function getLastUpdated() {
  const res = await NetworkService.getVolunteerLastUpdated()
  if (res.data.err) {
    return 'Error retriving last update time'
  }
  const lastUpdated = res.data.lastUpdated
  return `Last updated on ${lastUpdated}`
}

function trackVerifyHoursClick() {
  AnalyticsService.captureEvent(EVENTS.VERIFY_HOURS_BUTTON_CLICKED)
}

async function initImpactSummary() {
  try {
    if (isCustomVolunteerPartner.value) {
      lastUpdated.value = await getLastUpdated()
    }
    if (isVerifyHoursButtonEnabled.value) {
      AnalyticsService.captureEvent(EVENTS.VERIFY_HOURS_BUTTON_SEEN)
    }
  } finally {
    isLoadingImpactSummary.value = false
  }
}

watch(
  () => allSubjectNames.value,
  (currValue, prevValue) => {
    const isNowLoaded = currValue.length && !prevValue?.length
    if (isNowLoaded) initImpactSummary()
  },
  {
    immediate: true,
    deep: true,
  }
)
</script>
<template>
  <TaskCard title="Your Impact Summary" subtitle="">
    <template v-slot:heading-content>
      <div v-if="isVerifyHoursButtonEnabled" class="verify-hours">
        <LargeButton
          target="_blank"
          routeTo="https://forms.gle/ocSvom8GcdudzuBJA"
          @click="trackVerifyHoursClick"
        >
          Verify hours
        </LargeButton>
      </div>
    </template>
    <template v-slot:content>
      <loader v-if="isLoadingImpactSummary" class="loader--center" />
      <div v-else class="impact-summary-content">
        <div class="impact-summary">
          <div class="coaching-activity">
            <div class="impact-summary__heading">
              <chat-icon />
              <h2 class="impact-summary__title">Coaching Activity</h2>
            </div>

            <div class="coaching-activity__hours-this-week-title">
              <h3>Hours this week</h3>
              <span
                class="stat-tooltip"
                v-tooltip="{
                  text: 'Monday to Sunday UTC time',
                  color: 'black',
                  position: 'top',
                }"
              >
                <InformationIcon />
              </span>
            </div>
            <h4 class="coaching-activity__hours-this-week">
              {{ impactStats.timeTutoredThisWeek }}
            </h4>
            <div class="coaching-activity__divider"></div>
            <div class="impact-summary__stats">
              <span class="stat-name">Hours all time</span
              ><span class="stat">{{ impactStats.numHoursTutored }}</span>
            </div>
            <div class="impact-summary__stats">
              <span class="stat-name">Requests filled</span
              ><span class="stat">{{ impactStats.numRequestsFilled }}</span>
            </div>
            <div class="impact-summary__stats">
              <span class="stat-name">Certifications</span
              ><span class="stat">{{ impactStats.totalQuizzesPassed }}</span>
            </div>
          </div>
          <div class="impact-summary-right">
            <div class="community-impact">
              <div class="impact-summary__heading">
                <notes-icon />
                <h2 class="impact-summary__title">Community Impact</h2>
              </div>
              <div class="impact-summary__stats">
                <span class="stat-name">Students helped</span
                ><span class="stat">{{ impactStats.totalStudentsHelped }}</span>
              </div>
              <div class="impact-summary__stats">
                <span class="stat-name">Referral Hours</span
                ><span class="stat">{{ impactStats.numReferralHours }}</span>
              </div>
            </div>
            <div class="availability">
              <div class="impact-summary__heading">
                <clock-icon />
                <h2 class="impact-summary__title">Availability</h2>
              </div>
              <div class="impact-summary__stats">
                <span class="stat-name">Hours selected</span
                ><span class="stat">{{ impactStats.numHoursSelected }}</span>
              </div>
              <div class="impact-summary__stats">
                <span class="stat-name">Hours elapsed</span
                ><span class="stat">{{
                  impactStats.numElapsedAvailabilityHours
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="dashboard-card-link">
          <HyperlinkButton
            bold
            :routeTo="hourTrackingGuide"
            rel="noopener noreferrer"
            >How to track your volunteer hours</HyperlinkButton
          >
        </div>
      </div>
    </template>
  </TaskCard>
</template>

<style lang="scss" scoped>
.impact-summary-content {
  width: 100%;
}

.impact-summary {
  @include flex-container(row, center, stretch);
  gap: 12px;
  padding: 16px 30px;

  @include breakpoint-below('small') {
    @include flex-container(column, center, center);
  }

  &__title {
    font-size: 20px;
    font-weight: 500;
    text-wrap: nowrap;
    margin: 0;
  }

  &__stats {
    @include flex-container(row, space-between, center);
    margin: 6px 0;

    .stat-name {
      font-size: 15px;
      font-weight: 500;
      line-height: 150%;
      margin-right: 16px;
    }

    .stat {
      font-size: 16px;
      font-weight: 700;
      line-height: 150%;
    }
  }

  &__heading {
    @include flex-container(row, flex-start, center);
    gap: 5px;
    margin: 8px 0;
  }
}

.coaching-activity {
  @include flex-container(column, center, space-evenly);
  flex: 1;
  border: lightgray 1px solid;
  border-radius: 12px;
  padding: 6px 12px;
  border-top: 10px solid rgba(22, 210, 170, 0.2);
  width: 100%;
  height: auto;
  margin-right: 14px;

  &__hours-this-week-title {
    @include flex-container(row, flex-start, flex-end);
    gap: 6px;

    h3 {
      font-size: 15px;
      margin: 0;
    }

    svg {
      width: 12px;
      height: 12px;
      margin-top: 2px;
    }
  }

  &__hours-this-week {
    font-size: 28px;
    font-weight: 600;
  }

  &__divider {
    background-color: #d8dee5;
    height: 1px;
    margin: 20px 0;
    justify-self: center;
  }
}

.community-impact,
.availability {
  @include flex-container(column, center, space-between);
  border: lightgray 1px solid;
  border-radius: 12px;
  padding: 8px;
  width: 100%;
}

.community-impact {
  border-top: 10px solid #e3f2fd;
  margin-bottom: 14px;
}

.availability {
  border-top: 10px solid #feefc2;
}

.impact-summary-right {
  gap: 8px;
  flex: 1;
  @include flex-container(column, stretch, flex-start);

  @include breakpoint-below('small') {
    flex: 0;
    width: 100%;
    gap: 12px;
  }
}
.verify-hours {
  width: 100%;
  display: flex;
  flex-direction: column-reverse;
  align-items: end;
}

.dashboard-card-link {
  text-align: center;
}

.loader--center {
  text-align: center;
}

.stat-tooltip:before {
  transition-duration: 0ms;
}
</style>
