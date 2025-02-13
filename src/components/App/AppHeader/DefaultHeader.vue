<template>
  <div class="DefaultHeader">
    <template v-if="mobileMode">
      <div class="DefaultHeader-user-info">
        <img class="DefaultHeader-user-info-avatar" :src="avatarUrl" alt="" />
        <span class="DefaultHeader-user-info-name">{{ name }}</span>
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

export default {
  name: 'default-header',
  data() {
    return { logoUrl: LogoImageUrl }
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
    ...mapGetters({
      avatarUrl: 'user/avatarUrl',
      mobileMode: 'app/mobileMode',
      name: 'user/firstName',
      isProgressReportsActive: 'featureFlags/isProgressReportsActive',
      hasUnreadProgressOverviewReports: 'user/hasUnreadProgressOverviewReports',
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
  @include child-spacing(left, 8px);

  &-avatar {
    border-radius: 50%;
    width: 40px;
    height: 40px;
  }

  &-name {
    @include font-category('heading');
  }
}
</style>
