<template>
  <div v-if="!isAutoFlowUser" class="SidebarLinks">
    <template v-if="$route.path.indexOf('/onboarding') !== -1"></template>

    <template v-else-if="authenticated">
      <sidebar-link to="/dashboard" text="Dashboard">
        <house-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="isStudent && isProgressReportsActive"
        text="My Progress"
        class="SidebarLinks__container"
        to="/sessions/progress"
      >
        <your-progress-icon class="icon" />
        <activity-dot
          v-if="hasUnreadProgressOverviewReports"
          class="SidebarLinks__notification"
        />
      </sidebar-link>

      <sidebar-link
        v-if="isStudent"
        to="/sessions/history"
        text="Session History"
      >
        <archive-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="isStudent"
        to="/favorite-coaches"
        text="Favorite Coaches"
      >
        <heart-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="isVolunteer"
        to="/training"
        text="Training"
        data-testid="training-link"
      >
        <graduation-cap-icon class="icon" />
      </sidebar-link>

      <sidebar-link v-if="isVolunteer" to="/calendar" text="Schedule">
        <calendar-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="isVolunteer"
        to="/sessions/history"
        text="Session History"
      >
        <archive-icon class="icon" />
      </sidebar-link>

      <sidebar-link v-if="isAdmin" to="/admin" text="Admin">
        <folder-icon class="icon" />
      </sidebar-link>

      <sidebar-link to="/profile" text="Profile">
        <portrait-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="showDashboardRedesign"
        text="Refer a Friend"
        :onClick="openReferFriendModal"
      >
        <refer-friend-icon class="icon" />
      </sidebar-link>

      <div v-if="!mobileMode" class="SidebarLinks-about">About UPchieve</div>
      <sidebar-link to="/contact" text="Contact us">
        <envelope-icon class="icon" />
      </sidebar-link>
      <sidebar-link
        v-if="isVolunteer"
        to="https://join.slack.com/t/upchieveaccommunity/shared_invite/zt-2ns6tqw3b-uSbo7R9thclbmyOHdnZ1ZA"
        text="Community"
        :openNewTab="true"
      >
        <slack-logo-icon class="icon" />
      </sidebar-link>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import SidebarLink from './SidebarLink.vue'
import ArchiveIcon from '@/assets/archive.svg'
import CalendarIcon from '@/assets/sidebar_icons/calendar.svg'
import EnvelopeIcon from '@/assets/sidebar_icons/envelope.svg'
import FolderIcon from '@/assets/sidebar_icons/folder.svg'
import GraduationCapIcon from '@/assets/sidebar_icons/graduation-cap.svg'
import HeartIcon from '@/assets/heart.svg'
import HouseIcon from '@/assets/sidebar_icons/house.svg'
import PortraitIcon from '@/assets/sidebar_icons/portrait.svg'
import ReferFriendIcon from '@/assets/sidebar_icons/refer-friend-icon.svg'
import ReferralSVG from '@/assets/dashboard_icons/student/referral.svg'
import SlackLogoIcon from '@/assets/slack-logo-icon.svg'
import YourProgressIcon from '@/assets/your-progress.svg'
import AnalyticsService from '@/services/AnalyticsService'
import ActivityDot from '@/components/ActivityDot.vue'
import { EVENTS } from '@/consts'

export default {
  components: {
    SidebarLink,
    ArchiveIcon,
    CalendarIcon,
    EnvelopeIcon,
    FolderIcon,
    GraduationCapIcon,
    HeartIcon,
    HouseIcon,
    PortraitIcon,
    ReferFriendIcon,
    SlackLogoIcon,
    YourProgressIcon,
    ActivityDot,
  },
  props: {
    authenticated: Boolean,
    isAdmin: Boolean,
    mobileMode: Boolean,
  },
  computed: {
    ...mapGetters({
      isProgressReportsActive: 'featureFlags/isProgressReportsActive',
      isAutoFlowUser: 'user/isAutoFlowUser',
      showDashboardRedesign: 'user/showDashboardRedesign',
      hasUnreadProgressOverviewReports: 'user/hasUnreadProgressOverviewReports',
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      isTeacher: 'user/isTeacher',
    }),
  },
  methods: {
    openReferFriendModal() {
      AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_REFER_A_FRIEND)
      let header
      let subcopy
      if (this.referralCopy === 'baseline') {
        header =
          'Know a friend or classmate who would benefit from free 24/7 tutoring?'
        subcopy = 'Invite them to UPchieve!'
      } else if (this.referralCopy === 'small-gift-card') {
        header =
          'UPchieve can help your friends succeed! Refer 5 friends to UPchieve and get a $25 gift card when they sign up.'
        subcopy = 'Refer your friends now'
      } else if (this.referralCopy === 'emotional-appeal-struggling') {
        header =
          'Do you have friends, siblings, or classmates struggling in a class? When you share UPchieve, you can help a struggling friend succeed!'
        subcopy = 'Invite them to UPchieve!'
      }
      this.$store.dispatch('app/modal/show', {
        component: 'ReferralModal',
        data: {
          svg: ReferralSVG,
          showAccept: false,
          header,
          subcopy,
        },
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.SidebarLinks {
  @include flex-container(column);
  @include child-spacing(top, 16px);

  &-about {
    @include font-category('body');
    color: $c-secondary-grey;
    margin-top: 40px;
    text-align: left;
  }

  &__container {
    position: relative;
  }

  &__notification {
    order: 3;
    margin-left: 0.4em;
  }
}

.icon {
  margin-right: 0.8em;
  width: 24px;
}
</style>
