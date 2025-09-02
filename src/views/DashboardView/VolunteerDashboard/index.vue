<template>
  <div class="volunteer-dashboard">
    <dashboard-banner />

    <!-- TODO: Make notices into a reusable component. -->
    <div v-if="downtimeBannerMessage" class="dashboard-notice">
      <a href="https://upchieve.statuspage.io" target="_blank">{{
        downtimeBannerMessage
      }}</a>
    </div>

    <div class="volunteer-dashboard__body">
      <template v-if="user.isApproved && user.isOnboarded">
        <div class="dashboard-card">
          <div class="students-waiting">
            <web-notifications-button class="notifications-button" />
            <div class="dashboard-card__title">Waiting Students</div>
            <div v-if="isSessionAlive" class="rejoin-session-container">
              <button
                class="btn rejoinSessionBtn"
                type="button"
                @click.prevent="rejoinHelpSession()"
              >
                Rejoin your coaching session
              </button>
            </div>
            <div v-else>
              <div class="dashboard-card__subtitle">
                Students waiting for help will show up below.
              </div>
              <list-sessions />
            </div>
          </div>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card__title">Your Impact Summary</div>
          <loader v-if="isLoadingImpactSummary" class="loader--center" />
          <div v-else class="impact-summary">
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
                  ><span class="stat">{{
                    impactStats.totalStudentsHelped
                  }}</span>
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
          <div class="dashboard-card__link">
            <a
              class="track-hours-link"
              :href="hourTrackingGuide"
              target="_blank"
              rel="noopener noreferrer"
              >How to track your volunteer hours
              <arrow-icon class="arrow-icon" />
            </a>
          </div>
        </div>
      </template>
      <template v-else>
        <div v-if="!user.isApproved" class="dashboard-card">
          <div class="dashboard-card__icon">
            <verification-icon />
          </div>
          <div class="dashboard-card__title" data-testid="safety-screening">
            Safety Screening
          </div>
          <div class="dashboard-card__subtitle">
            {{ approvalCardSubheader }}
          </div>
          <template
            v-if="
              !user.volunteerPartnerOrg ||
              partnerKeysThatRequirePhotoId.includes(user.volunteerPartnerOrg)
            "
          >
            <account-action
              v-for="accountAction in openVolunteerApprovalAccountActions"
              :key="accountAction.title"
              :title="accountAction.title"
              :subtitle="accountAction.subtitle"
              :status="accountAction.status"
              :icon="accountAction.icon"
              @click="accountAction.clickFn"
              :data-testid="accountAction.title"
            />
          </template>
          <template v-else>
            <account-action
              v-for="accountAction in partnerVolunteerApprovalAccountActions"
              :key="accountAction.title"
              :title="accountAction.title"
              :subtitle="accountAction.subtitle"
              :status="accountAction.status"
              :icon="accountAction.icon"
              @click="accountAction.clickFn"
            />
          </template>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card__icon">
            <onboarding-icon />
          </div>
          <div class="dashboard-card__title">Onboarding Process</div>
          <div class="dashboard-card__subtitle">
            While waiting for your safety screening to process, complete our
            quick onboarding so you're ready to start helping students as soon
            as possible.
          </div>

          <account-action
            v-for="accountAction in onboaringAccountActions"
            :key="accountAction.title"
            :title="accountAction.title"
            :subtitle="accountAction.subtitle"
            :status="accountAction.status"
            :icon="accountAction.icon"
            @click="accountAction.clickFn"
          />
        </div>
      </template>
    </div>

    <photo-upload-modal
      v-if="showPhotoUploadModal"
      :closeModal="togglePhotoUploadModal"
    />

    <volunteer-welcome-modal
      v-if="showWelcomeModal"
      :closeModal="toggleWelcomeModal"
    />

    <share-milestone-modal
      v-if="showMilestoneModal"
      :closeModal="handleMilestoneModalClose"
      :typeOfMilestone="typeOfMilestone"
    />
  </div>
</template>

