<template>
  <div id="app" class="App">
    <app-header v-if="!hideHeader" />
    <app-sidebar v-if="!hideSidebar" />

    <div :class="{
      'App-router-view-wrapper': true,
      'App-router-view-wrapper--header': !hideHeader,
      'App-router-view-wrapper--sidebar': !hideSidebar,
    }">
      <router-view />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import AuthService from "@/services/AuthService";

import "@/scss/main.scss";
import AppHeader from './AppHeader';
import AppSidebar from "./AppSidebar";

/**
 * @todo Examine this, huge code smell, refactoring might be needed
 */
AuthService.checkAuth(); // {1}

export default {
  name: "App",
  components: {
    AppHeader,
    AppSidebar
  },
  created() {
    AuthService.checkAuth(this); // {1}
    window.addEventListener("resize", this.handleResize);
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
      hideSidebar: state => state.app.hideSidebar
    })
  }
};
</script>

<style lang="scss" scoped>
 .App {
   min-height: 100vh;
 }

 .App-router-view-wrapper {
   &--header {
     @include bind-app-header-height(margin-top);
   }

   &--sidebar {
     @include bind-app-sidebar-width(margin-left);
     margin-left: 0;
   }
 }
</style>
