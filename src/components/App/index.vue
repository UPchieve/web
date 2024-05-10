<template>
  <div id="app" class="App" :class="isIOS && 'is-ios'">
    <b-alert
      class="refresh-alert"
      dismissible
      variant="warning"
      v-model="shouldShowRefreshAlert"
    >
      {{ refreshMessage }}, please
      <large-button
        class="refresh-alert__refresh-button"
        @click.native="refreshPage"
        primary
        :showArrow="false"
        >refresh</large-button
      >
    </b-alert>
    <app-header v-if="showHeader" />
    <app-sidebar v-if="showSidebar" />
    <app-modal v-if="showModal" />
    <app-banner v-if="showBanner" />
    <div
      :class="{
        'App-router-view-wrapper': true,
        'App-router-view-wrapper--header': showHeader,
        'App-router-view-wrapper--sidebar': showSidebar,
      }"
    >
      <audio
        ref="newWaitingStudentAudioElement"
        class="audio__new-waiting-student"
        src="@/assets/audio/alert.mp3"
        muted
      />
      <attention-boxes v-if="showInAppSessionNotifications" />
      <router-view />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { crono } from 'vue-crono'
import '@/scss/main.scss'
import AppHeader from './AppHeader/index.vue'
import AppSidebar from './AppSidebar/index.vue'
import AppModal from './AppModal/index.vue'
import AppBanner from './AppBanner/index.vue'
import { BAlert } from 'bootstrap-vue'
import PortalService from '@/services/PortalService'
import getOperatingSystem from '@/utils/get-operating-system'
import isOutdatedMobileAppVersion from '@/utils/is-outdated-mobile-app-version'
import AnalyticsService from '@/services/AnalyticsService'
import FeatureFlagService from '@/services/FeatureFlagService'
import LoggerService from '@/services/LoggerService'
import config from '@/config'
import LargeButton from '@/components/LargeButton.vue'
import Gleap from 'gleap'
import posthog from 'posthog-js'
import AttentionBoxes from '../AttentionBoxes.vue'

