import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import vuexStore from '@/store'
import { useSessionOfferStore } from '@/stores/session-offer'
import { useNotificationsStore } from '@/stores/notifications'
import { socket } from '@/socket'
import router from '@/router'
import * as PresenceService from '@/services/PresenceService'
import sendWebNotification from '@/utils/send-web-notification'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import { POSTHOG_FEATURE_FLAGS } from '@/consts'
import { USER_BAN_TYPES } from '@/constants/user'
import type { FeatureFlagState } from '@/store/modules/feature-flags'

vi.mock('@/socket', () => ({ socket: { emit: vi.fn() } }))
vi.mock('@/router', () => ({ default: { push: vi.fn() } }))
vi.mock('@/services/AnalyticsService')
vi.mock('@/services/PresenceService')
vi.mock('@/utils/send-web-notification')

const webNotification = { close: vi.fn() }

beforeEach(() => {
  vi.resetAllMocks()
  setActivePinia(createPinia())
  vuexStore.commit('user/setSession', {})
  vi.mocked(sendWebNotification).mockReturnValue(
    webNotification as unknown as Notification
  )
})

function buildOffer(overrides = {}) {
  return {
    sessionId: 'session-1',
    subject: 'algebraOne',
    subjectDisplayName: 'Algebra 1',
    topic: 'math',
    studentFirstName: 'Ada',
    expiresAt: new Date(Date.now() + 30_000).toISOString(),
    ...overrides,
  }
}

function offerNotification() {
  return useNotificationsStore().notifications.find(
    ({ type }) => type === 'session-offer'
  )!
}

describe('show', () => {
  it('shows the offer at the front of the attention boxes', () => {
    useNotificationsStore().add({ id: 'other', title: 'Other' })

    useSessionOfferStore().show(buildOffer())

    expect(useNotificationsStore().notifications[0]).toBe(offerNotification())
    expect(offerNotification()).toMatchObject({
      title: 'Algebra 1',
      description: 'Ada',
      modal: true,
      countdown: true,
    })
  })

  it('counts down to when the offer expires', () => {
    useSessionOfferStore().show(buildOffer())

    const { duration } = offerNotification()
    expect(duration).toBeGreaterThanOrEqual(29_000)
    expect(duration).toBeLessThanOrEqual(30_000)
  })

  it('checks whether the coach has gone inactive', () => {
    useSessionOfferStore().show(buildOffer())

    expect(PresenceService.checkForInactivity).toHaveBeenCalledTimes(1)
  })

  it('sends a web notification about who is asking', () => {
    useSessionOfferStore().show(buildOffer())

    expect(sendWebNotification).toHaveBeenCalledWith(
      'Ada has requested an Algebra 1 tutor',
      expect.anything(),
      { type: 'session-offer', sessionId: 'session-1' }
    )
  })

  it('does not show while the coach is in a live session', () => {
    vuexStore.commit('user/setSession', { createdAt: new Date() })

    useSessionOfferStore().show(buildOffer())

    expect(useSessionOfferStore().offer).toBeNull()
    expect(useNotificationsStore().notifications).toHaveLength(0)
  })

  it('replaces an offer that is already showing', () => {
    useSessionOfferStore().show(buildOffer())

    useSessionOfferStore().show(buildOffer({ sessionId: 'session-2' }))

    expect(useSessionOfferStore().offer?.sessionId).toBe('session-2')
    expect(useNotificationsStore().notifications).toHaveLength(1)
    expect(webNotification.close).toHaveBeenCalledTimes(1)
  })
})

describe('clear', () => {
  it('removes the offer, its attention box, and its web notification', () => {
    useSessionOfferStore().show(buildOffer())

    useSessionOfferStore().clear('session-1')

    expect(useSessionOfferStore().offer).toBeNull()
    expect(useNotificationsStore().notifications).toHaveLength(0)
    expect(webNotification.close).toHaveBeenCalledTimes(1)
  })

  it('keeps the offer when a different session is cleared', () => {
    useSessionOfferStore().show(buildOffer())

    useSessionOfferStore().clear('session-2')

    expect(useSessionOfferStore().offer?.sessionId).toBe('session-1')
    expect(useNotificationsStore().notifications).toHaveLength(1)
  })
})

