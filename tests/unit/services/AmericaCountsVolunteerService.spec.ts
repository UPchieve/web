import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { cloneDeep } from 'lodash-es'
import { toRaw } from 'vue'
import store from '@/store'
import router from '@/router'
import AnalyticsService from '@/services/AnalyticsService'
import { maybeAutoJoinOldestSession } from '@/services/AmericaCountsVolunteerService'
import { EVENTS } from '@/consts'

vi.mock('@/router', async () => {
  const { createMemoryHistory, createRouter } = await import('vue-router')
  const component = { render: () => null }

  return {
    default: createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dashboard', component },
        { path: '/training', component },
        { path: '/session/:subject/:topic/:id', component },
      ],
    }),
  }
})

vi.mock('@/services/NetworkService', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/NetworkService')>()

  return {
    ...actual,
    default: {
      ...actual.default,
      currentSession: vi.fn(async () => ({ data: {} })),
      latestSession: vi.fn(async () => ({ data: { data: {} } })),
    },
  }
})

const NOW = new Date('2026-01-01T12:00:00.000Z')
const ONE_MINUTE = 1000 * 60
const initialState = cloneDeep(toRaw(store.state))

function makeSession({ id, minutesAgo }: { id: string; minutesAgo: number }) {
  return {
    id,
    type: 'math',
    subTopic: 'algebraOne',
    createdAt: new Date(NOW.getTime() - minutesAgo * ONE_MINUTE).toISOString(),
    student: { currentGradeName: '8th' },
  }
}

async function checkForAutoJoin() {
  await maybeAutoJoinOldestSession(store.getters['volunteer/availableSessions'])
  await flushPromises()
}

beforeEach(async () => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(NOW)

  store.replaceState(cloneDeep(initialState))
  store.commit('user/setUser', {
    id: 'volunteer-1',
    userType: 'volunteer',
    isOnboarded: true,
    isApproved: true,
    banType: null,
    subjects: ['algebraOne'],
    sponsorships: [{ key: 'america-counts' }],
  })

  vi.spyOn(AnalyticsService, 'captureEvent').mockImplementation(() => {})

  await router.replace('/dashboard')
  vi.spyOn(router, 'push')
})

afterEach(async () => {
  // Clear the service's module-level recheck before restoring real timers.
  await maybeAutoJoinOldestSession([])
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  store.replaceState(cloneDeep(initialState))
})

describe('maybeAutoJoinOldestSession', () => {
  it('does not join a session that has waited less than the minimum wait time', async () => {
    store.commit('volunteer/setAllOpenSessions', [
      makeSession({ id: 's1', minutesAgo: 2 }),
    ])

    await checkForAutoJoin()

    expect(router.currentRoute.value.path).toBe('/dashboard')
    expect(router.push).not.toHaveBeenCalled()
    expect(AnalyticsService.captureEvent).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(1)
  })

  it('joins the session when it reaches the minimum wait time', async () => {
    store.commit('volunteer/setAllOpenSessions', [
      makeSession({ id: 's1', minutesAgo: 2 }),
    ])

    await checkForAutoJoin()
    await vi.advanceTimersByTimeAsync(ONE_MINUTE - 1)
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/dashboard')
    expect(router.push).not.toHaveBeenCalled()
    expect(AnalyticsService.captureEvent).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/session/math/algebra-one/s1')
    expect(router.push).toHaveBeenCalledTimes(1)
    expect(AnalyticsService.captureEvent).toHaveBeenCalledWith(
      EVENTS.AUTO_JOINED_SESSION
    )
    expect(vi.getTimerCount()).toBe(0)
  })

  it('joins immediately when a session has already waited long enough', async () => {
    store.commit('volunteer/setAllOpenSessions', [
      makeSession({ id: 's1', minutesAgo: 5 }),
    ])

    await checkForAutoJoin()

    expect(router.currentRoute.value.path).toBe('/session/math/algebra-one/s1')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('joins the oldest session that has waited long enough', async () => {
    store.commit('volunteer/setAllOpenSessions', [
      makeSession({ id: 'too-new', minutesAgo: 1 }),
      makeSession({ id: 'older', minutesAgo: 4 }),
      makeSession({ id: 'oldest', minutesAgo: 10 }),
    ])

    await checkForAutoJoin()

    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.path).toBe(
      '/session/math/algebra-one/oldest'
    )
    expect(vi.getTimerCount()).toBe(0)
  })

  it('joins the oldest session as soon as it crosses the wait time', async () => {
    store.commit('volunteer/setAllOpenSessions', [
      makeSession({ id: 'oldest', minutesAgo: 2 }),
      makeSession({ id: 'newest', minutesAgo: 0 }),
    ])

    await checkForAutoJoin()
    await vi.advanceTimersByTimeAsync(ONE_MINUTE)
    await flushPromises()

    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.path).toBe(
      '/session/math/algebra-one/oldest'
    )
  })

  it('uses the current store sessions when the scheduled recheck runs', async () => {
    store.commit('volunteer/setAllOpenSessions', [
      makeSession({ id: 'removed', minutesAgo: 2 }),
    ])

    await checkForAutoJoin()

    store.commit('volunteer/setAllOpenSessions', [
      makeSession({ id: 'replacement', minutesAgo: 2 }),
    ])

    await vi.advanceTimersByTimeAsync(ONE_MINUTE)
    await flushPromises()

    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.path).toBe(
      '/session/math/algebra-one/replacement'
    )
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not join on a page where auto-join is disabled', async () => {
    store.commit('volunteer/setAllOpenSessions', [
      makeSession({ id: 's1', minutesAgo: 5 }),
    ])
    await router.replace('/training')

    await checkForAutoJoin()

    expect(router.currentRoute.value.path).toBe('/training')
    expect(router.push).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('waits for the post-session cooldown to expire before joining', async () => {
    store.commit('volunteer/setAllOpenSessions', [
      makeSession({ id: 's1', minutesAgo: 5 }),
    ])
    await store.dispatch('americaCountsVolunteer/startCooldown', ONE_MINUTE)

    await checkForAutoJoin()
    await vi.advanceTimersByTimeAsync(ONE_MINUTE - 1)
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/dashboard')
    expect(router.push).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(1)
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/session/math/algebra-one/s1')
    expect(router.push).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not join for a volunteer who is not an America Counts volunteer', async () => {
    store.commit('volunteer/setAllOpenSessions', [
      makeSession({ id: 's1', minutesAgo: 5 }),
    ])
    store.commit('user/setUser', {
      ...store.state.user.user,
      sponsorships: [],
    })

    await checkForAutoJoin()

    expect(router.currentRoute.value.path).toBe('/dashboard')
    expect(router.push).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})
