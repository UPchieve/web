import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { moderateScreenShare } from '@/services/LiveShareService/moderation-tools'
import ModerationService from '@/services/ModerationService'

vi.mock('@/services/ModerationService', () => ({
  default: {
    checkIfVideoFrameIsClean: vi.fn().mockResolvedValue({ isClean: true }),
  },
}))

vi.mock('@/services/LoggerService', () => ({
  default: {
    noticeError: vi.fn(),
  },
}))

vi.mock('@/store', () => ({
  default: {
    state: {
      user: {
        session: {
          id: 'test-session-id',
        },
      },
    },
    getters: {
      'featureFlags/videoModerationSampleInterval': 100,
    },
  },
}))

describe('moderation-tools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('moderates HTMLCanvasElement at specified interval', async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'green'
    ctx.fillRect(0, 0, 100, 100)

    const { beginScreenShareModeration, endScreenShareModeration } =
      moderateScreenShare({ sampleInterval: 100 })

    await beginScreenShareModeration(canvas)

    // Wait for at least 2 intervals
    await new Promise((resolve) => setTimeout(resolve, 250))

    expect(ModerationService.checkIfVideoFrameIsClean).toHaveBeenCalled()

    const calls = vi.mocked(ModerationService.checkIfVideoFrameIsClean).mock
      .calls
    expect(calls[0][0]).toBeInstanceOf(FormData)

    endScreenShareModeration()
  })

  it('waits for video loadeddata event before starting moderation', async () => {
    const video = document.createElement('video')
    video.width = 100
    video.height = 100

    // Set readyState to simulate unloaded video
    Object.defineProperty(video, 'readyState', {
      value: HTMLMediaElement.HAVE_NOTHING,
      writable: true,
      configurable: true,
    })

    Object.defineProperty(video, 'videoWidth', { value: 100 })
    Object.defineProperty(video, 'videoHeight', { value: 100 })

    const { beginScreenShareModeration, endScreenShareModeration } =
      moderateScreenShare({ sampleInterval: 100 })

    await beginScreenShareModeration(video)

    // Should not have called moderation yet
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(ModerationService.checkIfVideoFrameIsClean).not.toHaveBeenCalled()

    // Simulate video loaded
    Object.defineProperty(video, 'readyState', {
      value: HTMLMediaElement.HAVE_CURRENT_DATA,
      writable: true,
      configurable: true,
    })
    video.dispatchEvent(new Event('loadeddata'))

    // Now should start moderating
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(ModerationService.checkIfVideoFrameIsClean).toHaveBeenCalled()

    endScreenShareModeration()
  })

  it('stops moderation when endScreenShareModeration is called', async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'yellow'
    ctx.fillRect(0, 0, 100, 100)

    const { beginScreenShareModeration, endScreenShareModeration } =
      moderateScreenShare({ sampleInterval: 100 })

    await beginScreenShareModeration(canvas)
    await new Promise((resolve) => setTimeout(resolve, 150))

    const callCountBeforeEnd = vi.mocked(
      ModerationService.checkIfVideoFrameIsClean
    ).mock.calls.length

    endScreenShareModeration()

    // Wait and verify no more calls
    await new Promise((resolve) => setTimeout(resolve, 250))

    const callCountAfterEnd = vi.mocked(
      ModerationService.checkIfVideoFrameIsClean
    ).mock.calls.length

    expect(callCountAfterEnd).toBe(callCountBeforeEnd)
  })

  it('handles frames that are too big and forces downscale', async () => {
    const MAX_BYTE_SIZE_FOR_FRAME = 5242880 // 5MB in bytes

    // Create a large canvas that will exceed 5MB when converted to JPEG
    const canvas = document.createElement('canvas')
    canvas.width = 4000
    canvas.height = 4000
    const ctx = canvas.getContext('2d')!

    // Fill with complex pattern to ensure large file size
    // Create high-frequency noise pattern that resists JPEG compression
    const imageData = ctx.createImageData(4000, 4000)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      // Random RGB values for maximum entropy
      data[i] = Math.floor(Math.random() * 256) // R
      data[i + 1] = Math.floor(Math.random() * 256) // G
      data[i + 2] = Math.floor(Math.random() * 256) // B
      data[i + 3] = 255 // A
    }
    ctx.putImageData(imageData, 0, 0)

    // Verify the canvas produces a blob over 5MB (test precondition)
    const testBlob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.92)
    )
    expect(testBlob.size).toBeGreaterThan(MAX_BYTE_SIZE_FOR_FRAME)

    const { beginScreenShareModeration, endScreenShareModeration } =
      moderateScreenShare({ sampleInterval: 100 })

    await beginScreenShareModeration(canvas)

    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(ModerationService.checkIfVideoFrameIsClean).toHaveBeenCalled()

    const calls = vi.mocked(ModerationService.checkIfVideoFrameIsClean).mock
      .calls
    const formData = calls[0][0] as FormData
    const frameBlob = formData.get('frame') as Blob

    // Verify the frame was downscaled (should be less than 5MB)
    expect(frameBlob.size).toBeLessThan(MAX_BYTE_SIZE_FOR_FRAME)

    endScreenShareModeration()
  })

  it('handles gradual shifts over multiple intervals with appropriate baseline', async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')!

    // Initial state: solid color
    ctx.fillStyle = 'rgb(0, 0, 0)'
    ctx.fillRect(0, 0, 100, 100)

    const { beginScreenShareModeration, endScreenShareModeration } =
      moderateScreenShare({ sampleInterval: 100 })

    await beginScreenShareModeration(canvas)

    // Wait for first frame to be moderated
    await new Promise((resolve) => setTimeout(resolve, 150))

    const initialCallCount = vi.mocked(
      ModerationService.checkIfVideoFrameIsClean
    ).mock.calls.length
    expect(initialCallCount).toBe(1)

    // Make a change that's exactly 4% of pixels (400 pixels)
    // This should NOT trigger moderation (under 5% threshold)
    ctx.fillStyle = 'rgb(255, 255, 255)'
    ctx.fillRect(0, 0, 20, 20) // 400 pixels

    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(ModerationService.checkIfVideoFrameIsClean).toHaveBeenCalledTimes(1)

    // Make another 4% change (400 more pixels)
    // If baseline was incorrectly updated, this would be compared to the previous frame (4% change)
    // If baseline is correct, this is compared to the original (8% cumulative change)
    ctx.fillStyle = 'rgb(255, 255, 255)'
    ctx.fillRect(20, 0, 20, 20) // Another 400 pixels

    await new Promise((resolve) => setTimeout(resolve, 150))

    // With correct baseline: 8% cumulative change should trigger moderation (call count = 2)
    // With buggy baseline: 4% change from previous frame should NOT trigger (call count = 1)
    expect(ModerationService.checkIfVideoFrameIsClean).toHaveBeenCalledTimes(2)

    endScreenShareModeration()
  })
})
