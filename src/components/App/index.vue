<template>
  <AppTheme>
    <div id="app" class="App" :class="isIOS && 'is-ios'">
      <Celebration />
      <ion-app>
        <ion-content>
          <refresh-app-alert v-if="doMountRefreshAppAlert" />
          <route-loading-indicator />
          <app-header v-show="showHeader" />
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
            <attention-boxes v-if="shouldShowInAppSessionNotifications" />
            <router-view v-slot="{ Component, route }">
              <component
                :is="Component"
                :key="route.meta.disableComponentReuse ? route.path : undefined"
                :class="{ 'fade-in': fadeInContent }"
                @animationend="endFade"
              />
            </router-view>
          </div>
        </ion-content>
      </ion-app>
    </div>
  </AppTheme>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { IonApp, IonContent } from '@ionic/vue'
import Gleap from 'gleap'
import posthog from 'posthog-js'
import '@/scss/main.scss'
import AppHeader from './AppHeader/index.vue'
import AppSidebar from './AppSidebar/index.vue'
import AppModal from './AppModal/index.vue'
import AppBanner from './AppBanner/index.vue'
import getOperatingSystem from '@/utils/get-operating-system'
import isOutdatedMobileAppVersion from '@/utils/is-outdated-mobile-app-version'
import AnalyticsService from '@/services/AnalyticsService'
import FeatureFlagService from '@/services/FeatureFlagService'
import LoggerService from '@/services/LoggerService'
import AttentionBoxes from '../AttentionBoxes.vue'
import { socket } from '@/socket'
import sound from '@/assets/audio/alert.mp3'
import RefreshAppAlert from '@/views/RefreshAppAlert.vue'
import Celebration from '@/components/Celebration.vue'
import getNotificationPermission from '@/utils/get-notification-permission'
import { EVENTS } from '@/consts'
import RouteLoadingIndicator from '../RouteLoadingIndicator.vue'
import AppTheme from './AppTheme.vue'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export default {
  name: 'App',
  components: {
    RefreshAppAlert,
    AppHeader,
    AppSidebar,
    AppModal,
    AppBanner,
    AttentionBoxes,
    IonApp,
    IonContent,
    Celebration,
    RouteLoadingIndicator,
    AppTheme,
  },
  data() {
    return {
      audioAlert: new Audio(sound),
      isIOS: false,
      docHiddenProperty: '',
      checkForUpdateIntervalId: null,
    }
  },
  async created() {
    // Listen for resize event
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
    await this.$store.dispatch('app/checkEnvironment', this)

    this.setVisibilityListener()

    if (this.isMobileApp) {
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
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
      this.$store.commit('app/setPrefersReducedMotion', true)
    }
    window
      .matchMedia(REDUCED_MOTION_QUERY)
      .addEventListener('change', this.updateMotionPreference)
  },
  mounted() {
    if (this.mobileMode) {
      Gleap.hide()
    }
    this.$store.commit(
      'volunteer/setNewWaitingStudentAudioElement',
      this.audioAlert
    )
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    clearInterval(this.checkForUpdateIntervalId)

    if (this.isMobileApp) {
      if (getOperatingSystem() === 'iOS') {
        document.addEventListener('click', this.iOSFocusElements, false)
      }
    }
    window
      .matchMedia(REDUCED_MOTION_QUERY)
      .removeEventListener('change', this.updateMotionPreference)
  },
  methods: {
    endFade() {
      this.$store.commit('app/setFadeInContent', false)
    },
    updateMotionPreference(e) {
      this.$store.commit('app/setPrefersReducedMotion', e.matches)
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
      socket.emit('list', null, (response) => {
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
          `Max retry attempts reached, unable to fetch list of sessions for user: ${this.user.id}`
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
      topics: (state) => state.subjects.topics,
      productFlags: (state) => state.productFlags.flags,
      isConnected: (state) => state.socket.isConnected,
      messageData: (state) => state.socket.messageData,
      fadeInContent: (state) => state.app.fadeInContent,
    }),
    ...mapGetters({
      userAuthenticated: 'user/isAuthenticated',
      mobileMode: 'app/mobileMode',
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      isTeacher: 'user/isTeacher',
      getUserPropsForAnalytics: 'user/getUserPropsForAnalytics',
      showInAppSessionNotifications:
        'featureFlags/showInAppSessionNotifications',
      isReadyToTutor: 'volunteer/isReadyToTutor',
      isShowDMNotificationsEnabled: 'featureFlags/isShowDMNotificationsEnabled',
    }),
    shouldShowInAppSessionNotifications() {
      return this.showInAppSessionNotifications && this.isReadyToTutor
    },
    doMountRefreshAppAlert() {
      return this.$route.name !== 'SessionView'
    },
    isSocketReadyToGetWaitingStudents() {
      return [this.isConnected, this.isVolunteer]
    },
  },
  watch: {
    async user(currentUserValue, previousUserValue) {
      const nowLoggedIn = currentUserValue.id && !previousUserValue.id
      if (nowLoggedIn) {
        if (!this.$store.state.socket.isConnected) {
          this.$store.dispatch('socket/connect')
        }

        await this.$store.dispatch('productFlags/getUserProductFlags')
        const userProps = this.getUserPropsForAnalytics()
        AnalyticsService.identify(currentUserValue.id, userProps)
        LoggerService.identify(currentUserValue.id)
        FeatureFlagService.setPersonPropertiesForFlags(userProps)

        if (this.mobileMode && !this.isMobileApp && this.isStudent) {
          this.$store.dispatch('app/banner/show', {
            component: 'MobileAppNoticeBanner',
          })
        }

        if (this.isStudent) {
          this.$store.dispatch('session/fetchLatestSession')
        }

        if (Object.entries(this.subjects).length === 0)
          this.$store.dispatch('subjects/getSubjects')

        if (!this.topics.length) {
          this.$store.dispatch('subjects/getTopics')
        }

        this.$store.dispatch('user/getProgressReportOverviewSubjectStats')

        // We're gathering initial data for PostHog since we cannot backfill and know who previously
        // granted web notification permissions. We'll be removing this after a couple of weeks
        if (getNotificationPermission() === 'granted')
          AnalyticsService.captureEvent(
            EVENTS.USER_HAS_GRANTED_WEB_NOTIFICATION_PERMISSION
          )

        //Chrome extension experiment; We want to track users who clicked the extension
        if (this.$route.query?.utm_medium === 'upchieve_chrome_extension') {
          AnalyticsService.captureEvent(EVENTS.CHROME_EXTENSION_CLICKED, {
            utm_source: this.$route.query?.utm_source
              ? this.$route.query.utm_source
              : 'general-educational-site',
            utm_content: this.$route.query?.utm_content
              ? this.$route.query.utm_content
              : 'extension',
          })
        }

        if (this.isShowDMNotificationsEnabled)
          this.$store.dispatch('user/fetchUnreadDMs')
      } else if (currentUserValue.id) {
        const userProps = this.getUserPropsForAnalytics()
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
     * On route transition, fetch current session.
     * @todo: Fetch these much less frequently (only once).
     * @todo: Consolidate with the logic in router.
     * @todo: Consolidate with latestSession.
     */
    $route(to, from) {
      // Capture PostHog pageviews on route transitions
      if (to.path !== from.path) {
        posthog.capture('$pageview')
      }
      if (to.path !== '/logout' && this.userAuthenticated) {
        if (!this.isTeacher) {
          this.$store.dispatch('user/fetchSession', this)
        }
      }
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
    isSocketReadyToGetWaitingStudents(currentVal) {
      const [isConnected, isVolunteer] = currentVal
      if (isConnected && isVolunteer) {
        this.emitList({ retryCount: 0, maxRetries: 5 })
      }
    },
    messageData(data) {
      if (!data) return
      this.$store.dispatch('user/fetchUnreadDMs')
    },
  },
}
</script>

<style lang="scss">
%LargeButton {
  border: 1px solid rgba(0, 0, 0, 0); // for consistent button size
  border-radius: 20px;
  padding: 9px 23px; // subtracted 1px for border
  display: inline-flex;
}
</style>

<style lang="scss" scoped>
ion-content {
  --background: transparent;
  font-family: $font-family-default;
  font-display: swap;
}

.fade-in {
  animation: fadeInContent 350ms ease forwards;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

@keyframes fadeInContent {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

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
    @include bind-app-sidebar-width(padding-left, 0);
  }
}
</style>
