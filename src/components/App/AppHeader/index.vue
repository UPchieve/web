<template>
  <div v-if="mobileMode" class="AppHeader">
    <div class="AppHeader-user-info">
      <img class="AppHeader-user-info-avatar" :src="avatarUrl" />
      <span class="AppHeader-user-info-name">{{ name }}</span>
    </div>
    <hamburger-button />
  </div>

  <div v-else class="AppHeader" style="justify-content: center;">
    <img class="AppHeader-logo" :src="logoUrl" />
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import UserService from "@/services/UserService";
import LogoImageUrl from "@/assets/header_logo.png";
import StudentAvatarUrl from "@/assets/defaultavatar3.png";
import VolunteerAvatarUrl from "@/assets/defaultavatar4.png";
import HamburgerButton from "./HamburgerButton";

export default {
  name: "AppHeader",
  components: { HamburgerButton },
  data() {
    const user = UserService.getUser() || {};

    return {
      name: user ? user.firstname : "Unknown",
      avatarUrl:
        user.picture ||
        (user.isVolunteer ? VolunteerAvatarUrl : StudentAvatarUrl),
      logoUrl: LogoImageUrl
    };
  },
  computed: {
    ...mapGetters({
      mobileMode: "app/mobileMode"
    })
  }
};
</script>

<style lang="scss" scoped>
.AppHeader {
  @include bind-app-header-height(height);
  @include flex-container(row, space-between, center);

  background: white;
  border-radius: 0px 0px 20px 20px;
  padding: 20px;
  width: 100%;

  position: fixed;
  top: 0;
  left: 0;
  z-index: get-z("header");

  @include breakpoint-above("medium") {
    border-radius: 0;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.05);
    padding: 12px 20px;
  }
}

.AppHeader-logo {
  width: 94px;
  height: 40px;
}

.AppHeader-user-info {
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
