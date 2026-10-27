import { shallowMount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import { useAppHeaderStore } from '@/stores/app/header'
import { useSessionStore } from '@/stores/session'
import AppHeader from '@/components/App/AppHeader/index.vue'
import BannedHeader from '@/components/App/AppHeader/BannedHeader.vue'
import DefaultHeader from '@/components/App/AppHeader/DefaultHeader.vue'
import IncentiveBannerHeader from '@/components/App/AppHeader/IncentiveBannerHeader.vue'
import RejoinSessionHeader from '@/components/App/AppHeader/RejoinSessionHeader.vue'
import SessionHeader from '@/components/App/AppHeader/SessionHeader.vue'
import VerificationHeader from '@/components/App/AppHeader/VerificationHeader.vue'
import WaitingPeriodHeader from '@/components/App/AppHeader/WaitingPeriodHeader.vue'

const getWrapper = (params) => {
  const options = {
    banType: 'none',
    emailVerified: true,
    hasCooldown: false,
    isIncentiveBannerEnabled: false,
    isSessionAlive: false,
    mobileMode: false,
    routeName: 'LoginView',
    ...params,
  }

  useSessionStore().cooldownMinutes = options.hasCooldown ? 1 : 0

  const store = createStore({
    modules: {
      app: {
        ...storeOptions.modules.app,
        state: {
          showHeader: true,
        },
        getters: {
          mobileMode: () => options.mobileMode,
        },
      },
      user: {
        ...storeOptions.modules.user,
        state: {
          user: {
            emailVerified: options.emailVerified,
            banType: options.banType,
          },
        },
        getters: {
          isSessionAlive: () => options.isSessionAlive,
          isStudent: () => true,
        },
      },
      featureFlags: {
        ...storeOptions.modules.featureFlags,
        getters: {
          isIncentiveBannerEnabled: () => options.isIncentiveBannerEnabled,
        },
      },
    },
  })

  return shallowMount(AppHeader, {
    global: {
      plugins: [store],
      mocks: {
        $route: {
          name: options.routeName,
          query: {},
        },
      },
    },
  })
}

test('renders BannedHeader if the user is banned before anything else', async () => {
  const wrapper = getWrapper({
    banType: 'complete',
    emailVerified: false,
    hasCooldown: true,
    isIncentiveBannerEnabled: true,
    isSessionAlive: true,
    routeName: 'SessionView',
  })

  const c = wrapper.findComponent(BannedHeader)
  expect(c.exists()).toBe(true)
})

test.each([
  ['renders', true, false],
  ['does not show', false, true],
])(
  '%s SessionHeader when user is in a session and mobileMode=%s',
  (_, mobileMode, isShown) => {
    const wrapper = getWrapper({
      emailVerified: false,
      hasCooldown: true,
      isIncentiveBannerEnabled: true,
      isSessionAlive: true,
      mobileMode,
      routeName: 'SessionView',
    })

    const c = wrapper.findComponent(SessionHeader)
    expect(c.exists()).toBe(true)
    expect(useAppHeaderStore().isShown).toBe(isShown)
  }
)

test.each([true, false])(
  'renders SessionHeader when user is on feedback and mobileMode=%s',
  (mobileMode) => {
    const wrapper = getWrapper({
      emailVerified: false,
      hasCooldown: true,
      isIncentiveBannerEnabled: true,
      isSessionAlive: true,
      mobileMode,
      routeName: 'FeedbackView',
    })

    const c = wrapper.findComponent(SessionHeader)
    expect(c.exists()).toBe(true)
    expect(useAppHeaderStore().isShown).toBe(true)
  }
)

test('renders RejoinSessionHeader when user is not in session and session is active', () => {
  const wrapper = getWrapper({
    emailVerified: false,
    hasCooldown: true,
    isIncentiveBannerEnabled: true,
    isSessionAlive: true,
  })

  const c = wrapper.findComponent(RejoinSessionHeader)
  expect(c.exists()).toBe(true)
})

test('renders WaitingPeriodHeader when user has a cooldown', () => {
  const wrapper = getWrapper({
    emailVerified: false,
    hasCooldown: true,
    isIncentiveBannerEnabled: true,
  })

  const c = wrapper.findComponent(WaitingPeriodHeader)
  expect(c.exists()).toBe(true)
})

test('renders IncentiveBannerHeader when incentive banner enabled', () => {
  const wrapper = getWrapper({
    emailVerified: false,
    isIncentiveBannerEnabled: true,
  })

  const c = wrapper.findComponent(IncentiveBannerHeader)
  expect(c.exists()).toBe(true)
})

test('renders VerificationHeader when email not verified', () => {
  const wrapper = getWrapper({
    emailVerified: false,
  })

  const c = wrapper.findComponent(VerificationHeader)
  expect(c.exists()).toBe(true)
})

test('renders DefaultHeader when no other header state activated', () => {
  const wrapper = getWrapper()

  const c = wrapper.findComponent(DefaultHeader)
  expect(c.exists()).toBe(true)
})
