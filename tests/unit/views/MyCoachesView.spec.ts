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
  banType = null as string | null,
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
                banType: () => banType,
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
        UnreadFilterChip: true,
        SortDropdown: true,
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

describe('MyCoachesView unavailable coach', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedRoute.query = {}
    mockedRouter.push.mockResolvedValue(undefined)
    mockedRouter.replace.mockResolvedValue(undefined)
    mockedStatuses.value = {}
    mockedNetworkService.getPastVolunteers.mockResolvedValue({
      pastVolunteers: [
        pastVolunteer({
          volunteerId: 'unavailable',
          firstName: 'Nalini',
          subjects: ['algebraOne'],
          isUnavailable: true,
        }),
        pastVolunteer({
          volunteerId: 'available',
          firstName: 'Max',
          subjects: ['algebraOne'],
        }),
      ],
    })
  })

  function cards(wrapper: Awaited<ReturnType<typeof mountView>>) {
    return wrapper.findAll('.coach-card')
  }

  it('disables messaging an unavailable coach with a tooltip', async () => {
    const wrapper = await mountView({ isDirectMessagesEnabled: true })
    const [unavailableCard, availableCard] = cards(wrapper)

    expect(
      unavailableCard.find('[data-testid="message-button-tooltip"]').exists()
    ).toBe(true)
    const messageButton = unavailableCard.find('[data-testid="message-button"]')
    expect(messageButton.attributes('disabled')).toBeDefined()
    expect(messageButton.attributes('aria-label')).toBe(
      "You can't message this coach right now."
    )

    expect(
      availableCard.find('[data-testid="message-button-tooltip"]').exists()
    ).toBe(false)
    expect(
      availableCard
        .find('[data-testid="message-button"]')
        .attributes('disabled')
    ).toBeUndefined()
  })

  it('does not open the DM panel from an unavailable coach name', async () => {
    const wrapper = await mountView({ isDirectMessagesEnabled: true })

    expect(nameButtons(wrapper)).toEqual(['Max'])
    expect(wrapper.findComponent({ name: 'DirectMessagePanel' }).exists()).toBe(
      false
    )
  })

  it('disables requesting a session with an unavailable coach', async () => {
    const wrapper = await mountView()
    const [unavailableCard, availableCard] = cards(wrapper)

    expect(
      unavailableCard
        .find('[data-testid="request-coach-button-tooltip"]')
        .exists()
    ).toBe(true)
    expect(
      unavailableCard
        .findComponent({ name: 'RequestCoachButton' })
        .props('disabled')
    ).toBe(true)

    expect(
      availableCard
        .find('[data-testid="request-coach-button-tooltip"]')
        .exists()
    ).toBe(false)
    expect(
      availableCard
        .findComponent({ name: 'RequestCoachButton' })
        .props('disabled')
    ).toBeFalsy()
  })
})

