<template>
  <div class="DefaultHeader">
    <template v-if="mobileMode">
      <div class="DefaultHeader-user-info">
        <img class="DefaultHeader-user-info-avatar" :src="avatarUrl" alt="" />
        <span class="DefaultHeader-user-info-name">{{ name }}</span>
      </div>

      <hamburger-button tabindex="0" />
    </template>

    <template v-else>
      <router-link to="/">
        <img class="DefaultHeader-logo" :src="logoUrl" alt="UPchieve" />
      </router-link>
    </template>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import LogoImageUrl from "@/assets/header_logo.png";
import HamburgerButton from "./HamburgerButton";

export default {
  name: "default-header",
  components: { HamburgerButton },
  data() {
    return { logoUrl: LogoImageUrl };
  },
  computed: {
    ...mapGetters({
      avatarUrl: "user/avatarUrl",
      mobileMode: "app/mobileMode",
      name: "user/firstName"
    })
  }
};
</script>

<style lang="scss" scoped>
.DefaultHeader {
  @include flex-container(row, space-between, center);
  flex: 1;

  @include breakpoint-above("medium") {
    justify-content: center;
  }
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
    @include font-category("heading");
  }
}
</style>
