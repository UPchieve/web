import { createApp } from 'vue'
import vSelect from 'vue-select'
import VueStarRating from 'vue-star-rating'
import App from './components/App/index.vue'
import PortalService from './services/PortalService'
import router from './router'
import store from './store'
import NetworkService, { axiosInstance } from './services/NetworkService'
import { backOff } from 'exponential-backoff'
import AnalyticsService from './services/AnalyticsService'
import FeatureFlagService from './services/FeatureFlagService'
import LoggerService from './services/LoggerService'
import { socket } from './socket'
import { IonicVue } from '@ionic/vue'
import VueDraggableResizable from 'vue-draggable-resizable'
import { initActivityTracking } from './services/PresenceService'

LoggerService.init()

// remove any existing listeners after HMR
socket.off()
store.dispatch('socket/bindEvents')

// Set up PortalGun (connection to native app)
PortalService.listen()

const handlePortalData = (data) => {
  // TODO: don't route immediately if push is received while app is open.
  // can detect with `if (data._isPush && data._original?.additionalData?.foreground)`
  // and show own UI for notification
  if (data && data.path) {
    router.push(data.path)
  }
}

// Has data when app is opened w/ cold start from push notification
PortalService.call('top.getData').then(handlePortalData)

// Called any time app is running (warm start) & push notification is received
PortalService.call('top.onData', handlePortalData)

async function main() {
  try {
    const [csrfResponse, flagsResponse] = await Promise.allSettled([
      backOff(() => NetworkService.getCsrfToken()),
      NetworkService.getBootstrappedFeatureFlags(),
    ])

    const csrfToken = csrfResponse.value.data.csrfToken
    store.commit('app/setCsrfToken', csrfToken)
    axiosInstance.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken

    await FeatureFlagService.init(
      flagsResponse.value?.data?.id,
      flagsResponse.value?.data?.featureFlags,
      flagsResponse.value?.data?.featureFlagPayloads,
      flagsResponse.value?.data?.personProperties
    )
    await AnalyticsService.init()

    // initActivityTracking(store)

    // Create Vue instance
    const app = createApp(App)
    app.use(store)
    app.use(IonicVue)
    app.use(router)
    // Set up vue-select
    app.component('v-select', vSelect)
    // Set up vue-star-rating
    app.component('vue-star-rating', VueStarRating)
    // Set up vue-draggable-resizable
    app.component('vue-draggable-resizable', VueDraggableResizable)
    app.mount('#mount')
  } catch (err) {
    LoggerService.noticeError(err)
  }
}

main()