describe('MyCoachesView completely banned student', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedRoute.query = {}
    mockedRouter.push.mockResolvedValue(undefined)
    mockedRouter.replace.mockResolvedValue(undefined)
    mockedStatuses.value = {}
    mockedNetworkService.getPastVolunteers.mockResolvedValue({
      pastVolunteers: [pastVolunteer({ subjects: ['algebraOne'] })],
    })
  })

  it('disables messaging and requesting a session for every coach', async () => {
    const wrapper = await mountView({
      isDirectMessagesEnabled: true,
      banType: 'complete',
    })

    const messageButton = wrapper.find('[data-testid="message-button"]')
    expect(messageButton.attributes('disabled')).toBeDefined()
    expect(messageButton.attributes('aria-label')).toBe(
      "You can't send messages right now."
    )
    expect(nameButtons(wrapper)).toEqual([])
    expect(
      wrapper.find('[data-testid="request-coach-button-tooltip"]').exists()
    ).toBe(true)
    expect(
      wrapper.findComponent({ name: 'RequestCoachButton' }).props('disabled')
    ).toBe(true)
  })

  it('leaves the buttons on for a shadow-banned student', async () => {
    const wrapper = await mountView({
      isDirectMessagesEnabled: true,
      banType: 'shadow',
    })

    expect(
      wrapper.find('[data-testid="message-button"]').attributes('disabled')
    ).toBeUndefined()
    expect(
      wrapper.findComponent({ name: 'RequestCoachButton' }).props('disabled')
    ).toBeFalsy()
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

  function unreadChip(wrapper: Awaited<ReturnType<typeof mountView>>) {
    return wrapper.findComponent({ name: 'UnreadFilterChip' })
  }

  describe('filtering', () => {
    it('shows only coaches with unread messages when Unread is on', async () => {
      mockedRoute.query = { unreadOnly: 'true' }
      const wrapper = await mountWithMessages()

      expect(nameButtons(wrapper)).toEqual(['Nalini', 'Kenji'])
    })

    it('shows only favorite coaches for Favorites', async () => {
      mockedRoute.query = { favoritesOnly: 'true' }
      const wrapper = await mountWithMessages()

      expect(nameButtons(wrapper)).toEqual(['Nalini', 'Fatima'])
    })

    it('combines Favorites with Unread', async () => {
      mockedRoute.query = { favoritesOnly: 'true', unreadOnly: 'true' }
      const wrapper = await mountWithMessages()

      expect(nameButtons(wrapper)).toEqual(['Nalini'])
    })

    it('ignores Unread when direct messages are off', async () => {
      mockedRoute.query = { unreadOnly: 'true' }
      const wrapper = await mountView({ unreadDirectMessageSenderIds })

      expect(unreadChip(wrapper).exists()).toBe(false)
      expect(
        wrapper
          .findAllComponents({ name: 'PersonCard' })
          .map((card) => card.props('name'))
      ).toEqual(['Nalini', 'Fatima', 'Kenji'])
    })
  })

  describe('Unread toggle', () => {
    it('counts coaches with unread messages', async () => {
      const wrapper = await mountWithMessages()

      expect(unreadChip(wrapper).props('count')).toBe(2)
      expect(unreadChip(wrapper).props('value')).toBe(false)
    })

    it('counts only favorites when Favorites is on', async () => {
      mockedRoute.query = { favoritesOnly: 'true' }
      const wrapper = await mountWithMessages()

      expect(unreadChip(wrapper).props('count')).toBe(1)
    })

    it('reads Unread from the URL', async () => {
      mockedRoute.query = { unreadOnly: 'true' }
      const wrapper = await mountWithMessages()

      expect(unreadChip(wrapper).props('value')).toBe(true)
    })

    it('writes Unread to the URL and goes back to page 1', async () => {
      mockedRoute.query = { page: '2', favoritesOnly: 'true' }
      const wrapper = await mountWithMessages()

      unreadChip(wrapper).vm.$emit('change', { value: true })

      expect(mockedRouter.push).toHaveBeenCalledWith({
        query: { page: 1, favoritesOnly: 'true', unreadOnly: 'true' },
      })
    })

    it('removes Unread from the URL when it is toggled off', async () => {
      mockedRoute.query = { unreadOnly: 'true' }
      const wrapper = await mountWithMessages()

      unreadChip(wrapper).vm.$emit('change', { value: false })

      expect(mockedRouter.push).toHaveBeenCalledWith({
        query: { page: 1, favoritesOnly: 'false' },
      })
    })
  })
})

