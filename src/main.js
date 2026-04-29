import { createApp } from 'vue'
import vSelect from 'vue-select'
import VueStarRating from 'vue-star-rating'
import App from './components/App/index.vue'
import router from './router'
import store from './store'
import NetworkService, { axiosInstance } from './services/NetworkService'
import AnalyticsService from './services/AnalyticsService'
import FeatureFlagService from './services/FeatureFlagService'
import LoggerService from './services/LoggerService'
import { socket } from './socket'
import { IonicVue } from '@ionic/vue'
import VueDraggableResizable from 'vue-draggable-resizable'
import { initActivityTracking } from './services/PresenceService'
import vuetify from './plugins/vuetify'
import { loadThirdPartyScripts } from '@/utils/third-party-loader'

LoggerService.init()

// remove any existing listeners after HMR
socket.off()
store.dispatch('socket/bindEvents')

function afterMount() {
  loadThirdPartyScripts()
  initActivityTracking(store)
  AnalyticsService.init()
}

async function main() {
  try {
    axiosInstance.defaults.headers.common['X-CSRF-TOKEN'] = crypto.randomUUID()
    const featureFlagsResult =
      await NetworkService.getBootstrappedFeatureFlags()
    await FeatureFlagService.init(
      featureFlagsResult?.data?.id,
      featureFlagsResult?.data?.featureFlags,
      featureFlagsResult?.data?.featureFlagPayloads,
      featureFlagsResult?.data?.personProperties
    )

    // Create Vue instance
    const app = createApp(App)
    app.use(store)
    app.use(IonicVue)
    app.use(router)
    app.use(vuetify)
    // Set up vue-select
    app.component('v-select-legacy', vSelect)
    // Set up vue-star-rating
    app.component('vue-star-rating', VueStarRating)
    // Set up vue-draggable-resizable
    app.component('vue-draggable-resizable', VueDraggableResizable)
    app.mount('#mount')

    if ('requestIdleCallback' in window) {
      requestIdleCallback(afterMount)
    } else {
      setTimeout(afterMount, 10)
    }
  } catch (err) {
    LoggerService.noticeError(err)
  }
}

main()
