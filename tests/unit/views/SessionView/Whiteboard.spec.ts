import { describe, expect, it, vi } from 'vitest'
import Whiteboard from '@/views/SessionView/Whiteboard.vue'
import LoggerService from '@/services/LoggerService'

vi.mock('@/services/LoggerService', () => ({
  default: {
    noticeError: vi.fn(),
  },
}))

const handleInitialTokenError = (
  Whiteboard as unknown as {
    methods: {
      handleInitialTokenError: (this: object, error: Error) => void
    }
  }
).methods.handleInitialTokenError

describe('Whiteboard', () => {
  it('shows the connection failure state when the initial token request fails', () => {
    const error = new Error('Token request failed')
    const zwibblerCtx = { setConfig: vi.fn() }
    const whiteboard = {
      isConnected: true,
      loadingText: 'Attempting to connect the whiteboard',
      zwibblerCtx,
      sessionId: 'session-id',
      isZwibserveSession: true,
    }

    handleInitialTokenError.call(whiteboard, error)

    expect(whiteboard.isConnected).toBe(false)
    expect(whiteboard.loadingText).toBeNull()
    expect(zwibblerCtx.setConfig).toHaveBeenCalledWith('readOnly', true)
    expect(LoggerService.noticeError).toHaveBeenCalledWith(error, {
      sessionId: 'session-id',
      isZwibserveSession: true,
    })
  })
})
