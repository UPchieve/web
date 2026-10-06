import { describe, it, expect } from 'vitest'
import NetworkService from '@/services/NetworkService'
import type { AxiosError } from 'axios'

describe('NetworkService._axiosErrorHandler', () => {
  it('copies the server error code onto the thrown NetworkError', () => {
    const err = {
      message: 'Request failed with status code 422',
      response: {
        status: 422,
        data: {
          clientMessage: 'This session has ended.',
          code: 'SESSION_ENDED',
        },
      },
    } as AxiosError

    expect(() => NetworkService._axiosErrorHandler(err)).toThrowError(
      expect.objectContaining({ code: 'SESSION_ENDED' })
    )
  })
})