describe('responding to the offer', () => {
  it('declines the offer when the coach passes', () => {
    useSessionOfferStore().show(buildOffer())

    offerNotification().secondaryCta!.action!()

    expect(socket.emit).toHaveBeenCalledTimes(1)
    expect(socket.emit).toHaveBeenCalledWith('session-offer:decline', {
      sessionId: 'session-1',
    })
    expect(useSessionOfferStore().offer).toBeNull()
  })

  it('goes to the offered session when the coach accepts', () => {
    useSessionOfferStore().show(buildOffer())

    offerNotification().cta!.action()

    expect(router.push).toHaveBeenCalledWith(
      '/session/math/algebra-one/session-1'
    )
    expect(useSessionOfferStore().offer).toBeNull()
    expect(socket.emit).not.toHaveBeenCalled()
  })

  it('clears the offer without declining it when the countdown ends', () => {
    useSessionOfferStore().show(buildOffer())

    offerNotification().onExpire!()

    expect(useSessionOfferStore().offer).toBeNull()
    expect(socket.emit).not.toHaveBeenCalled()
  })
})

describe('queue', () => {
  // the API sends an ISO string; the store keeps a Date
  const JOINED_AT_ISO = '2026-11-13T15:00:00.000Z'
  const JOINED_AT = new Date(JOINED_AT_ISO)

  beforeEach(() => {
    vi.spyOn(LoggerService, 'noticeError').mockImplementation(() => {})
  })

  const queueState = (store: ReturnType<typeof useSessionOfferStore>) =>
    store.queueJoiningState
  const inQueueSince = (store: ReturnType<typeof useSessionOfferStore>) =>
    store.inQueueSince
  const getStore = () => useSessionOfferStore()

  // a coach in the queue since JOINED_AT
  const queuedStore = () => {
    const store = useSessionOfferStore()
    store.queueJoiningState = 'joined'
    store.inQueueSince = JOINED_AT
    return store
  }

  describe('loadQueueStatus', () => {
    it('stores joined and when the coach joined the queue', async () => {
      vi.spyOn(NetworkService, 'getVolunteerQueueStatus').mockResolvedValue({
        isInQueue: true,
        inQueueSince: JOINED_AT_ISO,
      })
      const store = getStore()

      await store.loadQueueStatus()

      expect(queueState(store)).toEqual('joined')
      expect(inQueueSince(store)).toEqual(JOINED_AT)
    })

    it('stores not in queue and clears inQueueSince when the coach is not in the queue', async () => {
      vi.spyOn(NetworkService, 'getVolunteerQueueStatus').mockResolvedValue({
        isInQueue: false,
        inQueueSince: null,
      })
      const store = queuedStore()

      await store.loadQueueStatus()

      expect(queueState(store)).toEqual('not in queue')
      expect(inQueueSince(store)).toBeNull()
    })

    it('keeps the current state when the request fails', async () => {
      vi.spyOn(NetworkService, 'getVolunteerQueueStatus').mockRejectedValue(
        new Error('network down')
      )
      const store = queuedStore()

      await store.loadQueueStatus()

      expect(queueState(store)).toEqual('joined')
      expect(inQueueSince(store)).toEqual(JOINED_AT)
      expect(LoggerService.noticeError).toHaveBeenCalled()
    })
  })

  describe('joinQueue', () => {
    it('is joining while the request is in flight, then joined since the time subway sends', async () => {
      let resolveJoin: () => void = () => {}
      vi.spyOn(NetworkService, 'joinVolunteerQueue').mockReturnValue(
        new Promise<void>((resolve) => (resolveJoin = resolve))
      )
      vi.spyOn(NetworkService, 'getVolunteerQueueStatus').mockResolvedValue({
        isInQueue: true,
        inQueueSince: JOINED_AT_ISO,
      })
      const store = getStore()

      const joining = store.joinQueue()
      expect(queueState(store)).toEqual('joining')
      resolveJoin()
      await joining

      expect(queueState(store)).toEqual('joined')
      expect(inQueueSince(store)).toEqual(JOINED_AT)
    })

    it('counts from when the join succeeded if reading the join time fails', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-11-13T16:30:00.000Z'))
      try {
        vi.spyOn(NetworkService, 'joinVolunteerQueue').mockResolvedValue()
        vi.spyOn(NetworkService, 'getVolunteerQueueStatus').mockRejectedValue(
          new Error('network down')
        )
        const store = getStore()

        await store.joinQueue()

        expect(queueState(store)).toEqual('joined')
        expect(inQueueSince(store)).toEqual(
          new Date('2026-11-13T16:30:00.000Z')
        )
      } finally {
        vi.useRealTimers()
      }
    })

    it('is join failed with no inQueueSince when the request fails', async () => {
      vi.spyOn(NetworkService, 'joinVolunteerQueue').mockRejectedValue(
        new Error('network down')
      )
      vi.spyOn(NetworkService, 'getVolunteerQueueStatus')
      const store = getStore()

      await store.joinQueue()

      expect(queueState(store)).toEqual('join failed')
      expect(inQueueSince(store)).toBeNull()
      expect(NetworkService.getVolunteerQueueStatus).not.toHaveBeenCalled()
      expect(LoggerService.noticeError).toHaveBeenCalled()
    })
  })

  describe('leaveQueue', () => {
    it('is leaving while the request is in flight, then not in queue with no inQueueSince', async () => {
      let resolveLeave: () => void = () => {}
      vi.spyOn(NetworkService, 'leaveVolunteerQueue').mockReturnValue(
        new Promise<void>((resolve) => (resolveLeave = resolve))
      )
      const store = queuedStore()

      const leaving = store.leaveQueue()
      expect(queueState(store)).toEqual('leaving')
      resolveLeave()
      await leaving

      expect(queueState(store)).toEqual('not in queue')
      expect(inQueueSince(store)).toBeNull()
    })

    it('is leave failed and keeps inQueueSince when the request fails', async () => {
      vi.spyOn(NetworkService, 'leaveVolunteerQueue').mockRejectedValue(
        new Error('network down')
      )
      const store = queuedStore()

      await store.leaveQueue()

      // the coach is still in the queue
      expect(queueState(store)).toEqual('leave failed')
      expect(inQueueSince(store)).toEqual(JOINED_AT)
      expect(LoggerService.noticeError).toHaveBeenCalled()
    })
  })

  describe('onLeftQueue', () => {
    it.each(['manually exited queue', 'inactive', 'joined session'] as const)(
      'sets the state to not in queue and clears inQueueSince when the reason is %s',
      (reason) => {
        const store = queuedStore()

        store.onLeftQueue(reason)

        expect(queueState(store)).toEqual('not in queue')
        expect(inQueueSince(store)).toBeNull()
        expect(store.leftQueueReason).toEqual(reason)
      }
    )
  })

  describe('isQueueEligible', () => {
    const readyCoach = {
      userType: 'volunteer',
      isOnboarded: true,
      isApproved: true,
    }

    const setSessionOffersFlag = (value: string) => {
      // RootState doesn't type the featureFlags module
      const state = vuexStore.state as typeof vuexStore.state & {
        featureFlags: FeatureFlagState
      }
      state.featureFlags.multivariantFlags[
        POSTHOG_FEATURE_FLAGS.SESSION_OFFERS_COACH
      ] = value
    }

    // a ready-to-tutor coach, not in a session, targeted by the flag
    beforeEach(() => {
      vuexStore.commit('user/setUser', readyCoach)
      setSessionOffersFlag('test')
    })

    it('Returns true for a ready-to-tutor coach who is not in a session and is targeted by the feature flag', () => {
      expect(getStore().isQueueEligible).toBe(true)
    })

    it.each([
      ['not onboarded', { isOnboarded: false }],
      ['not approved', { isApproved: false }],
      ['not a volunteer', { userType: 'student' }],
    ])('Returns false if the coach is not ready to tutor (%s)', (_, user) => {
      vuexStore.commit('user/setUser', { ...readyCoach, ...user })

      expect(getStore().isQueueEligible).toBe(false)
    })

    it.each([USER_BAN_TYPES.COMPLETE, USER_BAN_TYPES.SHADOW])(
      'Returns false if the coach is %s-banned',
      (banType) => {
        vuexStore.commit('user/setUser', { ...readyCoach, banType })

        expect(getStore().isQueueEligible).toBe(false)
      }
    )

    it('Is still true for a live media-banned coach', () => {
      vuexStore.commit('user/setUser', {
        ...readyCoach,
        banType: USER_BAN_TYPES.LIVE_MEDIA,
      })

      expect(getStore().isQueueEligible).toBe(true)
    })

    it('Returns false if the coach is in a session', () => {
      vuexStore.commit('user/setSession', { createdAt: new Date() })

      expect(getStore().isQueueEligible).toBe(false)
    })

    it('Is true again once the session has ended', () => {
      vuexStore.commit('user/setSession', {
        createdAt: new Date(),
        endedAt: new Date(),
      })

      expect(getStore().isQueueEligible).toBe(true)
    })

    it.each(['control', ''])(
      'Returns false if the coach is not targeted by the feature flag (%j)',
      (variant) => {
        setSessionOffersFlag(variant)

        expect(getStore().isQueueEligible).toBe(false)
      }
    )
  })
})
