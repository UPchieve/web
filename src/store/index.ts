import { createStore } from 'vuex'
import appModule from './modules/app'
import featureFlagsModule from './modules/feature-flags'
import productFlagsModule from './modules/product-flags'
import userModule, { type UserStoreState } from './modules/user'
import subjectsModule from './modules/subjects'
import volunteerModule from './modules/volunteer'
import notificationsModule from './modules/notifications'
import socketModule from './modules/socket'
import sessionModule, { type SessionState } from './modules/session'
import botConversationsModule, {
  type TutorBotStoreState,
} from './modules/bot-conversations'
import liveMediaModule from './modules/liveMedia'
import celebrationsModule from './modules/celebrations'
import americaCountsVolunteerModule from './modules/america-counts-volunteer'
import nthsModule from './modules/nths'

// TODO: Update with the type of all the modules once convert to TS.
// TODO: Move to a types store file to avoid any potential circular dependency issues
// from the store modules importing this file
export type RootState = {
  user: UserStoreState
  session: SessionState
  botConversations: TutorBotStoreState
}
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
    americaCountsVolunteer: americaCountsVolunteerModule,
    nths: nthsModule,
  },
}

export default createStore(storeOptions)
