<template>
  <div id="app" class="App">
    <app-header v-if="!hideHeader" />
    <app-sidebar v-if="!hideSidebar" />
    <app-modal v-if="isModalShown" />

    <div
      :class="{
        'App-router-view-wrapper': true,
        'App-router-view-wrapper--header': !hideHeader,
        'App-router-view-wrapper--sidebar': !hideSidebar
      }"
    >
      <router-view />
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import AuthService from "@/services/AuthService";

import "@/scss/main.scss";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import AppModal from "./AppModal";

/**
 * @todo Examine this, huge code smell, refactoring might be needed
 */
AuthService.checkAuth(); // {1}

export default {
  name: "App",
  components: {
    AppHeader,
    AppSidebar,
    AppModal
  },
  created() {
    AuthService.checkAuth(this); // {1}
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    handleResize() {
      this.$store.dispatch("app/windowResize", {
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
  },
  computed: {
    ...mapState({
      hideHeader: state => state.app.hideHeader,
      hideSidebar: state => state.app.hideSidebar,
      isModalShown: state => state.app.isModalShown
    })
  }
};
</script>

<style lang="scss" scoped>
.App {
  min-height: 100vh;
}

.App-router-view-wrapper {
  height: 100vh;

  &--header {
    @include bind-app-header-height(padding-top);
  }

  &--sidebar {
    @include bind-app-sidebar-width(padding-left);
    padding-left: 0;
  }
}
</style>
