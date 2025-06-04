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
import botConversationsModule from './modules/bot-conversations'
import liveMediaModule from './modules/liveMedia'
import celebrationsModule from './modules/celebrations'

// TODO: Update with the type of all the modules once convert to TS.
export type RootState = any
export type RootGetters = any

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
    liveMedia: liveMediaModule,
    botConversations: botConversationsModule,
    celebrations: celebrationsModule,
  },
}

export default createStore(storeOptions)
