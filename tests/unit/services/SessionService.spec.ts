import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import SessionService from '@/services/SessionService'
import NetworkService from '@/services/NetworkService'
import router from '@/router'

vi.mock('@/services/NetworkService')
vi.mock('@/router', () => ({
  default: {
    replace: vi.fn(),
    push: vi.fn(),
    currentRoute: {
      value: { name: 'SessionView', params: { sessionId: 'session-1' } },
    },
  },
}))
vi.mock('@/store', () => ({ default: { dispatch: vi.fn(), state: {} } }))

const student = { id: 'student-1' }
const volunteer = { id: 'volunteer-1' }
const volunteerJoinedAt = '2026-09-28T15:00:00.000Z'
const afterJoin = '2026-09-28T15:01:00.000Z'

function endedSession(overrides: object) {
  return {
    id: 'session-1',
    type: 'math',
    subTopic: 'algebraOne',
    student,
    volunteer,
    volunteerJoinedAt,
    messages: [
      { user: student.id, createdAt: afterJoin },
      { user: volunteer.id, createdAt: afterJoin },
    ],
    ...overrides,
  }
}

describe('SessionService.leaveEndedSession', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(router.replace).mockReset()
    vi.mocked(NetworkService.getRecapSessionForDms).mockReset()
    Object.assign(router.currentRoute.value, {
      name: 'SessionView',
      params: { sessionId: 'session-1' },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function leaveAfterBackoff() {
    const done = SessionService.leaveEndedSession('session-1')
    await vi.runAllTimersAsync()
    await done
  }

  it.each([
    ['both sides spoke after the coach joined', '/feedback/session-1', {}],
    ['no coach joined', '/', { volunteer: null }],
  ])('when %s, replaces the route with %s', async (_, path, overrides) => {
    vi.mocked(NetworkService.getRecapSessionForDms).mockResolvedValue({
      data: { sessionId: 'session-1', data: endedSession(overrides) },
    } as never)

    await SessionService.leaveEndedSession('session-1')

    expect(NetworkService.getRecapSessionForDms).toHaveBeenCalledWith({
      sessionId: 'session-1',
    })
    expect(router.replace).toHaveBeenCalledExactlyOnceWith(path)
  })

  it('falls back to the dashboard when the session cannot be fetched', async () => {
    vi.mocked(NetworkService.getRecapSessionForDms).mockRejectedValue(
      new Error('network error')
    )

    await leaveAfterBackoff()

    expect(NetworkService.getRecapSessionForDms).toHaveBeenCalledTimes(3)
    expect(router.replace).toHaveBeenCalledExactlyOnceWith('/')
  })

  it('does not retry a refusal', async () => {
    vi.mocked(NetworkService.getRecapSessionForDms).mockRejectedValue({
      response: { status: 403 },
    })

    await leaveAfterBackoff()

    expect(NetworkService.getRecapSessionForDms).toHaveBeenCalledOnce()
    expect(router.replace).toHaveBeenCalledExactlyOnceWith('/')
  })

  it('retries a server error', async () => {
    vi.mocked(NetworkService.getRecapSessionForDms)
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({
        data: { sessionId: 'session-1', data: endedSession({}) },
      } as never)

    await leaveAfterBackoff()

    expect(NetworkService.getRecapSessionForDms).toHaveBeenCalledTimes(2)
    expect(router.replace).toHaveBeenCalledExactlyOnceWith(
      '/feedback/session-1'
    )
  })

  it.each([
    ['the dashboard', { name: 'DashboardView', params: {} }],
    [
      "the same session's review",
      { name: 'FeedbackView', params: { sessionId: 'session-1' } },
    ],
    [
      "another session's page",
      { name: 'SessionView', params: { sessionId: 'session-2' } },
    ],
  ])('stays put when the user has already moved on to %s', async (_, route) => {
    vi.mocked(NetworkService.getRecapSessionForDms).mockResolvedValue({
      data: { sessionId: 'session-1', data: endedSession({}) },
    } as never)
    Object.assign(router.currentRoute.value, route)

    await SessionService.leaveEndedSession('session-1')

    expect(router.replace).not.toHaveBeenCalled()
  })
})
