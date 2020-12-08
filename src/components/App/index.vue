<template>
  <div id="app" class="App" :class="isIOS && 'is-ios'">
    <app-header v-if="showHeader" />
    <app-sidebar v-if="showSidebar" />
    <app-modal v-if="showModal" />
    <app-banner v-if="showBanner" />

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
import * as Sentry from "@sentry/browser";
import { mapState, mapGetters } from "vuex";
import "@/scss/main.scss";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import AppModal from "./AppModal";
import AppBanner from "./AppBanner";
import PortalService from "@/services/PortalService";
import getOperatingSystem from "@/utils/get-operating-system";
import isOutdatedMobileAppVersion from "@/utils/is-outdated-mobile-app-version";

export default {
  name: "App",
  components: {
    AppHeader,
    AppSidebar,
    AppModal,
    AppBanner
  },
  data() {
    return {
      isIOS: false,
      docHiddenProperty: ""
    };
  },
  async created() {
    // Listen for resize event
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
    await this.$store.dispatch("app/checkEnvironment", this);
    PortalService.call("app.isLoaded");

    this.setVisibilityListener();

    if (this.isMobileApp) {
      document.addEventListener("click", this.handleExternalURLs, false);

      if (isOutdatedMobileAppVersion()) {
        // show modal after children components have mounted
        setTimeout(() => {
          this.$store.dispatch("app/modal/show", {
            component: "UpgradeAppModal",
            data: {
              showTemplateButtons: false
            }
          });
        }, 1000);
      }

      if (getOperatingSystem() === "iOS") {
        this.isIOS = true;
        document.addEventListener("click", this.iOSFocusElements, false);
      }
    }
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);

    if (this.isMobileApp) {
      document.removeEventListener("click", this.handleExternalURLs);

      if (getOperatingSystem() === "iOS") {
        document.addEventListener("click", this.iOSFocusElements, false);
      }
    }
  },
  methods: {
    iOSFocusElements(e) {
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
    },
    isExemptSocketError(error) {
      return (
        error.message === "xhr poll error" ||
        error.message === "websocket error"
      );
    },
    setVisibilityListener() {
      let visibilityChange;
      // Opera 12.10 and Firefox 18 and later support
      if (typeof document.hidden !== "undefined") {
        this.docHiddenProperty = "hidden";
        visibilityChange = "visibilitychange";
      } else if (typeof document.msHidden !== "undefined") {
        this.docHiddenProperty = "msHidden";
        visibilityChange = "msvisibilitychange";
      } else if (typeof document.webkitHidden !== "undefined") {
        this.docHiddenProperty = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
      }

      document.addEventListener(visibilityChange, this.handleVisibilityChange);
    },
    async handleVisibilityChange() {
      await this.$store.dispatch(
        "app/updateWebPageVisibility",
        this.docHiddenProperty
      );
    }
  },
  computed: {
    ...mapState({
      showHeader: state => state.app.header.isShown,
      showSidebar: state => state.app.sidebar.isShown,
      showModal: state => state.app.modal.isShown,
      showBanner: state => state.app.banner.isShown,
      bannerComponent: state => state.app.banner.component,
      isMobileApp: state => state.app.isMobileApp,
      isWebPageHidden: state => state.app.isWebPageHidden,
      user: state => state.user.user
    }),
    ...mapGetters({
      userAuthenticated: "user/isAuthenticated",
      isVolunteer: "user/isVolunteer",
      mobileMode: "app/mobileMode"
    })
  },
  watch: {
    user(currentUserValue, previousUserValue) {
      const nowLoggedIn = currentUserValue._id && !previousUserValue._id;
      if (nowLoggedIn) {
        Sentry.setUser({ id: currentUserValue._id });

        if (this.mobileMode && !this.isMobileApp && !this.isVolunteer) {
          this.$store.dispatch("app/banner/show", {
            component: "MobileAppNoticeBanner"
          });
        }
      }
    },
    /**
     * This is a workaround for MobileAppNoticeBanner.vue not properly watching "mobileMode".
     * Hides the MobileAppNoticeBanner if not in mobile mode
     */
    mobileMode(isMobileMode) {
      if (!isMobileMode && this.bannerComponent === "MobileAppNoticeBanner")
        this.$store.dispatch("app/banner/hide");
    },

    /**
     * On route transition, fetch current session (for students, also most recent session)
     * @todo: Fetch these much less frequently (only once?)
     */
    $route() {
      if (this.userAuthenticated) {
        this.$store.dispatch("user/fetchSession", this);

        if (!this.isVolunteer) {
          this.$store.dispatch("user/fetchLatestSession", this);
        }
      }
    }
  },
  sockets: {
    error(error) {
      if (this.isExemptSocketError(error)) return;
      Sentry.captureException(error);
    },
    connect_error(error) {
      // these are handled internally and shouldn't be forwarded to Sentry
      if (this.isExemptSocketError(error)) return;
      Sentry.captureException(error);
    },
    reconnect_error(error) {
      if (this.isExemptSocketError(error)) return;
      Sentry.captureException(error);
    },
    "session-change"(sessionData) {
      this.$store.dispatch("user/updateSession", sessionData);
    },
    redirect() {
      this.$router.push("/");
    }
  }
};
</script>

<style lang="scss" scoped>
.App {
  height: 100%;
}

.is-ios {
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
