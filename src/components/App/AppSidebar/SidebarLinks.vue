<template>
  <div v-if="!isAutoFlowUser" class="SidebarLinks">
    <template v-if="$route.path.indexOf('/onboarding') !== -1"></template>

    <div v-else-if="authenticated" class="uc-column justify-between h-full">
      <div class="top">
        <ai-tutor-button
          v-if="isStudent && isStandaloneAiEnabled"
        ></ai-tutor-button>

        <sidebar-link
          v-if="!isTeacher"
          to="/dashboard"
          text="Dashboard"
          id="dashboard-sidebar-link"
        >
          <home-icon class="icon" />
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
          v-if="isStudent"
          @click="onClickMyProgressSidebarLink"
          text="My Progress"
          class="SidebarLinks__container"
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
          v-if="isStudent"
          to="/journeys"
          text="My Journeys"
          id="journeys-sidebar-link"
        >
          <compass-icon class="icon compass-icon" />
        </sidebar-link>

        <sidebar-link
          v-if="isStudent"
          to="/favorite-coaches"
          text="Favorite Coaches"
          id="favorite-coaches-sidebar-link"
        >
          <star-icon class="icon star-icon" />
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
          v-if="isVolunteer | isStudent"
          to="/sessions/history"
          text="Session History"
          id="session-history-sidebar-link"
        >
          <clock-icon class="icon" />
        </sidebar-link>

        <sidebar-link
          v-if="isStudent && productFlags.impactStudyEnrollmentAt"
          to="/rewards"
          text="Rewards"
          id="rewards-sidebar-link"
        >
          <rewards-sidebar-icon class="icon" />
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
          v-if="(isVolunteer && isMemberOfNTHSGroup) || showCreateNTHSGroupLink"
          :to="showCreateNTHSGroupLink ? '/groups/create' : '/groups'"
          text="My Team"
          id="nths-group-sidebar-link"
        >
          <groups-icon class="icon" />
        </sidebar-link>

        <sidebar-link
          v-if="isAdmin"
          to="/admin"
          text="Admin"
          id="admin-sidebar-link"
        >
          <folder-icon class="icon" />
        </sidebar-link>
      </div>

      <div class="bottom">
        <div class="SidebarLinks-about">About UPchieve</div>
        <sidebar-link
          to="/contact"
          text="Contact us"
          id="contact-us-sidebar-link"
        >
          <hand-wave-icon class="icon" />
        </sidebar-link>
        <sidebar-link
          v-if="isVolunteer && showSlackButton"
          to="https://upchieveaccommunity.slack.com/join/shared_invite/zt-3ddtu0s8n-0GTFhvj674v_BTXnc8tlmQ"
          text="Community"
          :openNewTab="true"
          id="community-sidebar-link"
        >
          <slack-logo-icon class="icon" />
        </sidebar-link>
      </div>
    </div>
    <AmbassadorReferralModal
      v-if="ambassadorReferralModalIsOpen"
      :closeModal="closeAmbassadorReferralModal"
    />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import SidebarLink from './SidebarLink.vue'
import BookIcon from '@/assets/icons/open_book_icon.svg'
import CalendarIcon from '@/assets/icons/calendar_icon.svg'
import ClockIcon from '@/assets/icons/clock_icon.svg'
import FolderIcon from '@/assets/icons/folder_icon.svg'
import GraduationCapIcon from '@/assets/icons/graduation_cap_icon.svg'
import HandWaveIcon from '@/assets/icons/hand-wave.svg'
import StarIcon from '@/assets/icons/star_icon.svg'
import HomeIcon from '@/assets/icons/home_icon.svg'
import ReferFriendIcon from '@/assets/icons/refer_friend_icon.svg'
import GroupsIcon from '@/assets/icons/groups_icon.svg'
import SlackLogoIcon from '@/assets/slack-logo-icon.svg'
import YourProgressIcon from '@/assets/icons/trending_up_icon.svg'
import RewardsSidebarIcon from '@/assets/icons/star_icon.svg'
import CompassIcon from '@/assets/compass.svg'
import AnalyticsService from '@/services/AnalyticsService'
import ActivityDot from '@/components/ActivityDot.vue'
import { EVENTS } from '@/consts'
import AiTutorButton from '../AiTutorButton.vue'
import { getIncompleteAssignments } from '@/utils/student-assignments-utils'
import AmbassadorReferralModal from '@/views/AmbassadorReferralModal.vue'