export default {
  name: 'App',
  components: {
    AppHeader,
    AppSidebar,
    AppModal,
    AppBanner,
    BAlert,
    LargeButton,
    AttentionBoxes,
  },
  mixins: [crono],
  data() {
    return {
      isIOS: false,
      docHiddenProperty: '',
      newServerVersionAvailable: false,
    }
  },
  async created() {
    // Listen for resize event
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
    await this.$store.dispatch('app/checkEnvironment', this)
    PortalService.call('app.isLoaded')

    // set version on initial load
    this.$store.commit('app/setVersion', config.version)

    this.setVisibilityListener()

    if (this.isMobileApp) {
      document.addEventListener('click', this.handleExternalURLs, false)

      if (isOutdatedMobileAppVersion()) {
        // show modal after children components have mounted
        setTimeout(() => {
          this.$store.dispatch('app/modal/show', {
            component: 'UpgradeAppModal',
            data: {
              showTemplateButtons: false,
            },
          })
        }, 1000)
      }

      if (getOperatingSystem() === 'iOS') {
        this.isIOS = true
        document.addEventListener('click', this.iOSFocusElements, false)
      }
    }
  },
  mounted() {
    if (this.mobileMode) {
      Gleap.hide()
    }
    this.$store.commit(
      'volunteer/setNewWaitingStudentAudioElement',
      this.$refs.newWaitingStudentAudioElement
    )
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)

    if (this.isMobileApp) {
      document.removeEventListener('click', this.handleExternalURLs)

      if (getOperatingSystem() === 'iOS') {
        document.addEventListener('click', this.iOSFocusElements, false)
      }
    }
  },
  methods: {
    async getCurrentServerVersion() {
      this.$store.dispatch('app/getCurrentServerVersion', this).then(() => {
        if (
          this.$store.state.app.version !==
          this.$store.state.app.currentServerVersion
        ) {
          this.newServerVersionAvailable = true
        }
      })
    },
    iOSFocusElements(e) {
      if (!e) {
        return
      }
      const focusTags = ['INPUT', 'TEXTAREA', 'SELECT']
      const focusTag = document.activeElement.tagName
      if (
        focusTags.indexOf(focusTag) !== -1 &&
        focusTags.indexOf(e.target.tagName) === -1
      ) {
        return document.activeElement.blur()
      }
    },
    handleResize() {
      this.$store.dispatch('app/windowResize', {
        width: window.innerWidth,
        height: window.innerHeight,
      })
    },
    handleExternalURLs(event) {
      const isATag = event.target.tagName.toLowerCase() === 'a'
      const isSameHost = window.location.hostname === event.target.hostname
      const mailToLinkPattern = /^mailto:/i

      // Open native mobile browser or email if the a tag has a different host or
      // if the a tag has "mailto" in its href
      if (
        isATag &&
        (!isSameHost || mailToLinkPattern.test(event.srcElement.href))
      ) {
        const { href } = event.target
        PortalService.call('browser.openWindow', {
          url: href,
          target: '_system',
        })
      }
    },
    isExemptSocketError(error) {
      return (
        error.message === 'xhr poll error' ||
        error.message === 'websocket error'
      )
    },
    refreshPage() {
      window.location.reload()
    },
    setVisibilityListener() {
      let visibilityChange
      // Opera 12.10 and Firefox 18 and later support
      if (typeof document.hidden !== 'undefined') {
        this.docHiddenProperty = 'hidden'
        visibilityChange = 'visibilitychange'
      } else if (typeof document.msHidden !== 'undefined') {
        this.docHiddenProperty = 'msHidden'
        visibilityChange = 'msvisibilitychange'
      } else if (typeof document.webkitHidden !== 'undefined') {
        this.docHiddenProperty = 'webkitHidden'
        visibilityChange = 'webkitvisibilitychange'
      }

      document.addEventListener(visibilityChange, this.handleVisibilityChange)
    },
    async handleVisibilityChange() {
      await this.$store.dispatch(
        'app/updateWebPageVisibility',
        this.docHiddenProperty
      )
    },
    emitList({ retryCount = 0, maxRetries = 5 }) {
      let isAcknowledged = false
      let timeoutId
      this.$socket.emit('list', null, (response) => {
        if (response.status === 200) {
          isAcknowledged = true
          clearTimeout(timeoutId)
          this.$store.dispatch('volunteer/handleIncomingSessions', {
            context: this,
            sessions: response.sessions,
          })
        }
      })

      if (retryCount < maxRetries) {
        // simple exponential backoff
        const delay = Math.pow(2, retryCount) * 500
        timeoutId = setTimeout(() => {
          if (!isAcknowledged) {
            this.emitList({
              retryCount: retryCount + 1,
              maxRetries,
            })
          }
        }, delay)
      } else {
        LoggerService.noticeError(
          `Max retry attempts reached, unable to fetch list of sessions for user: ${this.state.user.user.id}`
        )
      }
    },
  },
  computed: {
    ...mapState({
      showHeader: (state) => state.app.header.isShown,
      showSidebar: (state) => state.app.sidebar.isShown,
      showModal: (state) => state.app.modal.isShown,
      showBanner: (state) => state.app.banner.isShown,
      bannerComponent: (state) => state.app.banner.component,
      isMobileApp: (state) => state.app.isMobileApp,
      isWebPageHidden: (state) => state.app.isWebPageHidden,
      user: (state) => state.user.user,
      session: (state) => state.user.session,
      subjects: (state) => state.subjects.subjects,
      requestedProgressReportOverview: (state) =>
        state.user.requestedProgressReportOverview,
      showCsrfRefreshAlert: (state) => state.app.showCsrfRefreshAlert,
    }),
    ...mapGetters({
      userAuthenticated: 'user/isAuthenticated',
      isVolunteer: 'user/isVolunteer',
      mobileMode: 'app/mobileMode',
      isAutoFlowUser: 'user/isAutoFlowUser',
      getUserPropsForAnalytics: 'user/getUserPropsForAnalytics',
      showInAppSessionNotifications:
        'featureFlags/showInAppSessionNotifications',
    }),
    shouldShowRefreshAlert() {
      return this.newServerVersionAvailable || this.showCsrfRefreshAlert
    },
    refreshMessage() {
      const defaultMsg = 'Oops! Something went wrong'
      if (this.newServerVersionAvailable && !this.showCsrfRefreshAlert) {
        // Prefer the "Oops!" message over new app version when both apply
        return 'There is a new version of the app available'
      } else {
        return defaultMsg
      }
    },
  },
  // https://github.com/BrianRosamilia/vue-crono
  cron: {
    /// every 10 minutes, check the current server version
    time: 600000,
    method: 'getCurrentServerVersion',
  },
  watch: {
    user(currentUserValue, previousUserValue) {
      const nowLoggedIn = currentUserValue.id && !previousUserValue.id
      if (nowLoggedIn) {
        if (!this.$socket.connected) this.$socket.connect()

        const userProps = this.getUserPropsForAnalytics
        FeatureFlagService.setPersonPropertiesForFlags(userProps)

        AnalyticsService.identify(currentUserValue.id, userProps)
        LoggerService.identify(currentUserValue._id)

        if (this.mobileMode && !this.isMobileApp && !this.isVolunteer) {
          this.$store.dispatch('app/banner/show', {
            component: 'MobileAppNoticeBanner',
          })
        }

        this.$store.dispatch('productFlags/getUserProductFlags')
        if (Object.entries(this.subjects).length === 0)
          this.$store.dispatch('subjects/getSubjects')

        this.$store.dispatch('user/getProgressReportOverviewSubjectStats')
      } else if (currentUserValue.id) {
        const userProps = this.getUserPropsForAnalytics
        AnalyticsService.updateUser(userProps)
      }
    },
    /**
     * This is a workaround for MobileAppNoticeBanner.vue not properly watching "mobileMode".
     * Hides the MobileAppNoticeBanner if not in mobile mode
     */
    mobileMode(isMobileMode) {
      if (!isMobileMode && this.bannerComponent === 'MobileAppNoticeBanner')
        this.$store.dispatch('app/banner/hide')
    },

    /**
     * On route transition, fetch current session (for students, also most recent session)
     * @todo: Fetch these much less frequently (only once).
     * @todo: Consolidate with the logic in router.
     */
    $route(to, from) {
      // Capture PostHog pageviews on route transitions
      if (to.path !== from.path) posthog.capture('$pageview')
      if (this.userAuthenticated) {
        this.$store.dispatch('user/fetchSession', this)

        if (!this.isVolunteer) {
          this.$store.dispatch('user/fetchLatestSession', this)
        }
      }
    },
    isAutoFlowUser(currentValue, prevValue) {
      if (currentValue && !prevValue) this.$router.push('/welcome')
    },
    session(currentValue, prevValue) {
      const hadASession = !currentValue.id && prevValue.id
      if (hadASession) {
        this.$store.dispatch('user/updateHadASession', true)
        this.$store.dispatch(
          'user/updatePrevSessionSubject',
          prevValue.subTopic
        )
      }
    },
  },
  sockets: {
    error(error) {
      this.$socket.emit('client_error', error)
      if (this.isExemptSocketError(error)) return
      LoggerService.noticeError(error)
    },
    // https://socket.io/docs/v2/client-api/#event-disconnect
    async disconnect(reason) {
      this.$socket.emit('client_disconnect', reason)
      const err = new Error(
        `Socket.io connection for user ${this.user.id} disconnected for reason: ${reason}`
      )
      LoggerService.noticeError(err)

      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        if (!this.$socket.connected) await this.$socket.connect()
      }
    },
    connect_error(error) {
      this.$socket.emit('client_connect_error', error)
      // these are handled internally and shouldn't be forwarded to New Relic
      if (this.isExemptSocketError(error)) return
      LoggerService.noticeError(error)
    },
    reconnect_error(error) {
      this.$socket.emit('client_reconnect_error', error)
      if (this.isExemptSocketError(error)) return
      LoggerService.noticeError(error)
    },
    'session-change'(sessionData) {
      this.$store.dispatch('user/updateSession', sessionData)
    },
    redirect() {
      this.$router.push('/')
    },
    connect() {
      this.$socket.emit('client_connect')
      if (this.isVolunteer) {
        this.emitList({ retryCount: 0, maxRetries: 5 })
      }
    },
    reconnect() {
      this.$socket.emit('client_reconnect')
    },
    reconnect_attempt() {
      this.$socket.emit('client_reconnect_attempt')
    },
    reconnect_failed() {
      this.$socket.emit('client_reconnect_failed')
    },
    'progress-report:processed:overview'(data) {
      if (data.report && data.report.status === 'complete')
        this.$store.dispatch('user/getProgressReportOverviewSubjectStats')
    },
    async sessions(sessions) {
      if (this.isVolunteer) {
        this.$store.dispatch('volunteer/handleIncomingSessions', {
          context: this,
          sessions,
        })
      }
    },
  },
}
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

.refresh-alert {
  z-index: 999;
  position: fixed;
  width: 100%;
  text-align: center;

  &__refresh-button {
    display: initial;
  }
}

.alert-warning {
  color: initial;
  background-color: #fff;
  border-color: transparent;
}

.audio__new-waiting-student {
  display: none;
}
</style>
