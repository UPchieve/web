<template>
  <nav :class="{
    'AppSidebar': true,
    'AppSidebar--header': !hideHeader,
    'AppSidebar--collapsed': mobileMode && isSidebarCollapsed
  }">
    <div v-on:click="$emit('closeMenu')">
      <router-link tag="h1" to="/" />
    </div>
    <div v-if="auth.authenticated">
      <profile-info v-if="auth.authenticated" />
      <div id="navbar" class="navbar-user">
        <user-nav v-on:closeMenu="$emit('closeMenu')" />
      </div>
    </div>
    <div v-else>
      <p class="aboutText">
        UPchieve is a volunteer-run ed-tech initiative with the goal of
        providing free, online, and on-demand educational and guidance services
        to disadvantaged students.
      </p>
    </div>
    <div class="navbar-footer">
      <sidebar-footer v-on:closeMenu="$emit('closeMenu')" />
    </div>
  </nav>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import UserService from "@/services/UserService";

import UserNav from "./UserNav";
import ProfileInfo from "./ProfileInfo";
import Footer from "./Footer";

export default {
  components: {
    UserNav,
    ProfileInfo,
    SidebarFooter: Footer // footer is reserved component name
  },
  data() {
    return {
      auth: UserService.getAuth()
    };
  },
  computed: {
    ...mapState({
      hideHeader: state => state.app.hideHeader,
      isSidebarCollapsed: state => state.app.isSidebarCollapsed
    }),
    ...mapGetters({
      mobileMode: "app/mobileMode"
    })
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

  transition: $transition ease-out;

  &--header {
    @include bind-app-header-height(padding-top);
  }

  &--collapsed {
    transform: translateY(-100%);
    transition: $transition ease-in;
  }
}
</style>