export default {
  components: {
    SidebarLink,
    BookIcon,
    CalendarIcon,
    ClockIcon,
    FolderIcon,
    GraduationCapIcon,
    HandWaveIcon,
    StarIcon,
    AiTutorButton,
    HomeIcon,
    ReferFriendIcon,
    SlackLogoIcon,
    YourProgressIcon,
    RewardsSidebarIcon,
    ActivityDot,
    CompassIcon,
    AmbassadorReferralModal,
    GroupsIcon,
  },
  created() {
    if (import.meta.env.NODE_ENV !== 'test') {
      this.$store.dispatch('volunteer/fetchNTHSGroupsForUser')
    }
  },
  props: {
    authenticated: Boolean,
    isAdmin: Boolean,
    numberOfStudentClasses: Number,
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      productFlags: (state) => state.productFlags.flags,
      volunteersNTHSGroups: (state) => state.volunteer.NTHSGroups,
    }),
    ...mapGetters({
      isAutoFlowUser: 'user/isAutoFlowUser',
      hasUnreadProgressOverviewReports: 'user/hasUnreadProgressOverviewReports',
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      isTeacher: 'user/isTeacher',
      isAiTutorActive: 'featureFlags/aiTutor',
      userType: 'user/userType',
      isBecomeAnAmbassadorCtaEnabled:
        'featureFlags/isBecomeAnAmbassadorCtaEnabled',
      isDisableStudentsJoinSlackCommunityEnabled:
        'featureFlags/isDisableStudentsJoinSlackCommunityEnabled',
      isDisabledSlackButtonForUnapprovedVolunteersEnabled:
        'featureFlags/isDisabledSlackButtonForUnapprovedVolunteersEnabled',
      isNTHSGroupsPageEnabled: 'featureFlags/isNTHSGroupsPageEnabled',
      userIsApprovedNTHSPresident: 'featureFlags/userIsApprovedNTHSPresident',
    }),
    isMemberOfNTHSGroup() {
      return (
        this.isNTHSGroupsPageEnabled && this.volunteersNTHSGroups.length > 0
      )
    },
    showCreateNTHSGroupLink() {
      return (
        this.isNTHSGroupsPageEnabled &&
        this.userIsApprovedNTHSPresident &&
        this.volunteersNTHSGroups.length === 0
      )
    },
    isStandaloneAiEnabled() {
      return (
        this.isAiTutorActive && this.isAiTutorActive.includes('stand-alone')
      )
    },
    hasIncompleteAssignments() {
      return !!getIncompleteAssignments(this.user.studentAssignments).length
    },
    showSlackButton() {
      return (
        !this.isDisableStudentsJoinSlackCommunityEnabled &&
        !this.isDisabledSlackButtonForUnapprovedVolunteersEnabled
      )
    },
  },
  data() {
    return {
      ambassadorReferralModalIsOpen: false,
    }
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
      this.ambassadorReferralModalIsOpen = true
    },
    closeAmbassadorReferralModal() {
      AnalyticsService.captureEvent(EVENTS.REFERRAL_MODAL_CLOSE)
      this.ambassadorReferralModalIsOpen = false
    },
    onClickMyProgressSidebarLink() {
      AnalyticsService.captureEvent(
        EVENTS.USER_CLICKED_MY_PROGRESS_SIDEBAR_LINK,
        {
          hadUnreadIndicator: this.hasUnreadProgressOverviewReports,
        }
      )
      this.$router.push('/sessions/progress')
    },
  },
  watch: {
    hasUnreadProgressOverviewReports(newVal, prevVal) {
      if (newVal && !prevVal)
        AnalyticsService.captureEvent(
          EVENTS.PROGRESS_REPORT_SIDEBAR_INDICATOR_SHOWN
        )
    },
  },
}
</script>

<style lang="scss" scoped>
.SidebarLinks {
  @include flex-container(column, space-between);
  height: 100%;
  padding: 20px;

  .top {
    @include flex-container(column);
    @include child-spacing(top, 15px);
    margin-bottom: 30px;
  }

  .bottom {
    @include flex-container(column);
    @include child-spacing(top, 15px);
    margin-bottom: 100px;
  }

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
  height: 24px;
  width: 24px;
}

:deep(.SidebarLink--active .icon path) {
  fill: $c-success-green;
}
// Order here matters - we want to set fill to none for
// the heart icon.
:deep(.SidebarLink--active .star-icon path) {
  fill: $c-success-green;
}

:deep(.SidebarLink--active .compass-icon path) {
  fill: $c-soft-black;
}
</style>