describe('MyCoachesView sort', () => {
  function session(createdAt: string) {
    return { ...pastVolunteer().lastSession!, createdAt }
  }

  beforeEach(() => {
    vi.resetAllMocks()
    mockedRoute.query = {}
    mockedRouter.push.mockResolvedValue(undefined)
    mockedRouter.replace.mockResolvedValue(undefined)
    mockedStatuses.value = {}
    mockedNetworkService.getPastVolunteers.mockResolvedValue({
      pastVolunteers: [
        pastVolunteer({
          volunteerId: 'kenji',
          firstName: 'Kenji',
          lastSession: session('2026-11-08T15:00:00'),
        }),
        pastVolunteer({
          volunteerId: 'no-session',
          firstName: 'Ada',
          // The type says there's always one, but the view guards for a missing one
          lastSession: null as unknown as PastVolunteer['lastSession'],
        }),
        pastVolunteer({
          volunteerId: 'fatima',
          firstName: 'Fatima',
          lastSession: session('2026-11-10T15:00:00'),
        }),
        pastVolunteer({
          volunteerId: 'nalini',
          firstName: 'nalini',
          lastSession: session('2026-11-05T15:00:00'),
        }),
      ],
    })
  })

  function sortDropdown(wrapper: Awaited<ReturnType<typeof mountView>>) {
    return wrapper.findComponent({ name: 'SortDropdown' })
  }

  function cardIds(wrapper: Awaited<ReturnType<typeof mountView>>) {
    return wrapper
      .findAllComponents({ name: 'PersonCard' })
      .map((card) => card.props('name'))
  }

  it('offers the three sort options', async () => {
    const wrapper = await mountView()

    expect(sortDropdown(wrapper).props('options')).toEqual([
      { value: 'recent', label: 'Most recent session' },
      { value: 'oldest', label: 'Oldest session' },
      { value: 'alphabetical', label: 'Alphabetically' },
    ])
  })

  it('sorts by most recent session by default, with no-session coaches last', async () => {
    const wrapper = await mountView()

    expect(sortDropdown(wrapper).props('modelValue')).toBe('recent')
    expect(cardIds(wrapper)).toEqual(['Fatima', 'Kenji', 'nalini', 'Ada'])
  })

  it('sorts by oldest session from the URL, still with no-session coaches last', async () => {
    mockedRoute.query = { sort: 'oldest' }
    const wrapper = await mountView()

    expect(sortDropdown(wrapper).props('modelValue')).toBe('oldest')
    expect(cardIds(wrapper)).toEqual(['nalini', 'Kenji', 'Fatima', 'Ada'])
  })

  it('sorts by first name, ignoring case, from the URL', async () => {
    mockedRoute.query = { sort: 'alphabetical' }
    const wrapper = await mountView()

    expect(cardIds(wrapper)).toEqual(['Ada', 'Fatima', 'Kenji', 'nalini'])
  })

  it('ignores an unknown sort in the URL', async () => {
    mockedRoute.query = { sort: 'bogus' }
    const wrapper = await mountView()

    expect(sortDropdown(wrapper).props('modelValue')).toBe('recent')
  })

  it('writes the sort to the URL and goes back to page 1', async () => {
    mockedRoute.query = { page: '2', favoritesOnly: 'true' }
    const wrapper = await mountView()

    sortDropdown(wrapper).vm.$emit('update:modelValue', 'alphabetical')

    expect(mockedRouter.push).toHaveBeenCalledWith({
      query: { page: 1, favoritesOnly: 'true', sort: 'alphabetical' },
    })
  })

  it('keeps the sort in the URL when paging', async () => {
    mockedRoute.query = { sort: 'oldest' }
    mockedNetworkService.getPastVolunteers.mockResolvedValue({
      pastVolunteers: Array.from({ length: 6 }, (_, i) =>
        pastVolunteer({ volunteerId: `coach-${i}`, firstName: `Coach ${i}` })
      ),
    })
    const wrapper = await mountView()

    await wrapper
      .findAll('.page-actions__stepper')
      .find((button) => button.text() === 'Next')!
      .trigger('click')

    expect(mockedRouter.push).toHaveBeenCalledWith({
      query: { page: 2, favoritesOnly: 'false', sort: 'oldest' },
    })
  })

  it('leaves the default sort out of the URL', async () => {
    mockedRoute.query = { sort: 'oldest' }
    const wrapper = await mountView()

    sortDropdown(wrapper).vm.$emit('update:modelValue', 'recent')

    expect(mockedRouter.push).toHaveBeenCalledWith({
      query: { page: 1, favoritesOnly: 'false' },
    })
  })
})
