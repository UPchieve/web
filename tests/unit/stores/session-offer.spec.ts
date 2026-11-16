import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import vuexStore from '@/store'
import { useSessionOfferStore } from '@/stores/session-offer'
import { useNotificationsStore } from '@/stores/notifications'
import { socket } from '@/socket'
import router from '@/router'
import * as PresenceService from '@/services/PresenceService'
import sendWebNotification from '@/utils/send-web-notification'

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
