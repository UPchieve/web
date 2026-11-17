import MyCoachesView from '@/views/MyCoachesView.vue'
import NetworkService from '@/services/NetworkService'
import type { PastVolunteer } from '@/types/students'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createStore } from 'vuex'

const { mockedRoute, mockedRouter } = vi.hoisted(() => ({
  mockedRoute: { query: {} as Record<string, string> },
  mockedRouter: {
    push: vi.fn(() => Promise.resolve()),
    replace: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => mockedRoute,
  useRouter: () => mockedRouter,
}))

vi.mock('@/services/NetworkService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/NetworkService')>()),
  default: {
    getPastVolunteers: vi.fn(),
  },
}))

const mockedStatuses = ref<Record<string, string>>({})
vi.mock('@/composables/useCoachStatuses', () => ({
  useCoachStatuses: () => ({ statuses: mockedStatuses }),
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
  unreadDirectMessageSenderIds = [] as string[],
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
              getters: {
                unreadDirectMessageSenderIds: () =>
                  unreadDirectMessageSenderIds,
              },
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
        MessageFilterDropdown: true,
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
    mockedRoute.query = {}
    mockedRouter.push.mockResolvedValue(undefined)
    mockedRouter.replace.mockResolvedValue(undefined)
    mockedStatuses.value = {}
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

  it('passes no status for a coach who is not sharing theirs', async () => {
    mockedStatuses.value = { sharer: 'online' }
    const wrapper = await mountView()

    const cards = wrapper.findAllComponents({ name: 'PersonCard' })
    expect(cards.map((card) => card.props('status'))).toEqual([
      'online',
      undefined,
    ])
  })

  it('passes the coach status to the DM panel', async () => {
    mockedStatuses.value = { private: 'online' }
    const wrapper = await mountView({ isDirectMessagesEnabled: true })

    await wrapper
      .findAll('[data-testid="person-card-name-button"]')[1]
      .trigger('click')

    expect(
      wrapper.findComponent({ name: 'DirectMessagePanel' }).props('status')
    ).toBe('online')
  })
})

describe('MyCoachesView filters', () => {
  // unreadFav: favorite, unread | readFav: favorite, read | unreadOther: not favorite, unread
  const unreadDirectMessageSenderIds = ['unread-fav', 'unread-other']

  beforeEach(() => {
    vi.resetAllMocks()
    mockedRoute.query = {}
    mockedRouter.push.mockResolvedValue(undefined)
    mockedRouter.replace.mockResolvedValue(undefined)
    mockedStatuses.value = {}
    mockedNetworkService.getPastVolunteers.mockResolvedValue({
      pastVolunteers: [
        pastVolunteer({
          volunteerId: 'unread-fav',
          firstName: 'Nalini',
          isFavorite: true,
        }),
        pastVolunteer({
          volunteerId: 'read-fav',
          firstName: 'Fatima',
          isFavorite: true,
        }),
        pastVolunteer({
          volunteerId: 'unread-other',
          firstName: 'Kenji',
          isFavorite: false,
        }),
      ],
    })
  })

  function mountWithMessages() {
    return mountView({
      isDirectMessagesEnabled: true,
      unreadDirectMessageSenderIds,
    })
  }

  function messageFilter(wrapper: Awaited<ReturnType<typeof mountView>>) {
    return wrapper.findComponent({ name: 'MessageFilterDropdown' })
  }

  describe('filtering', () => {
    it('shows only coaches with unread messages for "New message"', async () => {
      mockedRoute.query = { messages: 'new' }
      const wrapper = await mountWithMessages()

      expect(nameButtons(wrapper)).toEqual(['Nalini', 'Kenji'])
    })

    it('shows only coaches without unread messages for "No new messages"', async () => {
      mockedRoute.query = { messages: 'none' }
      const wrapper = await mountWithMessages()

      expect(nameButtons(wrapper)).toEqual(['Fatima'])
    })

    it('shows only favorite coaches for Favorites', async () => {
      mockedRoute.query = { favoritesOnly: 'true' }
      const wrapper = await mountWithMessages()

      expect(nameButtons(wrapper)).toEqual(['Nalini', 'Fatima'])
    })

    it('combines Favorites with "New message"', async () => {
      mockedRoute.query = { favoritesOnly: 'true', messages: 'new' }
      const wrapper = await mountWithMessages()

      expect(nameButtons(wrapper)).toEqual(['Nalini'])
    })
  })

  describe('URL', () => {
    it('reads the message filter from the URL', async () => {
      mockedRoute.query = { messages: 'new' }
      const wrapper = await mountWithMessages()

      expect(messageFilter(wrapper).props('modelValue')).toEqual(['new'])
    })

    it('shows every coach when both options are in the URL', async () => {
      mockedRoute.query = { messages: 'new,none' }
      const wrapper = await mountWithMessages()

      expect(messageFilter(wrapper).props('modelValue')).toEqual([
        'new',
        'none',
      ])
      expect(nameButtons(wrapper)).toEqual(['Nalini', 'Fatima', 'Kenji'])
    })

    it('ignores unknown message filter values in the URL', async () => {
      mockedRoute.query = { messages: 'bogus' }
      const wrapper = await mountWithMessages()

      expect(messageFilter(wrapper).props('modelValue')).toEqual([])
      expect(nameButtons(wrapper)).toEqual(['Nalini', 'Fatima', 'Kenji'])
    })

    it('writes the message filter to the URL and goes back to page 1', async () => {
      mockedRoute.query = { page: '2', favoritesOnly: 'true' }
      const wrapper = await mountWithMessages()

      messageFilter(wrapper).vm.$emit('update:modelValue', ['new'])

      expect(mockedRouter.push).toHaveBeenCalledWith({
        query: { page: 1, favoritesOnly: 'true', messages: 'new' },
      })
    })

    it('removes the message filter from the URL when it is cleared', async () => {
      mockedRoute.query = { messages: 'new' }
      const wrapper = await mountWithMessages()

      messageFilter(wrapper).vm.$emit('update:modelValue', [])

      expect(mockedRouter.push).toHaveBeenCalledWith({
        query: { page: 1, favoritesOnly: 'false' },
      })
    })
  })
})
