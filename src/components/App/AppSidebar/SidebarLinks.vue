<template>
  <div v-if="!isAutoFlowUser" class="SidebarLinks">
    <template v-if="$route.path.indexOf('/onboarding') !== -1"></template>

    <template v-else-if="authenticated">
      <ai-tutor-button
        v-if="isStudent && isStandaloneAiEnabled"
      ></ai-tutor-button>

      <sidebar-link
        v-if="!isTeacher"
        to="/dashboard"
        text="Dashboard"
        id="dashboard-sidebar-link"
      >
        <house-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-else
        to="/dashboard"
        text="My Classes"
        id="my-classes-sidebar-link"
      >
        <book-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="isStudent && isProgressReportsActive"
        text="My Progress"
        class="SidebarLinks__container"
        to="/sessions/progress"
        id="my-progress-sidebar-link"
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
        id="session-history-sidebar-link"
      >
        <archive-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="isStudent"
        to="/favorite-coaches"
        text="Favorite Coaches"
        id="favorite-coaches-sidebar-link"
      >
        <heart-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="isStudent"
        to="/classes"
        text="My Classes"
        id="student-my-classes-sidebar-link"
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
        id="training-sidebar-link"
      >
        <graduation-cap-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="isVolunteer"
        to="/calendar"
        text="Schedule"
        id="calendar-sidebar-link"
      >
        <calendar-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="isVolunteer"
        to="/sessions/history"
        text="Session History"
        id="session-history-sidebar-link"
      >
        <archive-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="isAdmin"
        to="/admin"
        text="Admin"
        id="admin-sidebar-link"
      >
        <folder-icon class="icon" />
      </sidebar-link>

      <sidebar-link to="/profile" text="Profile" id="profile-sidebar-link">
        <portrait-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="isVolunteer && isBecomeAnAmbassadorCtaEnabled"
        :onClick="openAmbassadorReferralModal"
        text="Level Up Impact"
        id="volunteer-referral-sidebar-link"
      >
        <refer-friend-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="isVolunteer && !isBecomeAnAmbassadorCtaEnabled"
        :onClick="openReferFriendModal"
        text="Invite a Friend"
        id="volunteer-referral-sidebar-link"
      >
        <refer-friend-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="showDashboardRedesign"
        text="Refer a Friend"
        :onClick="openReferFriendModal"
        id="refer-a-friend-sidebar-link"
      >
        <refer-friend-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="isStudent && productFlags.impactStudyEnrollmentAt"
        to="/rewards"
        text="Rewards"
        id="rewards-sidebar-link"
      >
        <rewards-sidebar-icon class="icon icon--rewards" />
      </sidebar-link>

      <div v-if="!mobileMode" class="SidebarLinks-about">About UPchieve</div>
      <sidebar-link
        to="/contact"
        text="Contact us"
        id="contact-us-sidebar-link"
      >
        <hand-wave-icon class="icon" />
      </sidebar-link>
      <sidebar-link
        v-if="isVolunteer"
        to="https://join.slack.com/t/upchieveaccommunity/shared_invite/zt-34pnhdfs2-BPsAT5JoKHcgxp6AG9Nsrg"
        text="Community"
        :openNewTab="true"
        id="community-sidebar-link"
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
import FolderIcon from '@/assets/sidebar_icons/folder.svg'
import GraduationCapIcon from '@/assets/sidebar_icons/graduation-cap.svg'
import HandWaveIcon from '@/assets/sidebar_icons/hand-wave.svg'
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
    FolderIcon,
    GraduationCapIcon,
    HandWaveIcon,
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
      isBecomeAnAmbassadorCtaEnabled:
        'featureFlags/isBecomeAnAmbassadorCtaEnabled',
    }),
    isStandaloneAiEnabled() {
      return (
        this.isAiTutorActive && this.isAiTutorActive.includes('stand-alone')
      )
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
    openAmbassadorReferralModal() {
      AnalyticsService.captureEvent(
        EVENTS.USER_CLICKED_LEVEL_UP_IMPACT_SIDEBAR_LINK,
        { userType: this.userType }
      )
      this.$store.dispatch('app/modal/show', {
        component: 'AmbassadorReferralModal',
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
