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
import PortalService from "@/services/PortalService";

export default {
  name: "App",
  components: {
    AppHeader,
    AppSidebar,
    AppModal
  },
  async created() {
    // Listen for resize event
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
    await this.$store.dispatch("app/checkEnvironment", this);
    PortalService.call("app.isLoaded");

    if (this.isMobileApp) {
      document.addEventListener("click", this.handleExternalURLs, false);
    }
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
    document.removeEventListener("click", this.handleExternalURLs);
  },
  methods: {
    iOSFix(e) {
      if (!e) {
        return;
      }
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
    },
    handleExternalURLs(event) {
      const isATag = event.target.tagName.toLowerCase() === "a";
      const isSameHost = window.location.hostname === event.target.hostname;
      const mailToLinkPattern = /^mailto:/i;

      // Open native mobile browser or email if the a tag has a different host or
      // if the a tag has "mailto" in its href
      if (
        isATag &&
        (!isSameHost || mailToLinkPattern.test(event.srcElement.href))
      ) {
        const { href } = event.target;
        PortalService.call("browser.openWindow", {
          url: href,
          target: "_system"
        });
      }
    }
  },
  computed: {
    ...mapState({
      showHeader: state => state.app.header.isShown,
      showSidebar: state => state.app.sidebar.isShown,
      showModal: state => state.app.modal.isShown,
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

  @media only screen and (orientation: landscape) {
    min-height: initial;
  }
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
