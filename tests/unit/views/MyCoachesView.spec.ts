import MyCoachesView from '@/views/MyCoachesView.vue'
import NetworkService from '@/services/NetworkService'
import type { PastVolunteer } from '@/types/students'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createStore } from 'vuex'

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => ({ query: {} }),
  useRouter: () => ({
    push: vi.fn(() => Promise.resolve()),
    replace: vi.fn(() => Promise.resolve()),
  }),
}))

vi.mock('@/services/NetworkService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/NetworkService')>()),
  default: {
    getPastVolunteers: vi.fn(),
  },
}))

vi.mock('@/composables/useCoachStatuses', () => ({
  useCoachStatuses: () => ({ statuses: ref({}) }),
}))

const mockedNetworkService = vi.mocked(NetworkService)

function pastVolunteer(overrides: Partial<PastVolunteer> = {}): PastVolunteer {
  return {
    volunteerId: 'volunteer-1',
    firstName: 'Nalini',
    numSessions: 3,
    lastSession: {
      sessionId: 'session-1',
      subjectName: 'collegeCounseling',
      subjectDisplayName: 'College Counseling',
      createdAt: '2026-10-22T15:00:00',
      timeTutored: 45 * 60 * 1000,
    },
    isFavorite: false,
    publicProfileStats: {},
    subjects: [],
    ...overrides,
  }
}

async function mountView({
  isShowInfoOptInEnabled = true,
  isDirectMessagesEnabled = false,
} = {}) {
  const wrapper = mount(MyCoachesView, {
    global: {
      plugins: [
        createStore({
          modules: {
            app: {
              namespaced: true,
              getters: { mobileMode: () => false },
            },
            user: {
              namespaced: true,
              getters: { unreadDirectMessageSenderIds: () => [] },
            },
            featureFlags: {
              namespaced: true,
              getters: {
                isDirectMessagesEnabled: () => isDirectMessagesEnabled,
                isShowCoachStatusEnabled: () => false,
                isShowInfoOptInEnabled: () => isShowInfoOptInEnabled,
              },
            },
          },
        }),
      ],
      stubs: {
        Loader: true,
        DirectMessagePanel: true,
        FavoritingToggle: true,
        RequestCoachButton: true,
        ViewFavoritesToggle: true,
      },
    },
  })
  await flushPromises()
  return wrapper
}

function nameButtons(wrapper: Awaited<ReturnType<typeof mountView>>) {
  return wrapper
    .findAll('[data-testid="person-card-name-button"]')
    .map((button) => button.text())
}

describe('MyCoachesView coach name', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedNetworkService.getPastVolunteers.mockResolvedValue({
      pastVolunteers: [
        pastVolunteer({
          volunteerId: 'sharer',
          firstName: 'Nalini',
          publicProfileStats: {
            occupation: ['Working full-time'],
            numSessionsTutored: 3,
          },
        }),
        pastVolunteer({ volunteerId: 'private', firstName: 'Max' }),
      ],
    })
  })

  it('adds the hover card only for coaches who shared info', async () => {
    const wrapper = await mountView()

    expect(nameButtons(wrapper)).toEqual(['Nalini'])
    expect(
      wrapper.findAll('[data-testid="person-card-name-popover"]')
    ).toHaveLength(1)
  })

  it('adds no hover card when the share info flag is off', async () => {
    const wrapper = await mountView({ isShowInfoOptInEnabled: false })

    expect(nameButtons(wrapper)).toEqual([])
    expect(
      wrapper.find('[data-testid="person-card-name-popover"]').exists()
    ).toBe(false)
  })

  it('opens the DM panel for that coach when their name is clicked', async () => {
    const wrapper = await mountView({ isDirectMessagesEnabled: true })

    expect(nameButtons(wrapper)).toEqual(['Nalini', 'Max'])
    await wrapper
      .findAll('[data-testid="person-card-name-button"]')[1]
      .trigger('click')

    const panel = wrapper.findComponent({ name: 'DirectMessagePanel' })
    expect(panel.exists()).toBe(true)
    expect(panel.props('partnerId')).toBe('private')
  })
})
