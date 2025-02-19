<template>
  <div class="DefaultHeader">
    <router-link to="/">
      <img class="DefaultHeader-logo" :src="logoUrl" alt="Home" />
    </router-link>
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
  @include header-child;
  @include flex-container(row, center, center);
}

.DefaultHeader-logo {
  width: 94px;
  height: 40px;
}
</style>
