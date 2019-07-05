// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import * as Sentry from '@sentry/browser'
import * as Integrations from '@sentry/integrations'

import router from './router'
import App from './App'
import vueHeadful from 'vue-headful'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [new Integrations.Vue({ Vue, attachProps: true })],
  environment: process.env.NODE_ENV,
  beforeSend (event, hint) {
    if (event.exception && hint.originalException.sentryEventId) {
      // event was already reported from server
      return null
    }

    return event
  }
})

// Setup vue-headful
Vue.component('vue-headful', vueHeadful)

/* eslint-disable no-new */
new Vue({
  router,
  el: '#app',
  components: { App },
  template: '<App/>'
})
