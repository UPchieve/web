import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import SessionOfferAlert from '@/views/SessionOffers/SessionOfferAlert.vue'
import Countdown from '@/components/Countdown.vue'
import { socket } from '@/socket'
import router from '@/router'

vi.mock('@/socket', () => ({ socket: { emit: vi.fn() } }))
vi.mock('@/router', () => ({ default: { push: vi.fn() } }))
vi.mock('@/services/AnalyticsService')
vi.mock('@/services/PresenceService')

beforeEach(() => {
  vi.resetAllMocks()
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

function mountWithOffer(offer = buildOffer()) {
  // the root state type does not list the store's modules
  const store = createStore<any>({
    modules: {
      ...storeOptions.modules,
      volunteer: {
        ...storeOptions.modules.volunteer,
        state: {
          ...storeOptions.modules.volunteer.state,
          sessionOffer: offer,
        },
      },
    },
  })
  const wrapper = mount(SessionOfferAlert, {
    global: { plugins: [store], stubs: { Countdown: true } },
  })
  return { store, wrapper }
}

function clickButton(wrapper: VueWrapper, text: string) {
  return wrapper
    .findAll('button')
    .find((button) => button.text().includes(text))!
    .trigger('click')
}

describe('SessionOfferAlert', () => {
  it('shows who is asking and for what subject', () => {
    const { wrapper } = mountWithOffer()

    expect(wrapper.text()).toContain('Ada has requested an Algebra 1 tutor')
  })

  it('counts down to when the offer expires', () => {
    const { wrapper } = mountWithOffer()

    const totalTicks = wrapper.findComponent(Countdown).props('totalTicks')
    expect(totalTicks).toBeGreaterThanOrEqual(29)
    expect(totalTicks).toBeLessThanOrEqual(30)
  })

  it('declines the offer when the coach passes', async () => {
    const { store, wrapper } = mountWithOffer()

    await clickButton(wrapper, 'Pass to another coach')

    expect(socket.emit).toHaveBeenCalledTimes(1)
    expect(socket.emit).toHaveBeenCalledWith('session-offer:decline', {
      sessionId: 'session-1',
    })
    expect(store.state.volunteer.sessionOffer).toBeNull()
  })

  it('goes to the offered session when the coach accepts', async () => {
    const { store, wrapper } = mountWithOffer()

    await clickButton(wrapper, 'Accept and start')

    expect(router.push).toHaveBeenCalledWith(
      '/session/math/algebra-one/session-1'
    )
    expect(store.state.volunteer.sessionOffer).toBeNull()
    expect(socket.emit).not.toHaveBeenCalled()
  })

  it('clears the offer without declining it when the countdown ends', async () => {
    const { store, wrapper } = mountWithOffer()

    await wrapper.findComponent(Countdown).vm.$emit('end')

    expect(store.state.volunteer.sessionOffer).toBeNull()
    expect(socket.emit).not.toHaveBeenCalled()
  })
})
