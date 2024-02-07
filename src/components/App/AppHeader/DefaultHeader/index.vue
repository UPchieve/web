<template>
  <div class="DefaultHeader">
    <template v-if="mobileMode">
      <div class="DefaultHeader-user-info">
        <img class="DefaultHeader-user-info-avatar" :src="avatarUrl" alt="" />
        <span class="DefaultHeader-user-info-name">{{ name }}</span>
      </div>

      <div class="DefaultHeader-menu-container">
        <hamburger-button :tabindex="0" />
        <activity-dot
          v-if="
            unreadProgressReportOverviewSubjects.length > 0 &&
              isProgressReportsActive &&
              !user.isVolunteer
          "
          :total="unreadProgressReportOverviewSubjects.length"
          class="DefaultHeader-menu-notification"
        />
      </div>
    </template>

    <template v-else>
      <router-link to="/">
        <img class="DefaultHeader-logo" :src="logoUrl" alt="UPchieve" />
      </router-link>
    </template>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import LogoImageUrl from '@/assets/header_logo.png'
import HamburgerButton from '../HamburgerButton.vue'
import ActivityDot from '@/components/ActivityDot.vue'

export default {
  name: 'default-header',
  components: { HamburgerButton, ActivityDot },
  data() {
    return { logoUrl: LogoImageUrl }
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      unreadProgressReportOverviewSubjects: state =>
        state.user.unreadProgressReportOverviewSubjects,
    }),
    ...mapGetters({
      avatarUrl: 'user/avatarUrl',
      mobileMode: 'app/mobileMode',
      name: 'user/firstName',
      isProgressReportsActive: 'featureFlags/isProgressReportsActive',
    }),
  },
}
</script>

<style lang="scss" scoped>
.DefaultHeader {
  @include flex-container(row, space-between, center);
  flex: 1;

  @include breakpoint-above('medium') {
    justify-content: center;
  }

  @include header-child;
}

.DefaultHeader-logo {
  width: 94px;
  height: 40px;
}

.DefaultHeader-user-info {
  @include flex-container(row, center, center);
  @include child-spacing(left, 12px);

  &-avatar {
    border-radius: 50%;
    width: 40px;
    height: 40px;
  }

  &-name {
    @include font-category('heading');
  }
}

.DefaultHeader {
  &-menu {
    &-container {
      position: relative;
    }

    &-notification {
      position: absolute;
      top: 0;
      right: -5px;
    }
  }
}
</style>
