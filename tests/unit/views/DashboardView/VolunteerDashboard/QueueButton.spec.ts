import { it, expect, vi, describe, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { createPinia, setActivePinia } from 'pinia'
import { storeOptions } from '@/store'
import QueueButton from '@/views/DashboardView/VolunteerDashboard/QueueButton.vue'
import {
  useSessionOfferStore,
  type QueueJoiningState,
} from '@/stores/session-offer'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

function getWrapper(
  queueJoiningState: QueueJoiningState,
  inQueueSince: Date | null = null
) {
  setActivePinia(createPinia())
  const sessionOfferStore = useSessionOfferStore()
  sessionOfferStore.queueJoiningState = queueJoiningState
  sessionOfferStore.inQueueSince = inQueueSince
  const joinQueue = vi
    .spyOn(sessionOfferStore, 'joinQueue')
    .mockResolvedValue(undefined)
  const leaveQueue = vi
    .spyOn(sessionOfferStore, 'leaveQueue')
    .mockResolvedValue(undefined)
  const captureEvent = vi
    .spyOn(AnalyticsService, 'captureEvent')
    .mockImplementation(() => {})
  const store = createStore({
    modules: {
      app: {
        ...storeOptions.modules.app,
        state: { ...storeOptions.modules.app.state },
      },
    },
  })
  const wrapper = mount(QueueButton, {
    global: {
      plugins: [store],
      stubs: { QueueRing: true },
    },
  })
  return { wrapper, joinQueue, leaveQueue, captureEvent }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('when a queue request failed', () => {
  it.each([
    { state: 'join failed', retries: 'joinQueue' },
    { state: 'leave failed', retries: 'leaveQueue' },
  ] as const)(
    'shows the error button and retries with $retries when $state',
    async ({ state, retries }) => {
      const { wrapper, joinQueue, leaveQueue } = getWrapper(state)
      const button = wrapper.get('button')

      expect(button.text()).toContain('Try again')
      expect(button.classes()).toContain('error')
      expect(wrapper.find('.error-badge').exists()).toBe(true)

      await button.trigger('click')

      const [retried, other] =
        retries === 'joinQueue'
          ? [joinQueue, leaveQueue]
          : [leaveQueue, joinQueue]
      expect(retried).toHaveBeenCalledTimes(1)
      expect(other).not.toHaveBeenCalled()
    }
  )

  it.each(['not in queue', 'joining', 'joined', 'leaving'] as const)(
    'shows no error badge when %s',
    (state) => {
      const { wrapper } = getWrapper(state)

      expect(wrapper.find('.error-badge').exists()).toBe(false)
      expect(wrapper.get('button').classes()).not.toContain('error')
    }
  )
})

describe('when in the queue', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('has a Leave queue label alongside the time, for hover and screen readers', () => {
    const { wrapper } = getWrapper(
      'joined',
      new Date('2026-11-13T15:00:00.000Z')
    )

    expect(wrapper.get('.joined-label--queued').text()).toContain('Queued')
    expect(wrapper.get('.joined-label--leave').text()).toBe('Leave queue')
  })

  it('leaves the queue when clicked', async () => {
    const { wrapper, leaveQueue, joinQueue } = getWrapper(
      'joined',
      new Date('2026-11-13T15:00:00.000Z')
    )

    await wrapper.get('button').trigger('click')

    expect(leaveQueue).toHaveBeenCalledTimes(1)
    expect(joinQueue).not.toHaveBeenCalled()
  })

  it('shows how long the coach has been in the queue', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-13T15:05:07.000Z'))
    const { wrapper } = getWrapper(
      'joined',
      new Date('2026-11-13T15:00:00.000Z')
    )
    const button = wrapper.get('button')

    expect(button.text()).toContain('Queued')
    expect(button.get('[role="timer"]').text()).toBe('05:07')

    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()

    expect(button.get('[role="timer"]').text()).toBe('05:08')
  })

  it.each([
    'not in queue',
    'joining',
    'leaving',
    'join failed',
    'leave failed',
  ] as const)('shows no timer when %s', (state) => {
    const { wrapper } = getWrapper(state)

    expect(wrapper.find('[role="timer"]').exists()).toBe(false)
  })
})

describe('while a queue request is in flight', () => {
  it.each(['joining', 'leaving'] as const)(
    'is pending and disabled when %s',
    (state) => {
      const { wrapper } = getWrapper(state)

      expect(wrapper.classes()).toContain('main-container--pending')
      expect(wrapper.get('button').attributes()).toHaveProperty('disabled')
    }
  )

  it.each(['not in queue', 'joined', 'join failed', 'leave failed'] as const)(
    'is not pending when %s',
    (state) => {
      const { wrapper } = getWrapper(state)

      expect(wrapper.classes()).not.toContain('main-container--pending')
      expect(wrapper.get('button').attributes()).not.toHaveProperty('disabled')
    }
  )
})

describe('analytics', () => {
  it('captures that the coach saw the queue button', () => {
    const { captureEvent } = getWrapper('not in queue')

    expect(captureEvent).toHaveBeenCalledWith(EVENTS.SAW_QUEUE_BUTTON)
  })

  it.each([
    { state: 'not in queue', event: EVENTS.CLICKED_JOINED_QUEUE },
    { state: 'join failed', event: EVENTS.CLICKED_JOINED_QUEUE },
    { state: 'joined', event: EVENTS.CLICKED_LEAVE_QUEUE },
    { state: 'leave failed', event: EVENTS.CLICKED_LEAVE_QUEUE },
  ] as const)(
    'captures $event when clicked while $state',
    async ({ state, event }) => {
      const { wrapper, captureEvent } = getWrapper(state)
      captureEvent.mockClear()

      await wrapper.get('button').trigger('click')

      expect(captureEvent).toHaveBeenCalledTimes(1)
      expect(captureEvent).toHaveBeenCalledWith(event)
    }
  )

  it.each(['joining', 'leaving'] as const)(
    'captures no click event while %s',
    async (state) => {
      const { wrapper, captureEvent } = getWrapper(state)
      captureEvent.mockClear()

      await wrapper.get('button').trigger('click')

      expect(captureEvent).not.toHaveBeenCalled()
    }
  )
})
