import { createStore } from 'vuex'
import appModule from './modules/app'
import featureFlagsModule from './modules/feature-flags'
import productFlagsModule from './modules/product-flags'
import userModule from './modules/user'
import subjectsModule from './modules/subjects'
import volunteerModule from './modules/volunteer'
import notificationsModule from './modules/notifications'
import socketModule from './modules/socket'
import sessionModule from './modules/session'

export const storeOptions = {
  modules: {
    app: appModule,
    user: userModule,
    productFlags: productFlagsModule,
    featureFlags: featureFlagsModule,
    subjects: subjectsModule,
    volunteer: volunteerModule,
    notifications: notificationsModule,
    socket: socketModule,
    session: sessionModule,
  },
}

export default createStore(storeOptions)
