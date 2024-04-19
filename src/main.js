import Vue from 'vue'
import VueSocketIO from 'vue-socket.io'
import VueRouter from 'vue-router'
import vSelect from 'vue-select'
import VueStarRating from 'vue-star-rating'
import ToggleButton from 'vue-js-toggle-button'
import moment from 'moment'
import App from './components/App/index.vue'
import PortalService from './services/PortalService'
import router from './router'
import store from './store'
import config from './config'
import NetworkService, { axiosInstance } from './services/NetworkService'
import { backOff } from 'exponential-backoff'
import io from 'socket.io-client'
import AnalyticsService from './services/AnalyticsService'
import FeatureFlagService from './services/FeatureFlagService'
import LoggerService from './services/LoggerService'

LoggerService.init()

// Prevent production tip on startup
Vue.config.productionTip = false

// Set up SocketIO
Vue.use(
  new VueSocketIO({
    connection: io(config.socketAddress, {
      autoConnect: false,
    }),
  })
)

// Set up Vue Router
Vue.use(VueRouter)

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

// Set up vue-select
Vue.component('v-select', vSelect)

// Set up vue-star-rating
Vue.component('vue-star-rating', VueStarRating)

// Set up vue-js-toggle-button
Vue.use(ToggleButton)

// Filter for formatting times
Vue.filter('formatTime', (value) => {
  if (value) {
    return moment(value).format('h:mm a')
  }
})

function initVue() {
  // Create Vue instance
  const app = new Vue({
    router,
    store,
    render: (h) => h(App),
  }).$mount('#app')

  // allow e2e tests to see Vuex store
  if (window.Cypress) {
    window.app = app
  }
}

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
      flagsResponse.value?.data?.featureFlagPayloads
    )
    AnalyticsService.init()

    initVue()
  } catch (err) {
    LoggerService.noticeError(err)
  }
}

main()