<script>
import { flow, reduce, get, isBoolean } from 'lodash-es'
import { mapState, mapGetters } from 'vuex'
import ListSessions from './ListSessions.vue'
import DashboardBanner from '../DashboardBanner.vue'
import AccountAction from './AccountAction.vue'
import PhotoUploadModal from './PhotoUploadModal.vue'
import VolunteerWelcomeModal from '@/views/DashboardView/VolunteerDashboard/VolunteerWelcomeModal.vue'
import PersonCardIcon from '@/assets/person-card.svg'
import PersonIcon from '@/assets/person.svg'
import CalendarIcon from '@/assets/calendar.svg'
import CertificationIcon from '@/assets/certification.svg'
import VerificationIcon from '@/assets/verification.svg'
import OnboardingIcon from '@/assets/onboarding.svg'
import TrainingIcon from '@/assets/training_icon.svg'
import WebNotificationsButton from '@/components/WebNotificationsButton.vue'
import ArrowIcon from '@/assets/arrow.svg'
import NetworkService from '../../../services/NetworkService'
import config from '../../../config'
import Loader from '@/components/Loader.vue'
import { hoursToHoursAndMinutes } from '@/utils/time-utils'
import InformationIcon from '@/assets/information.svg'
import { vTooltip } from 'maz-ui'
import ShareMilestoneModal from '@/views/DashboardView/VolunteerDashboard/ShareMilestoneModal.vue'
import ClockIcon from '@/assets/icons/clock_icon.svg'
import ChatIcon from '@/assets/icons/chat-outline-rounded.svg'
import NotesIcon from '@/assets/icons/notes-checkmark.svg'

// (1) Hours selected
const userHasSchedule = flow([get, isBoolean])

