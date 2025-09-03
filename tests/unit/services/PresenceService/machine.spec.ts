import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import { nextTick } from 'vue'
import { createActor } from 'xstate'
import { activityMachine } from '@/services/PresenceService/machine'
import * as PresenceService from '@/services/PresenceService'

vi.mock('../../../services/NetworkService')
vi.mock('@/services/PresenceService')

const getStore = (args: { state?: any } = {}) => {
  return createStore({
    modules: {
      ...storeOptions.modules,
      session: {
        ...storeOptions.modules.session,
        state: {
          ...storeOptions.modules.session.state,
          ...(args?.state || {}),
        },
      },
    },
  })
}

const waitFor = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('activityMachine', () => {
  let actor: any
  const store = getStore()
  const trackingInterval = 10
  beforeEach(() => {
    vi.resetAllMocks()
    // clear user so we start in the UserUnauthenticated state
    store.commit('user/setUser', {})

    actor = createActor(activityMachine, {
      input: { getStore: () => store, trackingInterval },
    })
    actor.start()
  })
  afterEach(() => {
    actor.stop()
  })

  it('can transition to each state', async () => {
    expect(actor.getSnapshot().value).toBe('UserUnauthenticated')

    actor.send({ type: 'AUTHENTICATED' })
    expect(actor.getSnapshot().value).toStrictEqual({
      UserAuthenticated: 'TrackingStarted',
    })

    actor.send({ type: 'DOCUMENT_HIDDEN' })
    expect(actor.getSnapshot().value).toStrictEqual({
      UserAuthenticated: 'TrackingPaused',
    })

    actor.send({ type: 'DOCUMENT_VISIBLE' })
    expect(actor.getSnapshot().value).toStrictEqual({
      UserAuthenticated: 'TrackingStarted',
    })

    actor.send({ type: 'UNAUTHENTICATED' })
    expect(actor.getSnapshot().value).toBe('UserUnauthenticated')
  })

  it('handles auth related events (actors/authWatcher)', async () => {
    const mock = vi.mocked(PresenceService.trackActivity)

    expect(actor.getSnapshot().value).toBe('UserUnauthenticated')
    store.commit('user/setUser', { id: '123' })
    await nextTick()
    expect(actor.getSnapshot().value).toStrictEqual({
      UserAuthenticated: 'TrackingStarted',
    })
    expect(
      PresenceService.trackActivity,
      'is called once when transitioning into TrackingStarted'
    ).toHaveBeenCalledOnce()
    mock.mockRestore()
    store.commit('user/setUser', {})
    await nextTick()

    // Trigger one of our EVENTS_TO_TRACK
    document.dispatchEvent(new KeyboardEvent('keyup'))
    await waitFor(trackingInterval)

    expect(actor.getSnapshot().value).toBe('UserUnauthenticated')
    expect(
      PresenceService.trackActivity,
      'it is not called once we transition to UserUnauthenticated'
    ).not.toHaveBeenCalledOnce()
  })

  it('tracks activity events (actors/activityListeners)', async () => {
    const mock = vi.mocked(PresenceService.trackActivity)

    expect(actor.getSnapshot().value).toBe('UserUnauthenticated')
    expect(
      actor.getSnapshot().context.activityHappened,
      'defaults to false'
    ).toBe(false)
    expect(
      PresenceService.trackActivity,
      'has not yet been called'
    ).not.toHaveBeenCalledOnce()
    store.commit('user/setUser', { id: '123' })
    await nextTick()
    expect(
      PresenceService.trackActivity,
      'called when we first transition to TrackingStarted'
    ).toHaveBeenCalledOnce()
    mock.mockRestore()

    // Trigger one of our EVENTS_TO_TRACK
    document.dispatchEvent(new KeyboardEvent('keyup'))
    expect(PresenceService.trackActivity).not.toHaveBeenCalled()
    expect(actor.getSnapshot().context.activityHappened).toBe(true)
    await waitFor(trackingInterval)
    expect(
      PresenceService.trackActivity,
      'called once because activityHappened is true'
    ).toHaveBeenCalledOnce()
    mock.mockRestore()
    expect(actor.getSnapshot().context.activityHappened).toBe(false)
    await waitFor(trackingInterval)
    expect(
      PresenceService.trackActivity,
      'not called again because activityHappnd is false'
    ).not.toHaveBeenCalled()
  })

  it('tracks visibility events (actors/visibilityWatcher)', async () => {
    const activityMock = vi.mocked(PresenceService.trackActivity)
    const passivitiyMock = vi.mocked(PresenceService.trackPassivity)
    const visibilityStateMock = vi.fn().mockReturnValue('visible')

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: visibilityStateMock,
    })

    expect(actor.getSnapshot().value).toBe('UserUnauthenticated')
    store.commit('user/setUser', { id: '123' })
    await nextTick()
    expect(actor.getSnapshot().value).toStrictEqual({
      UserAuthenticated: 'TrackingStarted',
    })

    expect(
      PresenceService.trackActivity,
      'is called once when transitioning into TrackingStarted'
    ).toHaveBeenCalledOnce()
    activityMock.mockRestore()

    visibilityStateMock.mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))

    await nextTick()

    expect(actor.getSnapshot().value).toStrictEqual({
      UserAuthenticated: 'TrackingPaused',
    })

    expect(
      PresenceService.trackPassivity,
      'is called once when the document became hidden'
    ).toHaveBeenCalledOnce()
    passivitiyMock.mockRestore()

    visibilityStateMock.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(actor.getSnapshot().value).toStrictEqual({
      UserAuthenticated: 'TrackingStarted',
    })
    expect(
      PresenceService.trackPassivity,
      'is not called once when the document became visible'
    ).not.toHaveBeenCalled()
  })

  it('prevents visibility watcher from firing when the page closes (actors/pagehideWatcher)', async () => {
    const activityMock = vi.mocked(PresenceService.trackActivity)
    const visibilityStateMock = vi.fn().mockReturnValue('visible')
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: visibilityStateMock,
    })

    expect(actor.getSnapshot().value).toBe('UserUnauthenticated')
    store.commit('user/setUser', { id: '123' })
    await nextTick()
    expect(actor.getSnapshot().value).toStrictEqual({
      UserAuthenticated: 'TrackingStarted',
    })
    expect(actor.getSnapshot().context.tabIsClosing).toBe(false)

    expect(
      PresenceService.trackActivity,
      'is called once when transitioning into TrackingStarted'
    ).toHaveBeenCalledOnce()
    activityMock.mockRestore()

    visibilityStateMock.mockReturnValue('hidden')
    // order is important;
    // pagehide is called first in the browser and will set tabIsClosing=true
    // make sure visibilitychange is not called
    window.dispatchEvent(new Event('pagehide'))
    document.dispatchEvent(new Event('visibilitychange'))

    await nextTick()

    expect(actor.getSnapshot().context.tabIsClosing).toBe(true)
    expect(
      PresenceService.trackPassivity,
      'it is not called because context.tabIsClosing is true'
    ).not.toHaveBeenCalled()
  })
})
