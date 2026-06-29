<template>
  <nav
    :class="{
      AppSidebar: true,
      'AppSidebar--header': showHeader,
      'AppSidebar--collapsed': mobileMode && isSidebarCollapsed,
    }"
  >
    <div class="AppSidebar-content">
      <sidebar-info />

      <sidebar-links
        :authenticated="isAuthenticated"
        :numberOfStudentClasses="user.numberOfStudentClasses"
      />
    </div>
  </nav>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
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
    backToWebsite() {
      window.location = config.mainWebsiteUrl
    },
  },
}
</script>

<style lang="scss" scoped>
.AppSidebar {
  @include bind-app-sidebar-width(width);

  background: var(--bg-color);
  box-shadow: 0px 2px 6px 0px rgba(0, 0, 0, 0.1);
  height: 100%;
  overflow-y: auto;

  position: fixed;
  top: 0;
  left: 0;
  z-index: get-z('sidebar');

  &--header {
    @include bind-app-header-height(padding-top);
  }

  &--collapsed {
    transform: translateY(-100%);
  }
}

.AppSidebar-content {
  @include flex-container(column);
  height: 100%;
  position: relative;
  background-color: var(--bg-color);
}
</style>
