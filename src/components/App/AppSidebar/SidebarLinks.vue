<template>
  <div v-if="!isAutoFlowUser" class="SidebarLinks">
    <template v-if="$route.path.indexOf('/onboarding') !== -1"></template>

    <template v-else-if="authenticated">
      <ai-tutor-button
        v-if="isStudent && isStandaloneAiEnabled"
      ></ai-tutor-button>

      <sidebar-link v-if="!isTeacher" to="/dashboard" text="Dashboard">
        <house-icon class="icon" />
      </sidebar-link>

      <sidebar-link v-else to="/dashboard" text="My Classes">
        <book-icon class="icon" />
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
        v-if="showStudentMyClassesLink"
        to="/classes"
        text="My Classes"
      >
        <book-icon class="icon" />
        <activity-dot
          v-if="hasIncompleteAssignments"
          class="SidebarLinks__notification"
        />
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
        v-if="isVolunteer"
        :onClick="openReferFriendModal"
        text="Invite a Friend"
      >
        <refer-friend-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="showDashboardRedesign"
        text="Refer a Friend"
        :onClick="openReferFriendModal"
      >
        <refer-friend-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="isStudent && productFlags.impactStudyEnrollmentAt"
        to="/rewards"
        text="Rewards"
      >
        <rewards-sidebar-icon class="icon icon--rewards" />
      </sidebar-link>

      <div v-if="!mobileMode" class="SidebarLinks-about">About UPchieve</div>
      <sidebar-link to="/contact" text="Contact us">
        <envelope-icon class="icon" />
      </sidebar-link>
      <sidebar-link
        v-if="isVolunteer"
        to="https://join.slack.com/t/upchieveaccommunity/shared_invite/zt-315owtp5i-TuwFrOlKvBEC9UzZrTob6g"
        text="Community"
        :openNewTab="true"
      >
        <slack-logo-icon class="icon" />
      </sidebar-link>
    </template>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import SidebarLink from './SidebarLink.vue'
import ArchiveIcon from '@/assets/archive.svg'
import BookIcon from '@/assets/book-icon.svg'
import CalendarIcon from '@/assets/sidebar_icons/calendar.svg'
import EnvelopeIcon from '@/assets/sidebar_icons/envelope.svg'
import FolderIcon from '@/assets/sidebar_icons/folder.svg'
import GraduationCapIcon from '@/assets/sidebar_icons/graduation-cap.svg'
import HeartIcon from '@/assets/heart.svg'
import HouseIcon from '@/assets/sidebar_icons/house.svg'
import PortraitIcon from '@/assets/sidebar_icons/portrait.svg'
import ReferFriendIcon from '@/assets/sidebar_icons/refer-friend-icon.svg'
import SlackLogoIcon from '@/assets/slack-logo-icon.svg'
import YourProgressIcon from '@/assets/your-progress.svg'
import RewardsSidebarIcon from '@/assets/rewards-sidebar-icon.svg'
import AnalyticsService from '@/services/AnalyticsService'
import ActivityDot from '@/components/ActivityDot.vue'
import { EVENTS } from '@/consts'
import AiTutorButton from '../AiTutorButton.vue'
import { getIncompleteAssignments } from '@/utils/student-assignments-utils'

export default {
  components: {
    SidebarLink,
    ArchiveIcon,
    BookIcon,
    CalendarIcon,
    EnvelopeIcon,
    FolderIcon,
    GraduationCapIcon,
    HeartIcon,
    AiTutorButton,
    HouseIcon,
    PortraitIcon,
    ReferFriendIcon,
    SlackLogoIcon,
    YourProgressIcon,
    RewardsSidebarIcon,
    ActivityDot,
  },
  props: {
    authenticated: Boolean,
    isAdmin: Boolean,
    mobileMode: Boolean,
    numberOfStudentClasses: Number,
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      productFlags: (state) => state.productFlags.flags,
    }),
    ...mapGetters({
      isProgressReportsActive: 'featureFlags/isProgressReportsActive',
      isAutoFlowUser: 'user/isAutoFlowUser',
      showDashboardRedesign: 'user/showDashboardRedesign',
      hasUnreadProgressOverviewReports: 'user/hasUnreadProgressOverviewReports',
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      isTeacher: 'user/isTeacher',
      isAiTutorActive: 'featureFlags/aiTutor',
      userType: 'user/userType',
    }),
    isStandaloneAiEnabled() {
      return (
        this.isAiTutorActive && this.isAiTutorActive.includes('stand-alone')
      )
    },
    showStudentMyClassesLink() {
      return this.isStudent && this.numberOfStudentClasses > 0
    },
    hasIncompleteAssignments() {
      return !!getIncompleteAssignments(this.user.studentAssignments).length
    },
  },
  methods: {
    openReferFriendModal() {
      AnalyticsService.captureEvent(
        EVENTS.USER_CLICKED_REFER_A_FRIEND_SIDEBAR_LINK,
        {
          userType: this.userType,
        }
      )
      this.$store.dispatch('app/modal/show', {
        component: 'ReferralModal',
        data: {
          showAccept: false,
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
  &--rewards {
    height: 24px;
  }
}
</style>
