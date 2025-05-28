<template>
  <div v-if="isAuthenticated">
    <div class="SidebarInfo" :class="{ mobile: mobileMode }">
      <div class="SidebarInfo-user">
        <component
          class="SidebarInfo-avatar"
          v-if="avatar?.component"
          :is="avatar?.component"
          :id="avatar?.id"
        />
        <div class="SidebarInfo-name">{{ firstName }}</div>
      </div>
      <div class="SidebarInfo-type">
        {{ type }}
        <div v-if="showAmbassadorTitle">
          <QuestionIcon
            class="ambassador-title-tooltip-icon"
            id="ambassador-tooltip-icon"
          />
          <IonPopover
            alignment="center"
            :showBackdrop="false"
            trigger="ambassador-tooltip-icon"
            trigger-action="click"
          >
            {{ ambassadorTooltipText }}
          </IonPopover>
        </div>
      </div>
      <SwitchAccountModeButton
        v-if="isStudentVolunteer"
        class="switch-account-mode-button"
      />
      <div v-if="!isTeacher && !mobileMode" class="SidebarInfo-status">
        <div class="SidebarInfo-status-circle" :class="sessionStatus.class" />
        <div class="SidebarInfo-status-text">{{ sessionStatus.text }}</div>
      </div>
    </div>
    <hr v-if="mobileMode" />
  </div>
</template>

<script>
import Case from 'case'
import { IonPopover } from '@ionic/vue'
import { mapGetters, mapState } from 'vuex'
import SwitchAccountModeButton from '@/components/SwitchAccountModeButton.vue'
import AnalyticsService from '@/services/AnalyticsService'
import * as EVENTS from 'events'
import QuestionIcon from '@/assets/question-mark-icon.svg'

export default {
  components: { SwitchAccountModeButton, QuestionIcon, IonPopover },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
    ...mapGetters({
      firstName: 'user/firstName',
      isAuthenticated: 'user/isAuthenticated',
      isSessionAlive: 'user/isSessionAlive',
      userType: 'user/userType',
      avatar: 'user/avatar',
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      isTeacher: 'user/isTeacher',
      mobileMode: 'app/mobileMode',
      isStudentVolunteer: 'user/isStudentVolunteer',
      showAmbassadorTitle: 'user/showAmbassadorTitle',
      isInAmbassadorProgram: 'user/isVolunteerProgramAmbassador',
      isAmbassadorThroughReferrals: 'user/isVolunteerReferralAmbassador',
    }),
    ambassadorTooltipText() {
      return this.isInAmbassadorProgram
        ? 'You are a member of our UPchieve Ambassadors program!'
        : `You've become an UPchieve Ambassador by referring ${this.user?.numReferredVolunteers ?? '5+'} friends to volunteer. Nice work!`
    },
    type() {
      if (this.showAmbassadorTitle) {
        AnalyticsService.captureEvent(EVENTS.AMBASSADOR_SAW_AMBASSADOR_TITLE)
        return 'Volunteer Ambassador'
      }
      return Case.capital(this.userType ?? 'User')
    },
    sessionStatus() {
      const inSession = this.isSessionAlive

      const status = {
        text: 'Ready to chat',
        class: 'SidebarInfo-status-circle',
      }

      if (this.isVolunteer) {
        status.text = 'Ready to help'
      }

      if (this.user.banType === 'complete') {
        status.class += '--banned'
        status.text = 'Paused'
      }

      if (inSession) {
        status.class += '--session'
        status.text = 'Chat in session'
      }

      if (this.isVolunteer && !this.user.isOnboarded) {
        status.class += '--onboarding'
        status.text = 'Onboarding'
      }

      if (this.isVolunteer && this.user.isOnboarded && !this.user.isApproved) {
        status.class += '--onboarding'
        status.text = 'Pending approval'
      }

      return status
    },
  },
}
</script>

<style lang="scss" scoped>
.SidebarInfo {
  $spacing: 8px;
  @include flex-container(column, $align-items: flex-start);
  @include child-spacing(top, $spacing);

  &.mobile {
    @include flex-container(column, start);

    .SidebarInfo-user {
      display: flex;
      flex-direction: row;
      align-self: start;
      align-items: center;
    }

    .switch-account-mode-button {
      align-self: start;
    }

    .SidebarInfo-avatar {
      $mobile-size: 60px;
      height: $mobile-size;
      width: $mobile-size;
    }

    .SidebarInfo-name {
      margin-top: 0;
      margin-left: 10px;
    }
  }

  &-avatar {
    $size: 80px;
    border-radius: 50%;
    width: $size;
    height: $size;
  }

  &-name {
    @include font-category('display-small');
    margin-top: $spacing * 2;
    text-align: left;
  }

  &-type {
    @include font-category('body');
    color: $c-secondary-grey;
    display: flex;
    flex-direction: row;
    gap: 4px;
  }

  &-status {
    @include flex-container(row, center, baseline);
    @include child-spacing(left, 8px);
    @include font-category('body');

    &-circle {
      $size: 8px;

      border-radius: 50%;
      background: $c-success-green;
      width: $size;
      height: $size;

      &--session,
      &--onboarding {
        background: $c-warning-orange;
      }

      &--banned {
        background-color: $c-banned-grey;
      }
    }
  }
}

hr {
  margin-top: 2rem;
  margin-bottom: 2rem;
  border: 2px solid $c-background-grey;
}

.ambassador-title-tooltip-icon {
  width: 15px;
  height: 15px;

  &:hover {
    cursor: pointer;
  }
}

ion-popover::part(content) {
  border-radius: 10px;
  padding: 8px;
  display: flex;
  text-align: center;
}
</style>
