<template>
  <!-- FIXME: only do this on iOS -->
  <div id="app" class="App" @click="iOSFix()">
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
      <router-view />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";

import SessionService from "@/services/SessionService";

import "@/scss/main.scss";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import AppModal from "./AppModal";

import * as Sentry from "@sentry/browser";
import NetworkService from "../../services/NetworkService";

export default {
  name: "App",
  components: {
    AppHeader,
    AppSidebar,
    AppModal
  },
  created() {
    // Listen for resize event
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
    this.$store.dispatch("app/checkEnvironment", this);
  },
  beforeUpdate() {
    if (this.userAuthenticated) {
      this.$store.dispatch("user/fetchSession", this);

      if (!this.isVolunteer) {
        this.$store.dispatch("user/fetchLatestSession", this);
      }
    }
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    iOSFix(e) {
      const focusTags = ["INPUT", "TEXTAREA", "SELECT"];
      const focusTag = document.activeElement.tagName;
      if (
        focusTags.indexOf(focusTag) !== -1 &&
        focusTags.indexOf(e.target.tagName) === -1
      ) {
        return document.activeElement.blur();
      }
    },
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
      showModal: state => state.app.modal.isShown,
      user: state => state.user.user,
      isMobileApp: state => state.app.isMobileApp
    }),
    ...mapGetters({
      userAuthenticated: "user/isAuthenticated",
      isVolunteer: "user/isVolunteer"
    })
  },
  sockets: {
    "session-change"(sessionData) {
      SessionService.currentSession.sessionId = sessionData._id;
      SessionService.currentSession.data = sessionData;

      this.$store.dispatch("user/updateSession", sessionData);

      // re-render the session's persisted whiteboard canvas
      const img = new Image();
      img.src = sessionData.whiteboardUrl;
      img.onload = () => window.App.ctx.drawImage(img, 0, 0);
    }
  },
  watch: {
    // Check if the student allows push notification on initial log in
    user(newUserState, oldUserState) {
      if (this.isMobileApp) {
        const oldUserStateIsEmpty =
          Object.keys(oldUserState).length === 0 &&
          oldUserState.constructor === Object;
        const newUserStateIsEmpty =
          Object.keys(newUserState).length === 0 &&
          newUserState.constructor === Object;

        const initialLogIn = oldUserStateIsEmpty && !newUserStateIsEmpty;

        if (initialLogIn && !newUserState.isVolunteer) {
          NetworkService.checkPushToken(this)
            .then(() => {
              this.$store.dispatch("user/updateHasPushToken", true);
            })
            .catch(err => {
              if (err.status !== 404) {
                Sentry.captureException(err);
              }
            });
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.App {
  min-height: 100vh;

  // FIXME: do this for iOS only
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  overflow: auto;
}

.App-router-view-wrapper {
  height: 100%;

  &--header {
    @include bind-app-header-height(padding-top);
  }

  &--sidebar {
    @include bind-app-sidebar-width(padding-left);
    padding-left: 0;
  }
}
</style>
