import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWhiteboardToken } from '@/composables/useWhiteboardToken'
import WhiteboardTokenService from '@/services/WhiteboardTokenService'
import { minutesInMs } from '@/utils/time-utils'

vi.mock('exponential-backoff', () => ({
  backOff: vi.fn((request: () => Promise<unknown>) => request()),
}))

vi.mock('@/services/WhiteboardTokenService', () => ({
  default: {
    requestWhiteboardToken: vi.fn(),
  },
}))

vi.mock('@/services/LoggerService', () => ({
  default: {
    noticeError: vi.fn(),
  },
}))

const mockedWhiteboardTokenService = vi.mocked(WhiteboardTokenService)
const sessionId = 'session-id'
const now = new Date('2026-11-18T12:00:00.000Z')
const expiresAt = new Date(now.getTime() + minutesInMs(60)).toISOString()

describe('useWhiteboardToken', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    mockedWhiteboardTokenService.requestWhiteboardToken.mockReset()
    mockedWhiteboardTokenService.requestWhiteboardToken.mockResolvedValue({
      expiresAt,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renews the token five minutes before it expires', async () => {
    const whiteboardToken = useWhiteboardToken(sessionId)

    await whiteboardToken.refresh()
    expect(
      mockedWhiteboardTokenService.requestWhiteboardToken
    ).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(minutesInMs(55))

    expect(
      mockedWhiteboardTokenService.requestWhiteboardToken
    ).toHaveBeenCalledTimes(2)
  })

  it('shares an in-progress token request', async () => {
    let resolveTokenRequest: (value: { expiresAt: string }) => void
    mockedWhiteboardTokenService.requestWhiteboardToken.mockReturnValue(
      new Promise((resolve) => {
        resolveTokenRequest = resolve
      })
    )
    const whiteboardToken = useWhiteboardToken(sessionId)

    const firstRefresh = whiteboardToken.refresh()
    const secondRefresh = whiteboardToken.refresh()

    expect(
      mockedWhiteboardTokenService.requestWhiteboardToken
    ).toHaveBeenCalledTimes(1)

    resolveTokenRequest!({ expiresAt })
    await Promise.all([firstRefresh, secondRefresh])
  })

  it('does not renew after disposal', async () => {
    const whiteboardToken = useWhiteboardToken(sessionId)

    await whiteboardToken.refresh()
    whiteboardToken.dispose()
    await vi.advanceTimersByTimeAsync(minutesInMs(60))
    await whiteboardToken.refresh()

    expect(
      mockedWhiteboardTokenService.requestWhiteboardToken
    ).toHaveBeenCalledTimes(1)
  })
})
