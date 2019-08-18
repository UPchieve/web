<template>
  <nav
    :class="{
    'AppSidebar': true,
    'AppSidebar--header': !hideHeader,
    'AppSidebar--collapsed': mobileMode && isSidebarCollapsed
  }"
  >
    <div v-if="mobileMode" class="AppSidebar-content">
      <div class="AppSidebar-content-links">
        <template v-if="$route.path.indexOf('/onboarding') !== -1">
          <app-sidebar-link to="/onboarding/profile" icon="portrait" text="Basic profile" />
          <app-sidebar-link
            v-if="!user.isVolunteer"
            to="/onboarding/academic"
            icon="book"
            text="First time use survey"
          />
        </template>

        <template v-else-if="auth.authenticated">
          <app-sidebar-link to="/dashboard" icon="house" text="Dashboard" />
          <app-sidebar-link
            v-if="user.isVolunteer"
            to="/training"
            icon="graduation-cap"
            text="Training"
          />
          <app-sidebar-link v-if="user.isVolunteer" to="/calendar" icon="calendar" text="Schedule" />
          <app-sidebar-link v-if="user.isAdmin" to="/admin" icon="folder" text="Admin" />
          <app-sidebar-link to="/profile" icon="portrait" text="Profile" />
          <app-sidebar-link to="/resources" icon="folder" text="Resources" />
        </template>

        <template v-else>
          <app-sidebar-link to="/login" text="Login"/>
        </template>

        <app-sidebar-link to="/contact" icon="envelope" text="Contact us" />
        <app-sidebar-link to="/legal" icon="exclamation" text="Legal policy" />
      </div>

      <div v-if="auth.authenticated" class="AppSidebar-final-link" v-on:click="logout">Log out</div>
      <div v-else class="AppSidebar-final-link" v-on:click="backToWebsite">Back to website</div>
    </div>

    <div v-else class="AppSidebar-content"></div>

    <!-- <div v-if="auth.authenticated">
      <profile-info v-if="!mobileMode" />
      <user-nav v-on:closeMenu="$emit('closeMenu')" />
    </div>

    <div v-else>
      <p class="aboutText">
        UPchieve is a volunteer-run ed-tech initiative with the goal of
        providing free, online, and on-demand educational and guidance services
        to disadvantaged students.
      </p>
    </div>

    <sidebar-footer v-on:closeMenu="$emit('closeMenu')" />-->
  </nav>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import AuthService from "@/services/AuthService";
import UserService from "@/services/UserService";
import AppSidebarLink from "./AppSidebarLink";

import UserNav from "./UserNav";
import ProfileInfo from "./ProfileInfo";
import Footer from "./Footer";

export default {
  components: {
    AppSidebarLink,
    UserNav,
    ProfileInfo,
    SidebarFooter: Footer // footer is reserved component name
  },
  data() {
    return {
      auth: UserService.getAuth(),
      user: UserService.getUser()
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
  },
  methods: {
    logout() {
      AuthService.logout(this);
    },
    backToWebsite() {
      window.location = process.env.VUE_APP_MAIN_WEBSITE_URL;
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

  transition: $transition ease-out;

  &--header {
    @include bind-app-header-height(padding-top);
  }

  &--collapsed {
    transform: translateY(-100%);
    transition: $transition ease-in;
  }
}

.AppSidebar-content {
  @include flex-container(column, space-between, flex-start);

  height: 100%;
  padding: 40px 20px;

  &-links {
    @include flex-container(column);
    @include child-spacing(top, 24px);
  }
}

.AppSidebar-final-link {
  @include font-category("display-small");
  cursor: pointer;
  margin-top: 20px;
}
</style>