export default {
  name: 'volunteer-dashboard',
  components: {
    ListSessions,
    DashboardBanner,
    AccountAction,
    PhotoUploadModal,
    VerificationIcon,
    OnboardingIcon,
    VolunteerWelcomeModal,
    WebNotificationsButton,
    ArrowIcon,
    Loader,
    InformationIcon,
    ShareMilestoneModal,
    ClockIcon,
    ChatIcon,
    NotesIcon,
  },
  directives: {
    tooltip: vTooltip,
  },

  watch: {
    allSubjectNames: {
      handler(currValue, prevValue) {
        const isNowLoaded = currValue.length && !prevValue?.length
        if (isNowLoaded) this.initImpactSummary()
      },
      immediate: true,
      deep: true,
    },
  },
  async created() {
    if (this.isFirstDashboardVisit) {
      this.toggleWelcomeModal()
    }
  },
  data() {
    return {
      showPhotoUploadModal: false,
      showWelcomeModal: false,
      lastUpdated: '',
      isLoadingImpactSummary: true,
      hasSeenMilestoneModal: localStorage.getItem('hasSharedMilestone'),
    }
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      isFirstDashboardVisit: (state) => state.user.isFirstDashboardVisit,
      openSessions: (state) => state.volunteer.openSessions,
      hasSharedMilestone: (state) => state.user.hasSharedMilestone,
    }),
    ...mapGetters({
      isSessionAlive: 'user/isSessionAlive',
      sessionPath: 'user/sessionPath',
      hasSelectedAvailability: 'user/hasSelectedAvailability',
      downtimeBannerMessage: 'featureFlags/downtimeBannerMessage',
      allSubjectNames: 'subjects/allSubtopicNames',
      getVolunteerMilestoneSharingStudyVariant:
        'featureFlags/getVolunteerMilestoneSharingStudyVariant',
    }),
    isCustomVolunteerPartner() {
      return config.customVolunteerPartnerOrgs.some(
        (org) => org === this.user.volunteerPartnerOrg
      )
    },

    isNewVolunteer() {
      return !this.user.pastSessions || !this.user.pastSessions.length
    },

    photoIdAction() {
      switch (this.user.photoIdStatus) {
        case 'EMPTY':
          return {
            subtitle: 'Upload a photo ID',
            status: 'DEFAULT',
          }
        case 'SUBMITTED':
          return {
            subtitle: 'Waiting for review (1-2 business days)',
            status: 'PENDING',
          }
        case 'APPROVED':
          return {
            subtitle: 'Completed',
            status: 'COMPLETED',
          }
        case 'REJECTED':
          return {
            subtitle: 'Please upload a different photo',
            status: 'ERROR',
          }
        default:
          return {
            subtitle: 'Upload a photo ID',
            status: 'DEFAULT',
          }
      }
    },

    availabilityAction() {
      if (this.hasSelectedAvailability)
        return {
          subtitle: 'Completed',
          status: 'COMPLETED',
        }

      return {
        subtitle: 'Select at least one hour',
        status: 'DEFAULT',
      }
    },

    certificationAction() {
      for (let cert in this.user.certifications) {
        // skip certification for check for required training
        if (cert === 'upchieve101') continue
        if (this.user.certifications[cert].passed)
          return {
            subtitle: 'Completed',
            status: 'COMPLETED',
          }
      }
      return {
        subtitle: 'Pass at least one quiz',
        status: 'DEFAULT',
      }
    },

    trainingAction() {
      const passedQuiz = this.user.certifications.upchieve101.passed
      if (passedQuiz)
        return {
          subtitle: 'Completed',
          status: 'COMPLETED',
        }

      const startedCourse = this.user.trainingCourses.upchieve101.progress > 0
      if (startedCourse)
        return {
          subtitle: 'In progress',
          status: 'PENDING',
        }

      return {
        subtitle: 'Go through our training',
        status: 'DEFAULT',
      }
    },

    backgroundInfoAction() {
      if (this.hasCompletedBackgroundInfo)
        return {
          subtitle: 'Completed',
          status: 'COMPLETED',
        }

      return {
        subtitle: 'Fill out form',
        status: 'DEFAULT',
      }
    },

    hasCompletedBackgroundInfo() {
      return (
        Object.hasOwn(this.user, 'occupation') &&
        this.user.occupation.length > 0 &&
        Object.hasOwn(this.user, 'country') &&
        this.user.country.length > 0
      )
    },

    approvalCardSubheader() {
      if (this.user.volunteerPartnerOrg)
        return 'Just one step left to get approved to volunteer with UPchieve!'

      return 'Student safety is our top priority! Please complete our screening process before you can start working with students.'
    },

    partnerKeysThatRequirePhotoId() {
      return config.partnerKeysThatRequirePhotoId
    },

    openVolunteerApprovalAccountActions() {
      const accountActions = [
        {
          title: 'Background information',
          subtitle: this.backgroundInfoAction.subtitle,
          status: this.backgroundInfoAction.status,
          clickFn: this.goToBackgroundInfo,
          icon: PersonIcon,
          priority: this.addSortPriorityNum(this.backgroundInfoAction.status),
        },
        {
          title: 'Proof of identity',
          subtitle: this.photoIdAction.subtitle,
          status: this.photoIdAction.status,
          clickFn: this.togglePhotoUploadModal,
          icon: PersonCardIcon,
          priority: this.addSortPriorityNum(this.photoIdAction.status),
        },
      ]

      return accountActions.sort((a, b) => a.priority - b.priority)
    },

    partnerVolunteerApprovalAccountActions() {
      const accountActions = [
        {
          title: 'Background information',
          subtitle: this.backgroundInfoAction.subtitle,
          status: this.backgroundInfoAction.status,
          clickFn: this.goToBackgroundInfo,
          icon: PersonIcon,
          priority: this.addSortPriorityNum(this.backgroundInfoAction.status),
        },
        {
          title: 'Proof of identity',
          // @todo: change copy for subtitle
          subtitle: 'Completed',
          status: 'COMPLETED',
          clickFn: () => {},
          icon: PersonCardIcon,
          priority: this.addSortPriorityNum('COMPLETED'),
        },
      ]

      return accountActions.sort((a, b) => a.priority - b.priority)
    },

    onboaringAccountActions() {
      const onboaringActions = [
        {
          title: 'Complete UPchieve 101',
          subtitle: this.trainingAction.subtitle,
          status: this.trainingAction.status,
          clickFn: this.clickUpchieve101Action,
          icon: TrainingIcon,
          priority: this.addSortPriorityNum(this.trainingAction.status),
        },
        {
          title: 'Select availability',
          subtitle: this.availabilityAction.subtitle,
          status: this.availabilityAction.status,
          clickFn: this.clickAvailabilityAction,
          icon: CalendarIcon,
          priority: this.addSortPriorityNum(this.availabilityAction.status),
        },
        {
          title: 'Unlock a subject',
          subtitle: this.certificationAction.subtitle,
          status: this.certificationAction.status,
          clickFn: this.clickCertificationAction,
          icon: CertificationIcon,
          priority: this.addSortPriorityNum(this.certificationAction.status),
        },
      ]
      return onboaringActions.sort((a, b) => a.priority - b.priority)
    },

    hourTrackingGuide() {
      if (this.isCustomVolunteerPartner)
        return 'https://cdn.upchieve.org/docs/Verizon-Volunteer-Hour-Tracking-Resource.pdf'
      return 'https://cdn.upchieve.org/docs/volunteer-hour-tracking-guide.pdf'
    },

    impactStats() {
      if (this.isCustomVolunteerPartner) {
        return this.getCustomImpactStats({
          availability: this.user.availability,
          totalVolunteerHours: this.user.totalVolunteerHours,
          pastSessions: this.user.pastSessions,
          totalQuizzesPassed: this.user.totalQuizzesPassed,
        })
      }
      return this.getImpactStats({
        availability: this.user.availability,
        pastSessions: this.user.pastSessions,
        hoursTutored: this.user.hoursTutored,
        hoursTutoredThisWeek: this.user.hoursTutoredThisWeek,
        elapsedAvailability: this.user.elapsedAvailability,
        totalQuizzesPassed: this.user.totalQuizzesPassed,
        totalStudentsHelped: this.user.uniqueStudentsHelpedCount,
        numReferredVolunteers: this.user.numReferredVolunteers,
      })
    },
    typeOfMilestone() {
      if (
        this.getVolunteerMilestoneSharingStudyVariant ===
        'completed-first-hour-of-tutoring'
      )
        return 'hour'
      else if (
        this.getVolunteerMilestoneSharingStudyVariant ===
        'tutored-first-three-students'
      )
        return 'students'
      return ''
    },
    hasCompletedFirstHourOfTutoring() {
      return (
        this.getVolunteerMilestoneSharingStudyVariant ===
          'completed-first-hour-of-tutoring' && this.user.hoursTutored >= 1
      )
    },
    hasTutoredFirstThreeStudents() {
      return (
        this.getVolunteerMilestoneSharingStudyVariant ===
          'tutored-first-three-students' &&
        this.user.uniqueStudentsHelpedCount >= 3
      )
    },
    showMilestoneModal() {
      return (
        !this.hasSeenMilestoneModal &&
        !this.hasSharedMilestone &&
        ((this.hasTutoredFirstThreeStudents &&
          this.typeOfMilestone === 'students') ||
          (this.typeOfMilestone === 'hour' &&
            this.hasCompletedFirstHourOfTutoring))
      )
    },
  },
  methods: {
    rejoinHelpSession() {
      const path = this.sessionPath
      if (path) {
        this.$router.push(path)
      } else {
        this.$router.push('/')
      }
    },

    showOnboardingModal() {
      this.$store.dispatch('app/modal/show', {
        component: 'VolunteerOnboardingModal',
        data: { alertModal: true, acceptText: 'Get started' },
      })
    },
    toggleWelcomeModal() {
      this.showWelcomeModal = !this.showWelcomeModal
    },
    handleMilestoneModalClose() {
      localStorage.setItem('hasSharedMilestone', 'true')
      this.$store.commit('user/sharedMilestone', true)
      this.hasSeenMilestoneModal = true
    },
    togglePhotoUploadModal() {
      this.showPhotoUploadModal = !this.showPhotoUploadModal
    },
    clickAvailabilityAction() {
      this.$router.push('/calendar')
    },
    clickCertificationAction() {
      this.$router.push('/training')
    },
    clickUpchieve101Action() {
      this.$router.push('/training/course/upchieve101')
    },
    goToBackgroundInfo() {
      this.$router.push('/background-information')
    },
    addSortPriorityNum(status) {
      if (status === 'COMPLETED') return 0
      if (status === 'ERROR') return 1
      if (status === 'PENDING') return 2
      if (status === 'PROGRESS') return 3
      if (status === 'DEFAULT') return 4
    },
    async getLastUpdated() {
      const res = await NetworkService.getVolunteerLastUpdated()
      if (res.data.err) {
        return 'Error retriving last update time'
      }
      const lastUpdated = res.data.lastUpdated
      return `Last updated on ${lastUpdated}`
    },
    getImpactStats({
      availability,
      pastSessions,
      hoursTutored,
      hoursTutoredThisWeek,
      totalQuizzesPassed,
      elapsedAvailability,
      totalStudentsHelped,
      numReferredVolunteers,
    }) {
      let numHoursSelected = 0

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

      const formatFn = ({ hours, minutes }) => `${hours} h ${minutes} m`

      // (4) Hours tutored
      const numHoursTutored = hoursToHoursAndMinutes(
        Number(hoursTutored) ?? 0,
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
    },
    getCustomImpactStats({
      availability,
      totalVolunteerHours,
      pastSessions,
      totalQuizzesPassed,
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
    },
    async initImpactSummary() {
      try {
        if (this.isCustomVolunteerPartner) {
          this.lastUpdated = await this.getLastUpdated()
        }
      } finally {
        this.isLoadingImpactSummary = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.btn {
  height: 60px;
  background-color: #16d2aa;
  border: none;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  color: white;
  line-height: 40px;

  &:hover {
    background-color: #16d2aa;
  }

  &:disabled {
    color: white;
  }

  &.rejoinSessionBtn {
    border-radius: 30px;
    width: 300px;
    margin-top: 25px;
  }
}

.volunteer-dashboard {
  @include flex-container(column);
  padding: 40px 15px;

  @include breakpoint-above('medium') {
    display: inline-flex;
    min-width: 100%;
    padding: 40px;
  }

  &__body {
    @include child-spacing(top, 16px);
    @include child-spacing(right, 0);
    margin-top: 40px;

    @include breakpoint-above('huge') {
      @include child-spacing(top, 0);
      @include child-spacing(right, 40px);

      @include flex-container(row);

      & > * {
        flex-basis: 50%;
      }
    }
  }
}

.dashboard-card {
  background: #fff;
  border-radius: 8px;
  padding: 40px 0 24px;

  &__icon {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 24px;
  }

  &__title {
    margin-bottom: 4px;
    font-size: 24px;
    font-weight: 500;
    line-height: 1.25;
    text-align: center;
  }

  &__subtitle {
    font-size: 16px;
    color: $c-secondary-grey;
    margin-bottom: 24px;
    padding: 0 15px;
    text-align: center;

    @include breakpoint-above('medium') {
      padding: 0 42px;
    }
  }

  .account-action {
    margin: 0 10px;

    @include breakpoint-above('medium') {
      margin: 0 20px;
    }
  }

  &__link {
    text-align: center;
  }
}

.students-waiting {
  padding: 0;

  @include breakpoint-above('medium') {
    padding: 0 30px;
  }
}

.volunteer-impact {
  padding: 0 10px;

  @include breakpoint-above('medium') {
    padding: 0 30px;
  }

  &__stats {
    width: 100%;
    padding: 10px 5px 0;
  }

  &__stat-label {
    text-align: left;
  }

  &__stat {
    display: flex;
    justify-content: space-between;
    padding: 15px 0;
    font-size: 16px;
  }

  &__stat-value {
    font-weight: bold;
    text-align: right;
  }

  &__last-updated {
    width: 100%;
    text-align: right;
    padding: 10px 0;
    font-size: 12px;
  }
}

.dashboard-notice {
  background: $c-warning-orange;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  margin: 20px 0 -20px;
  padding: 15px;
  text-align: center;

  a {
    color: #fff;
    white-space: pre-line;

    &:hover {
      color: #f3f3f3;
      text-decoration: none;
    }
  }
}

.notifications-button {
  @include flex-container(row, flex-end);
  margin-bottom: 1.4em;
}

.track-hours-link {
  @include font-category('button');
  display: inline-flex;
  align-items: center;
  margin: 0 auto;
  padding: 0;
  color: $c-success-green;
  text-decoration: none;

  &:hover {
    text-decoration: none;
  }
}

.arrow-icon {
  fill: $c-success-green;
  height: 16px;
  width: 16px;
  margin-top: 2px;
  margin-left: 8px;

  &--banner {
    height: 16px;
    width: 16px;
    fill: $upchieve-white;
    margin-left: 0.5em;
  }
}

.rejoin-session-container {
  text-align: center;
}

.loader--center {
  text-align: center;
}

.stat-tooltip:before {
  transition-duration: 0ms;
}

.impact-summary {
  @include flex-container(row, center, stretch);
  gap: 12px;
  padding: 16px;

  @include breakpoint-below('small') {
    @include flex-container(column, center, center);
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
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
    width: 90%;
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
</style>
