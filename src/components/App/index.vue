<template>
  <div id="app" class="App">
    <app-header v-if="showHeader" />
    <app-sidebar v-if="showSidebar" />
    <app-modal v-if="showModal" />

    <div
      :class="{
        'App-router-view-wrapper': true,
        'App-router-view-wrapper--header': showHeader,
        'App-router-view-wrapper--sidebar': showSidebar
      }"
    >
      <error-feedback>
        <router-view />
      </error-feedback>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import ErrorFeedback from "../ErrorFeedback";
import AuthService from "@/services/AuthService";

import "@/scss/main.scss";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import AppModal from "./AppModal";

/**
 * @todo Examine this, huge code smell, refactoring might be needed
 */
//AuthService.checkAuth(); // {1}

export default {
  name: "App",
  components: {
    AppHeader,
    AppSidebar,
    AppModal,
    ErrorFeedback
  },
  created() {
    AuthService.checkAuth(this); // {1}

    // Listen for resize event
    window.addEventListener("resize", this.handleResize);
    this.handleResize();

    // Fetch user data
    this.$store.dispatch("user/fetch", this);
  },
  beforeUpdate() {
    this.$store.dispatch("user/fetch", this);
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
      showHeader: state => state.app.header.isShown,
      showSidebar: state => state.app.sidebar.isShown,
      showModal: state => state.app.modal.isShown
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
