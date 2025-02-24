<template>
  <nav
    :class="{
      AppSidebar: true,
      'AppSidebar--header': showHeader,
      'AppSidebar--collapsed': mobileMode && isSidebarCollapsed,
    }"
  >
    <div class="AppSidebar-content" :class="{ mobile: mobileMode }">
      <div>
        <sidebar-info class="sidebar-info" />

        <sidebar-links
          :authenticated="isAuthenticated"
          :isAdmin="user.isAdmin"
          :mobileMode="mobileMode"
          :numberOfStudentClasses="user.numberOfStudentClasses"
        />
      </div>

      <div
        v-if="isAuthenticated"
        class="logout-link"
        type="button"
        @click="logout"
        @keydown.enter="logout"
        :tabindex="isSidebarCollapsed && mobileMode ? -1 : 0"
      >
        Log out
      </div>
    </div>
  </nav>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import AuthService from '@/services/AuthService'
import SidebarInfo from './SidebarInfo.vue'
import SidebarLinks from './SidebarLinks.vue'
import config from '../../../config'

export default {
  components: { SidebarInfo, SidebarLinks },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      showHeader: (state) => state.app.header.isShown,
      isSidebarCollapsed: (state) => state.app.sidebar.isCollapsed,
    }),
    ...mapGetters({
      isAuthenticated: 'user/isAuthenticated',
      mobileMode: 'app/mobileMode',
    }),
  },
  methods: {
    logout() {
      AuthService.logout(this)
    },
    backToWebsite() {
      window.location = config.mainWebsiteUrl
    },
  },
}
</script>

<style lang="scss" scoped>
$transition: transform 700ms;

.AppSidebar {
  @include bind-app-sidebar-width(width);

  background: white;
  box-shadow: 0px 2px 6px 0px rgba(0, 0, 0, 0.1);
  height: 100%;
  overflow-y: auto;

  position: fixed;
  top: 0;
  left: 0;
  z-index: get-z('sidebar');

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
  @include flex-container(column);
  height: 100%;
  padding: 40px 20px 40px 30px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .sidebar-info {
    margin-bottom: 64px;
  }

  .logout-link {
    @include font-category('button');
    padding-top: 20px;
    padding-bottom: 5px;
  }

  &.mobile {
    padding-top: 20px;

    .sidebar-info {
      margin-bottom: 24px;
    }

    .logout-link {
      @include font-category('display-small');
    }
  }
}
</style>
