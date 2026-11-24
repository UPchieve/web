import { backOff } from 'exponential-backoff'
import LoggerService from '@/services/LoggerService'
import { isNetworkError } from '@/services/NetworkService'
import WhiteboardTokenService from '@/services/WhiteboardTokenService'
import { minutesInMs, secondsInMs } from '@/utils/time-utils'

const RENEWAL_BUFFER_MS = minutesInMs(5)
const TOKEN_REFRESH_ATTEMPTS = 4

function shouldRetryTokenRequest(error: unknown) {
  return !isNetworkError(error) || error.status == null || error.status >= 500
}

export function useWhiteboardToken(sessionId: string) {
  let renewalTimeout: ReturnType<typeof setTimeout> | null = null
  let refreshPromise: Promise<void> | null = null
  let disposed = false

  function clearRenewal() {
    clearTimeout(renewalTimeout)
    renewalTimeout = null
  }

  function scheduleRenewal(expiresAt: string) {
    clearRenewal()

    const renewalDelayMs =
      Date.parse(expiresAt) - Date.now() - RENEWAL_BUFFER_MS

    if (!Number.isFinite(renewalDelayMs) || renewalDelayMs <= 0) {
      LoggerService.noticeError('Invalid whiteboard token expiration.', {
        sessionId,
        expiresAt,
      })
      return
    }

    renewalTimeout = setTimeout(() => {
      refresh().catch((err) => {
        LoggerService.noticeError(err, { sessionId })
      })
    }, renewalDelayMs)
  }

  function refresh() {
    if (disposed) return Promise.resolve()

    if (!refreshPromise) {
      refreshPromise = backOff(
        () => WhiteboardTokenService.requestWhiteboardToken(sessionId),
        {
          numOfAttempts: TOKEN_REFRESH_ATTEMPTS,
          startingDelay: secondsInMs(30),
          timeMultiple: 2,
          retry: (error) => !disposed && shouldRetryTokenRequest(error),
        }
      )
        .then(({ expiresAt }) => {
          if (!disposed) scheduleRenewal(expiresAt)
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    return refreshPromise
  }

  function dispose() {
    disposed = true
    clearRenewal()
  }

  return { refresh, dispose }
}
