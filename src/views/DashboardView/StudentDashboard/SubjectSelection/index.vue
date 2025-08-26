<template>
  <div class="SubjectSelection">
    <h2 v-if="showDashboardRedesign">
      Choose from all of our available subjects!
    </h2>
    <loader v-if="isFetchingSubjects" class="uc-column items-center" />
    <p v-else-if="fetchingSubjectsError" class="error">
      We had trouble loading the list of subjects. Please try refreshing the
      page.
    </p>
    <div v-else>
      <recent-subjects
        v-if="isMostRecentSubjectsActive"
        :disabled="isCardDisabled"
      />

      <div :class="showDashboardRedesign ? 'cards' : 'cards-old'">
        <section v-if="isGoalSettingSessionEnabled" class="goal-session">
          <div class="goal-session__card">
            <esl-icon />
            <h2 class="goal-session__title">Study Plan</h2>
            <p class="goal-session__description">
              Stressed about grades, tests, or college? We'll help you make a
              clear personalized plan so you know your next move.
            </p>
            <p class="goal-session__time-description">
              {{ goalSettingSessionTimeText }}
            </p>
            <large-button
              @click="handleGoalSettingSession"
              primary
              :disabled="!isRequestingGoalSettingSessionAvailable"
              >Start session</large-button
            >
          </div>
        </section>
        <subject-card
          v-for="(card, index) in cards"
          v-bind:key="index"
          :title="card.title"
          :subtitle="card.subtitle"
          :svg="card.svg"
          :topic="card.topic"
          :subtopics="card.subtopics"
          :subtopicDisplayNames="card.subtopicDisplayNames"
          :button-text="card.buttonText"
          :routeTo="card.routeTo"
          :isDisabled="isCardDisabled"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import moment from 'moment'
import SubjectCard from './SubjectCard.vue'
import ReferralSVG from '@/assets/dashboard_icons/student/referral.svg'
import LightBulbSVG from '@/assets/dashboard_icons/student/light-bulb.svg'
import Loader from '@/components/Loader.vue'
import LargeButton from '@/components/LargeButton.vue'
import RecentSubjects from './RecentSubjects.vue'
import EslIcon from '@/assets/subject_icons/esl.svg'

export default {
  name: 'subject-selection',
  components: { SubjectCard, Loader, RecentSubjects, EslIcon, LargeButton },
  beforeUnmount() {
    clearTimeout(this.waitingPeriodTimeoutId)
  },
  data() {
    return {
      disableSubjectCard: false,
    }
  },
  computed: {
    ...mapState({
      latestSession: (state) => state.session.latestSession,
      subjects: (state) => state.subjects.subjects,
      isFetchingSubjects: (state) => state.subjects.isFetchingSubjects,
      fetchingSubjectsError: (state) => state.subjects.fetchingSubjectsError,
      user: (state) => state.user.user,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      isSessionAlive: 'user/isSessionAlive',
      topicCards: 'subjects/sessionRequestTopicCards',
      showDashboardRedesign: 'user/showDashboardRedesign',
      isMostRecentSubjectsActive: 'featureFlags/isMostRecentSubjectsActive',
      hasCooldown: 'session/hasCooldown',
      isGoalSettingSessionEnabled: 'featureFlags/isGoalSettingSessionEnabled',
      goalSettingSessionPayload: 'featureFlags/goalSettingSessionPayload',
    }),
    cards() {
      const cards = [...this.topicCards]
      if (!this.showDashboardRedesign) {
        cards.push({
          title: 'Give Feedback',
          subtitle:
            'Help us improve by telling us what new subjects and features you want!',
          svg: LightBulbSVG,
          buttonText: 'Give feedback',
          routeTo: '/contact',
        })

        cards.push({
          title: 'Invite Your Friends',
          subtitle: 'Share UPchieve with a friend!',
          svg: ReferralSVG,
          buttonText: 'Learn More',
        })
      }
      return cards
    },
    isCardDisabled() {
      return (
        this.hasCooldown ||
        this.isSessionAlive ||
        this.user.banType === 'complete'
      )
    },
    isRequestingGoalSettingSessionAvailable() {
      const { startHour = 9, endHour = 17 } =
        this.goalSettingSessionPayload || {}
      const now = moment().tz('America/New_York')
      const hour = now.hour()
      const day = now.day()
      const isWeekday = day >= 1 && day <= 5

      return (
        !this.isCardDisabled && isWeekday && hour >= startHour && hour < endHour
      )
    },
    goalSettingSessionTimeText() {
      const { startHour = 9, endHour = 17 } =
        this.goalSettingSessionPayload || {}
      const start = moment.tz('America/New_York').hour(startHour).minute(0)
      const end = moment.tz('America/New_York').hour(endHour).minute(0)
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const startLocal = start.clone().tz(userTz)
      const endLocal = end.clone().tz(userTz)
      return `Available M-F from ${startLocal.format('h:mm A')} to ${endLocal.format('h:mm A')} ${startLocal.format('z')}.`
    },
  },
  methods: {
    async handleGoalSettingSession() {
      if (!this.isRequestingGoalSettingSessionAvailable) return
      await this.$store.commit('session/setIsGoalSettingSession', true)
      this.$router.push('/session/college/college-prep/')
    },
  },
}
</script>

<style lang="scss" scoped>
.SubjectSelection {
  margin-top: 30px;
}

h2 {
  @include font-category('heading');
  margin: 0;
  padding: 0;
  text-align: left;
}

.cards-old {
  @include flex-container(column);
  @include child-spacing(top, 16px);
  margin-top: 10px;

  @include breakpoint-above('medium') {
    @include child-spacing(top, 0);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 40px;
  }
}

.cards {
  column-gap: 16px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 20px;
  row-gap: 16px;

  @include breakpoint-below('huge') {
    grid-template-columns: repeat(2, 1fr);
  }

  @include breakpoint-below('small') {
    grid-template-columns: repeat(1, 1fr);
  }
}

.waiting-period {
  @include font-category('body');
  color: white;
  margin-bottom: 40px;
  background: $c-warning-orange;
  padding: 1em;
  border-radius: 8px;
  text-align: center;

  @include breakpoint-above('medium') {
    margin-bottom: initial;
  }

  // @note - temporary fix for if the mobile waiting period
  //         message happens to render on a large screen
  @include breakpoint-above('large') {
    @include flex-container(row, center, center);
    @include font-category('heading');
    margin-top: initial;
  }
}

.loader--center {
  margin-right: auto;
  margin-left: auto;
  width: 100%;
}

.error {
  color: $c-error-red;
}

.goal-session {
  &__card {
    @include flex-container(column, center, center);
    background-color: $upchieve-white;
    border-radius: 8px;
    padding: 2em;
    height: 100%;
  }

  &__title {
    @include font-category('heading');
    font-weight: 500;
    margin-top: 16px;
    margin-bottom: 8px;

    @include breakpoint-above('medium') {
      @include font-category('display-small');
    }
  }

  &__description {
    font-weight: 400;
    color: $c-secondary-grey;
    text-align: center;
  }

  &__time-description {
    @include font-category('helper-text');
    color: $c-secondary-grey;
    font-style: italic;
  }
}
</style>
