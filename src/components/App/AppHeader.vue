<template>
  <div v-if="mobileMode" class="AppHeader">
  </div>

  <div v-else class="AppHeader">
    <img class="AppHeader-logo" :src="LogoImage" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import LogoImage from '@/assets/header_logo.png';

export default {
  data() {
    return {
      LogoImage
    }
  },
  computed: {
    ...mapGetters({
      mobileMode: 'app/mobileMode'
    })
  }
}
</script>

<style lang="scss" scoped>
.AppHeader {
  @include bind-app-header-height(height);
  @include flex-container(row, space-around, center);

  background: white;
  border-radius: 0px 0px 20px 20px;
  width: 100%;

  position: fixed;
  top: 0;
  left: 0;
  z-index: get-z("header");

  @include breakpoint-above("medium") {
    border-radius: 0;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.05);
  }
}

.AppHeader-logo {
  width: 94px;
  height: 40px;
}
</style>
