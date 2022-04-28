<template>
  <div class="SidebarLinks">
    <template v-if="$route.path.indexOf('/onboarding') !== -1"></template>

    <template v-else-if="authenticated">
      <sidebar-link to="/dashboard" text="Dashboard">
        <house-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="!isVolunteer && isSessionHistoryActive"
        to='/sessions/history'
        text="Session History"
      >
        <calendar-icon class="icon" />
      </sidebar-link>

       <sidebar-link
        v-if="isCoachFavoritingActive && !isVolunteer"
        to="/favorite-coaches"
        text="Favorite Coaches"
      >
        <heart-icon class="icon" />
      </sidebar-link>

      <sidebar-link v-if="isVolunteer" to="/training" text="Training">
        <graduation-cap-icon class="icon" />
      </sidebar-link>

      <sidebar-link v-if="isVolunteer" to="/calendar" text="Schedule">
        <calendar-icon class="icon" />
      </sidebar-link>

      <sidebar-link v-if="isAdmin" to="/admin" text="Admin">
        <folder-icon class="icon" />
      </sidebar-link>

      <sidebar-link to="/profile" text="Profile">
        <portrait-icon class="icon" />
      </sidebar-link>

      <sidebar-link
        v-if="!isVolunteer && isReferFriendsActive"
        to="/refer-friends"
        text="Refer friends"
      >
        <word-bubbles-icon class="icon" />
      </sidebar-link>

      <div v-if="!mobileMode" class="SidebarLinks-about">About UPchieve</div>
      <sidebar-link to="/contact" text="Contact us">
        <envelope-icon class="icon" />
      </sidebar-link>
      <sidebar-link to="/legal" text="Legal policy">
        <exclamation-icon class="icon" />
      </sidebar-link>
    </template>
  </div>
</template>

<script>
import SidebarLink from './SidebarLink'
import HouseIcon from '@/assets/sidebar_icons/house.svg'
import GraduationCapIcon from '@/assets/sidebar_icons/graduation-cap.svg'
import CalendarIcon from '@/assets/sidebar_icons/calendar.svg'
import FolderIcon from '@/assets/sidebar_icons/folder.svg'
import WordBubblesIcon from '@/assets/sidebar_icons/word-bubbles.svg'
import EnvelopeIcon from '@/assets/sidebar_icons/envelope.svg'
import ExclamationIcon from '@/assets/sidebar_icons/exclamation.svg'
import PortraitIcon from '@/assets/sidebar_icons/portrait.svg'
import HeartIcon from '@/assets/heart.svg'
import { mapGetters } from 'vuex'

export default {
  components: {
    SidebarLink,
    HouseIcon,
    GraduationCapIcon,
    CalendarIcon,
    FolderIcon,
    WordBubblesIcon,
    EnvelopeIcon,
    ExclamationIcon,
    PortraitIcon,
    HeartIcon,
  },
  props: {
    authenticated: Boolean,
    isVolunteer: Boolean,
    isAdmin: Boolean,
    mobileMode: Boolean,
  },
  computed: {
    ...mapGetters({
      isReferFriendsActive: 'featureFlags/isReferFriendsActive',
      isSessionHistoryActive: 'featureFlags/isSessionHistoryActive',
      isCoachFavoritingActive: 'featureFlags/isCoachFavoritingActive',
    }),
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
}

.icon {
  margin-right: 0.8em;
  width: 24px;
}
</style>
