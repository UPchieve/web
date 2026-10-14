import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SessionService from '@/services/SessionService'
import LoggerService from '@/services/LoggerService'
import { useSessionStore } from '@/stores/session'

const MINUTE_MS = 60_000

describe('`session` store', () => {
  const now = new Date('2026-01-15T12:00:00.000Z')
  const minutesAgo = (minutes: number) =>
    new Date(now.getTime() - minutes * MINUTE_MS)

  let store: ReturnType<typeof useSessionStore>

  const setLatestSession = (session: Record<string, any>) => {
    store.setLatestSession(session as any)
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    store = useSessionStore()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('starts with every field at its default', () => {
      expect(store.isPartnerOnline).toBe(false)
      expect(store.latestSession).toBeUndefined()
      expect(store.cooldownMinutes).toBe(0)
      expect(store.journeySessionData).toBeUndefined()
      expect(store.zwibbler).toBeNull()
    })
  })

  describe('hasCooldown', () => {
    it.each([
      [0, false],
      [1, true],
      [5, true],
      [-1, false],
    ])('cooldownMinutes %i -> %s', (cooldownMinutes, expected) => {
      store.cooldownMinutes = cooldownMinutes
      expect(store.hasCooldown).toBe(expected)
    })

    it('follows later changes to cooldownMinutes', () => {
      expect(store.hasCooldown).toBe(false)
      store.cooldownMinutes = 2
      expect(store.hasCooldown).toBe(true)
      store.cooldownMinutes = 0
      expect(store.hasCooldown).toBe(false)
    })
  })

  describe('onlineStatusForPartner', () => {
    it('records whether the partner is online', () => {
      store.onlineStatusForPartner(true)
      expect(store.isPartnerOnline).toBe(true)
      store.onlineStatusForPartner(false)
      expect(store.isPartnerOnline).toBe(false)
    })
  })

  describe('cooldown calculation (via startCooldownInterval)', () => {
    const ended = (overrides: Record<string, any>) => ({
      endedAt: now,
      endedByUserId: 'student-id',
      ...overrides,
    })

    const cooldownAfterStart = () => {
      store.startCooldownInterval()
      return store.cooldownMinutes
    }

    it('is 0 when there is no latest session', () => {
      expect(cooldownAfterStart()).toBe(0)
    })

    it('is 0 for an empty latest session', () => {
      setLatestSession({})
      expect(cooldownAfterStart()).toBe(0)
    })

    it('is 0 while the latest session is still ongoing', () => {
      setLatestSession({ createdAt: minutesAgo(1), endedAt: null })
      expect(cooldownAfterStart()).toBe(0)
    })

    it('is 0 when the volunteer ended the session', () => {
      setLatestSession(
        ended({
          createdAt: minutesAgo(1),
          volunteerId: 'volunteer-id',
          endedByUserId: 'volunteer-id',
        })
      )
      expect(cooldownAfterStart()).toBe(0)
    })

    it('applies the cooldown when a matched student ended the session', () => {
      setLatestSession(
        ended({
          createdAt: minutesAgo(1),
          volunteerId: 'volunteer-id',
          endedByUserId: 'student-id',
        })
      )
      expect(cooldownAfterStart()).toBe(4)
    })

    it('applies the cooldown when the ender or volunteer is unknown', () => {
      setLatestSession(
        ended({ createdAt: minutesAgo(1), endedByUserId: undefined })
      )
      expect(cooldownAfterStart()).toBe(4)
    })

    it.each([
      [0, 5],
      [1, 4],
      [2.5, 3],
      [3.5, 2],
      [4, 1],
      [4.99, 1],
      [5, 0],
      [6, 0],
      [60, 0],
    ])(
      'a session started %d minutes ago gives %d minute(s) of cooldown',
      (startedMinutesAgo, expected) => {
        setLatestSession(ended({ createdAt: minutesAgo(startedMinutesAgo) }))
        expect(cooldownAfterStart()).toBe(expected)
      }
    )

    it('measures from when the session started, not when it ended', () => {
      setLatestSession(
        ended({ createdAt: minutesAgo(4), endedAt: minutesAgo(3) })
      )
      expect(cooldownAfterStart()).toBe(1)
    })
  })

  describe('startCooldownInterval', () => {
    const endedByStudent = (startedMinutesAgo: number) => ({
      createdAt: minutesAgo(startedMinutesAgo),
      endedAt: now,
      endedByUserId: 'student-id',
    })

    it('sets the cooldown immediately', () => {
      setLatestSession(endedByStudent(2))
      store.startCooldownInterval()
      expect(store.cooldownMinutes).toBe(3)
      expect(store.hasCooldown).toBe(true)
    })

    it('resets a stale cooldown to 0', () => {
      store.cooldownMinutes = 4
      store.startCooldownInterval()
      expect(store.cooldownMinutes).toBe(0)
      expect(store.hasCooldown).toBe(false)
    })

    it('starts no timer when there is no cooldown', () => {
      store.startCooldownInterval()
      expect(store.cooldownMinutes).toBe(0)
      expect(vi.getTimerCount()).toBe(0)
    })

    it('counts down once a minute and stops at zero', async () => {
      setLatestSession(endedByStudent(2))
      store.startCooldownInterval()
      expect(vi.getTimerCount()).toBe(1)

      await vi.advanceTimersByTimeAsync(MINUTE_MS)
      expect(store.cooldownMinutes).toBe(2)
      await vi.advanceTimersByTimeAsync(MINUTE_MS)
      expect(store.cooldownMinutes).toBe(1)
      expect(vi.getTimerCount()).toBe(1)

      await vi.advanceTimersByTimeAsync(MINUTE_MS)
      expect(store.cooldownMinutes).toBe(0)
      expect(store.hasCooldown).toBe(false)
      expect(vi.getTimerCount()).toBe(0)
    })

    it('keeps a single timer when restarted', () => {
      setLatestSession(endedByStudent(2))
      store.startCooldownInterval()
      store.startCooldownInterval()
      expect(vi.getTimerCount()).toBe(1)
    })

    it('cancels the old timer when restarted with no cooldown', () => {
      setLatestSession(endedByStudent(2))
      store.startCooldownInterval()
      setLatestSession({})
      store.startCooldownInterval()
      expect(vi.getTimerCount()).toBe(0)
    })

    it('stopCooldownInterval cancels the timer', () => {
      setLatestSession(endedByStudent(2))
      store.startCooldownInterval()
      store.stopCooldownInterval()
      expect(vi.getTimerCount()).toBe(0)
    })

    it('does not update before a full minute has passed', async () => {
      setLatestSession(endedByStudent(2))
      store.startCooldownInterval()

      await vi.advanceTimersByTimeAsync(MINUTE_MS - 1)
      expect(store.cooldownMinutes).toBe(3)
    })
  })

  describe('fetchLatestSession', () => {
    const sessionData = {
      id: 'session-1',
      createdAt: minutesAgo(2),
      endedAt: now,
      endedByUserId: 'student-id',
    }

    it('stores the latest session', async () => {
      vi.spyOn(SessionService, 'getLatestSession').mockResolvedValue({
        sessionData,
      })

      await store.fetchLatestSession()

      expect(store.latestSession).toEqual(sessionData)
    })

    it('starts the cooldown for the fetched session', async () => {
      vi.spyOn(SessionService, 'getLatestSession').mockResolvedValue({
        sessionData,
      })

      await store.fetchLatestSession()

      expect(store.cooldownMinutes).toBe(3)
      expect(vi.getTimerCount()).toBe(1)
    })

    it('resets latestSession and logs when the request fails', async () => {
      const noticeError = vi
        .spyOn(LoggerService, 'noticeError')
        .mockImplementation(() => {})
      setLatestSession({ id: 'old-session' })
      vi.spyOn(SessionService, 'getLatestSession').mockRejectedValue(
        new Error('network down')
      )

      await expect(store.fetchLatestSession()).resolves.toBeUndefined()

      expect(store.latestSession).toEqual({})
      expect(noticeError).toHaveBeenCalledTimes(1)
      expect(noticeError).toHaveBeenCalledWith(
        expect.stringContaining(
          'Could not set latest session in session store: '
        )
      )
      expect(noticeError.mock.calls[0][0]).toContain('network down')
    })

    it('unwraps HTTP error responses in the log message', async () => {
      const noticeError = vi
        .spyOn(LoggerService, 'noticeError')
        .mockImplementation(() => {})
      vi.spyOn(SessionService, 'getLatestSession').mockRejectedValue({
        status: 500,
        data: { err: 'Server exploded' },
      })

      await store.fetchLatestSession()

      expect(noticeError.mock.calls[0][0]).toContain('Server exploded')
    })

    it('starts no cooldown when the request fails', async () => {
      vi.spyOn(LoggerService, 'noticeError').mockImplementation(() => {})
      vi.spyOn(SessionService, 'getLatestSession').mockRejectedValue(
        new Error('nope')
      )

      await store.fetchLatestSession()

      expect(store.cooldownMinutes).toBe(0)
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('setZwibbler', () => {
    it('stores the whiteboard instance so other stores can call it', () => {
      const save = vi.fn().mockReturnValue('data:image/jpeg;base64,abc')
      store.setZwibbler({ save })

      const result = store.zwibbler?.save({ format: 'image/jpeg' })

      expect(save).toHaveBeenCalledWith({ format: 'image/jpeg' })
      expect(result).toBe('data:image/jpeg;base64,abc')
    })

    it('does not make the instance reactive', () => {
      const instance = { save: vi.fn() }
      store.setZwibbler(instance)
      expect(store.zwibbler).toBe(instance)
    })

    it('clears the instance with null', () => {
      store.setZwibbler({ save: vi.fn() })
      store.setZwibbler(null)
      expect(store.zwibbler).toBeNull()
    })
  })

  describe('setLatestSession', () => {
    it('stores the session', () => {
      store.setLatestSession({ id: 'session-1', createdAt: now })
      expect(store.latestSession).toEqual({ id: 'session-1', createdAt: now })
    })

    it('replaces a previous session', () => {
      store.setLatestSession({ id: 'session-1', createdAt: now })
      store.setLatestSession({ id: 'session-2', createdAt: now })
      expect(store.latestSession?.id).toBe('session-2')
    })

    it('does not start a cooldown on its own', () => {
      store.setLatestSession({
        createdAt: minutesAgo(1),
        endedAt: now,
        endedByUserId: 'student-id',
      })
      expect(store.cooldownMinutes).toBe(0)
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('journeySessionData', () => {
    const data = {
      dropdownLabel: 'Essay help',
      key: 'essay',
      stepNumber: 1,
      title: 'Essay',
      subject: 'essay',
    }

    it('setJourneySessionData stores the data', () => {
      store.setJourneySessionData(data)
      expect(store.journeySessionData).toEqual(data)
    })

    it('clearJourneySessionData resets it to undefined', () => {
      store.setJourneySessionData(data)
      store.clearJourneySessionData()
      expect(store.journeySessionData).toBeUndefined()
    })

    it('clearJourneySessionData is a no-op when nothing is set', () => {
      store.clearJourneySessionData()
      expect(store.journeySessionData).toBeUndefined()
    })
  })
})
