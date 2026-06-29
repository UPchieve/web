<template>
  <div class="DefaultHeader">
    <router-link to="/">
      <img class="DefaultHeader-logo" :src="logoUrl" alt="Home" />
    </router-link>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import LogoImageUrl from '@/assets/logos/header-logo-teal.svg?url'

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
    }),
  },
}
</script>

<style lang="scss" scoped>
.DefaultHeader {
  @include header-child;
  @include flex-container(row, center, center);
  background-color: var(--bg-color);
}

.DefaultHeader-logo {
  width: 94px;
  height: 40px;
}
</style>
