<template>
  <div class="student-dashboard">
    <dashboard-banner />
    <div class="dashboard-notices">
      <div
        v-if="!downtimeMessage && noticeMessage"
        class="dashboard-notice"
        :class="isLowCoachHour && 'dashboard-notice--warn'"
      >
        {{ noticeMessage }}
      </div>

      <div
        v-if="downtimeMessage"
        class="dashboard-notice"
        :class="'dashboard-notice--downtime'"
      >
        <a href="https://upchieve.statuspage.io" target="_blank">{{ downtimeMessage }}</a>
      </div>
    </div>

    <subject-selection />
    <first-session-congrats-modal
      v-if="showFirstSessionCongratsModal"
      :closeModal="toggleFirstSessionCongratsModal"
    />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import DashboardBanner from '../DashboardBanner'
import SubjectSelection from './SubjectSelection'
import FirstSessionCongratsModal from './FirstSessionCongratsModal'
import moment from 'moment-timezone'

const defaultHeaderData = {
  component: 'DefaultHeader'
}

const activeHeaderData = {
  component: 'RejoinSessionHeader'
}

const bannedHeaderData = {
  component: 'BannedStudentHeader'
}

export default {
  name: 'student-dashboard',
  components: {
    DashboardBanner,
    SubjectSelection,
    FirstSessionCongratsModal,
  },
  created() {
    if (this.user && this.user.isBanned) {
      this.$store.dispatch('app/header/show', bannedHeaderData)
    }

    if (this.isSessionAlive) {
      this.$store.dispatch('app/header/show', activeHeaderData)
    }

    if (this.isFirstDashboardVisit) {
      this.$store.dispatch('app/modal/show', {
        component: 'StudentOnboardingModal',
        data: {
          showTemplateButtons: false
        }
      })
    }

    if (
      this.isReferFriendsActive &&
      this.hasSeenFirstSessionCongratsModal
    )
      this.toggleFirstSessionCongratsModal()

    this.currentHour = moment()
      .tz('America/New_York')
      .hour()
  },
  data() {
    return {
      currentHour: 0,
      showFirstSessionCongratsModal: false
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      isFirstDashboardVisit: state => state.user.isFirstDashboardVisit
    }),
    ...mapGetters({
      isSessionAlive: 'user/isSessionAlive',
      isReferFriendsActive: 'featureFlags/isReferFriendsActive',
      isDowntimeBannerActive: 'featureFlags/isDowntimeBannerActive',
    }),
    isLowCoachHour() {
      return this.currentHour < 12
    },
    noticeMessage() {
      if (this.currentHour >= 12 && this.currentHour <= 23)
        return 'Heads up: this is a great time to make a request! We have plenty of coaches available between 12pm - 12 am ET.'
      if (this.currentHour >= 3 && this.currentHour <= 9)
        return 'Heads up: we have very few coaches available right now. Try making requests between 12pm-12am ET when possible'
      if (
        (this.currentHour >= 0 && this.currentHour < 3) ||
        (this.currentHour >= 9 && this.currentHour < 12)
      )
        return 'Heads up: we have fewer coaches available than normal right now. Try making requests between 12pm-12am ET when possible!'

      return ''
    },
    downtimeMessage() {
      if (this.isDowntimeBannerActive) {
        return 'UPchieve is experiencing recurring interruptions. If your session is interrupted, please wait a few seconds and refresh.'
      } else {
        return ''
      }
    },
    hasSeenFirstSessionCongratsModal() {
      return (
        this.user &&
        this.user.pastSessions.length === 1 &&
        !localStorage.getItem('viewedFirstSessionCongratsModal')
      )
    }
  },
  methods: {
    toggleFirstSessionCongratsModal() {
      this.showFirstSessionCongratsModal = !this.showFirstSessionCongratsModal
    }
  },
  watch: {
    isSessionAlive(isAlive, prevIsAlive) {
      if (!isAlive) {
        this.$store.dispatch('app/header/show', defaultHeaderData)
        if (
          this.isReferFriendsActive &&
          prevIsAlive &&
          this.hasSeenFirstSessionCongratsModal
        )
          this.toggleFirstSessionCongratsModal()
      } else {
        this.$store.dispatch('app/header/show', activeHeaderData)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.student-dashboard {
  @include flex-container(column);
  padding: 40px 20px;

  @include breakpoint-above('medium') {
    display: inline-flex;
    min-width: 100%;
    padding: 40px;
  }
}

.dashboard-notice {
  padding: 15px;
  background-color: $c-success-green;
  border-radius: 8px;
  margin-top: 20px;
  font-weight: 500;
  font-size: 16px;
  color: #fff;

  a {
    color: #fff;

    &:hover {
      color: #f3f3f3;
      text-decoration: none;
    }
  }

  &:last-child {
    // TODO: a cleaner way to handle spacing issues with class SubjectSelection
    margin-bottom: -20px;
  }

  &--warn {
    background-color: $c-warning-orange;
  }

  &--info {
    background-color: $c-information-blue;
  }

  &--downtime {
    color: #fff;
    background-color: $c-information-blue;
  }
}
</style>
