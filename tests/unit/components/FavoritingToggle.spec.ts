import FavoritingToggle from '@/components/FavoritingToggle.vue'
import NetworkService from '@/services/NetworkService'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/NetworkService', () => ({
  default: {
    getRemainingFavoriteVolunteers: vi.fn(),
    updateFavoriteVolunteerStatus: vi.fn(),
  },
}))

const mockedNetworkService = vi.mocked(NetworkService)

function mountToggle(
  props: { variant?: 'default' | 'badge'; initialIsFavorite?: boolean } = {}
) {
  return mount(FavoritingToggle, {
    props: { volunteerId: 'coach-1', volunteerName: 'Kenji', ...props },
    global: {
      stubs: {
        FavoritedListFullModal: true,
      },
    },
  })
}

function badge(wrapper: ReturnType<typeof mountToggle>) {
  return wrapper.find('[data-testid="favorite-badge"]')
}

describe('FavoritingToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the plain star and no badge by default', () => {
    const wrapper = mountToggle()

    expect(badge(wrapper).exists()).toBe(false)
    expect(wrapper.find('.star-icon-unfavorited').exists()).toBe(true)
  })

  it.each([
    [false, 'Favorite Kenji', 'false'],
    [true, 'Unfavorite Kenji', 'true'],
  ])(
    'labels the badge when isFavorite is %s',
    (initialIsFavorite, label, pressed) => {
      const wrapper = mountToggle({ variant: 'badge', initialIsFavorite })

      expect(badge(wrapper).attributes('aria-label')).toBe(label)
      expect(badge(wrapper).attributes('aria-pressed')).toBe(pressed)
      expect(badge(wrapper).classes('favorite-badge--active')).toBe(
        initialIsFavorite
      )
    }
  )

  it('updates the badge when the parent changes initialIsFavorite', async () => {
    const wrapper = mountToggle({ variant: 'badge' })

    await wrapper.setProps({ initialIsFavorite: true })

    expect(badge(wrapper).classes('favorite-badge--active')).toBe(true)
  })

  it('favorites the coach when the badge is clicked and there is room', async () => {
    mockedNetworkService.getRemainingFavoriteVolunteers.mockResolvedValue({
      data: { remaining: 3 },
    } as never)
    mockedNetworkService.updateFavoriteVolunteerStatus.mockResolvedValue({
      data: { isFavorite: true },
    } as never)
    const wrapper = mountToggle({ variant: 'badge' })

    await badge(wrapper).trigger('click')
    await flushPromises()

    expect(
      mockedNetworkService.updateFavoriteVolunteerStatus
    ).toHaveBeenCalledWith('coach-1', { isFavorite: true })
    expect(wrapper.emitted('change-favorited')).toEqual([['coach-1', true]])
    expect(badge(wrapper).classes('favorite-badge--active')).toBe(true)
  })

  it('shows the list-full modal when no favorites remain', async () => {
    mockedNetworkService.getRemainingFavoriteVolunteers.mockResolvedValue({
      data: { remaining: 0 },
    } as never)
    const wrapper = mountToggle({ variant: 'badge' })

    await badge(wrapper).trigger('click')
    await flushPromises()

    expect(
      wrapper.findComponent({ name: 'FavoritedListFullModal' }).exists()
    ).toBe(true)
    expect(
      mockedNetworkService.updateFavoriteVolunteerStatus
    ).not.toHaveBeenCalled()
  })

  it('unfavorites the coach right away without a confirmation modal', async () => {
    mockedNetworkService.updateFavoriteVolunteerStatus.mockResolvedValue({
      data: { isFavorite: false },
    } as never)
    const wrapper = mountToggle({ variant: 'badge', initialIsFavorite: true })

    await badge(wrapper).trigger('click')
    await flushPromises()

    expect(
      mockedNetworkService.getRemainingFavoriteVolunteers
    ).not.toHaveBeenCalled()
    expect(
      mockedNetworkService.updateFavoriteVolunteerStatus
    ).toHaveBeenCalledWith('coach-1', { isFavorite: false })
    expect(wrapper.emitted('change-favorited')).toEqual([['coach-1', false]])
    expect(badge(wrapper).classes('favorite-badge--active')).toBe(false)
  })
})
