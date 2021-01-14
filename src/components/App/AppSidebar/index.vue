<template>
  <nav
    :class="{
      AppSidebar: true,
      'AppSidebar--header': showHeader,
      'AppSidebar--collapsed': mobileMode && isSidebarCollapsed
    }"
  >
    <div class="AppSidebar-content">
      <div class="uc-column">
        <sidebar-info
          v-if="!mobileMode"
          style="margin-bottom: 64px;"
          :authenticated="isAuthenticated"
          :isVolunteer="isVolunteer"
          :name="user.firstname"
        />

        <sidebar-links
          :authenticated="isAuthenticated"
          :isVolunteer="isVolunteer"
          :isAdmin="user.isAdmin"
          :mobileMode="mobileMode"
        />
      </div>

      <div
        v-if="isAuthenticated"
        :class="finalLinkClass"
        v-on:click="logout"
        v-on:keydown.enter="logout"
        :tabindex="isSidebarCollapsed && mobileMode ? -1 : 0"
      >
        Log out
      </div>
    </div>
  </nav>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import AuthService from "@/services/AuthService";
import SidebarInfo from "./SidebarInfo";
import SidebarLinks from "./SidebarLinks";
import config from "../../../config";

export default {
  components: { SidebarInfo, SidebarLinks },
  computed: {
    ...mapState({
      user: state => state.user.user,
      showHeader: state => state.app.header.isShown,
      isSidebarCollapsed: state => state.app.sidebar.isCollapsed
    }),
    ...mapGetters({
      isAuthenticated: "user/isAuthenticated",
      isVolunteer: "user/isVolunteer",
      mobileMode: "app/mobileMode"
    }),
    finalLinkClass() {
      return {
        "AppSidebar-final-link": true,
        "AppSidebar-final-link--desktop": !this.mobileMode
      };
    }
  },
  methods: {
    logout() {
      AuthService.logout(this);
    },
    backToWebsite() {
      window.location = config.mainWebsiteUrl;
    }
  }
};
</script>

<style lang="scss" scoped>
$transition: transform 700ms;

.AppSidebar {
  @include bind-app-sidebar-width(width);

  background: white;
  height: 100%;
  overflow-y: auto;

  position: fixed;
  top: 0;
  left: 0;
  z-index: get-z("sidebar");

  // transition: $transition ease-out;

  &--header {
    @include bind-app-header-height(padding-top);
  }

  &--collapsed {
    transform: translateY(-100%);
    // transition: $transition ease-in;
  }
}

.AppSidebar-content {
  height: 100%;
  padding: 40px 20px 40px 30px;
  position: relative;

  @media screen and (min-width: get-breakpoint("medium")) and (max-width: get-breakpoint("huge")) and (orientation: landscape) {
    padding-left: 2em;
    height: initial;
  }
}

.AppSidebar-final-link {
  @include font-category("display-small");
  cursor: pointer;
  margin: 40px 0 20px;
  bottom: 40px;
  text-align: left;

  &--desktop {
    @include font-category("button");

    @media screen and (min-width: get-breakpoint("medium")) and (max-width: get-breakpoint("huge")) and (orientation: landscape) {
      position: initial;
      text-align: left;
      margin: 4em 0 1em;
    }
  }
}
</style>
