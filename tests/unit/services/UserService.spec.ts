import { describe, it, expect, vi, beforeEach } from 'vitest'
import UserService from '@/services/UserService'
import NetworkService from '@/services/NetworkService'

vi.mock('@/services/NetworkService')
vi.mock('@/services/AnalyticsService', () => ({
  default: { captureEvent: vi.fn() },
}))

function fakeStore() {
  return { dispatch: vi.fn().mockResolvedValue(undefined) }
}

describe('UserService.setProfile', () => {
  beforeEach(() => {
    vi.mocked(NetworkService.setProfile).mockResolvedValue(undefined as never)
  })

  // Occupation is what decides NTHS eligibility, so the sidebar entry and the
  // route guards are wrong until the store hears about the change.
  it('refreshes NTHS data when the save changes occupation', async () => {
    const store = fakeStore()
    await UserService.setProfile(
      { occupation: ['A high school student'] },
      store
    )
    expect(store.dispatch).toHaveBeenCalledWith(
      'nths/refreshAfterProfileChange'
    )
  })

  it('leaves NTHS data alone for a save that cannot affect eligibility', async () => {
    const store = fakeStore()
    await UserService.setProfile({ isDeactivated: true }, store)
    expect(store.dispatch).not.toHaveBeenCalledWith(
      'nths/refreshAfterProfileChange'
    )
  })
})
