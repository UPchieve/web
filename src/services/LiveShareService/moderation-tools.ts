import { ref } from 'vue'
import ModerationService from '@/services/ModerationService'
import LoggerService from '@/services/LoggerService'
import store from '@/store'
import pixelmatch from 'pixelmatch'

// This is the max file size we can send to rekognition for moderation
const MAX_BYTE_SIZE_FOR_FRAME = 5242880

function captureFrameFromCanvas(
  canvas: HTMLCanvasElement,
  imageData: ImageData
): {
  binary: Blob
  width: number
  height: number
  imageData: ImageData
} {
  const frame = canvas.toDataURL('image/jpeg', 1.0).split(';base64,')[1]
  const binaryFrame = atob(frame)
  const bytes = new Uint8Array(binaryFrame.length)
  for (let i = 0; i < binaryFrame.length; i++) {
    bytes[i] = binaryFrame.charCodeAt(i)
  }
  return {
    binary: new Blob([bytes], { type: 'image/jpeg' }),
    width: canvas.width,
    height: canvas.height,
    imageData,
  }
}

const PCT_DIFFERENCE_THRESHOLD = 0.05

const lastModeratedFrameBuffer = ref<null | Uint8ClampedArray>(null)
function shouldModerateFrame(
  frame: ReturnType<typeof captureFrameFromCanvas>
): boolean {
  const lastFrame = lastModeratedFrameBuffer.value

  if (lastFrame === null) {
    return true
  }

  const maxPixelsDifference =
    frame.imageData.height * frame.imageData.width * PCT_DIFFERENCE_THRESHOLD

  try {
    const numDifferingPixels = pixelmatch(
      lastFrame,
      frame.imageData.data,
      null,
      frame.imageData.width,
      frame.imageData.height
    )
    return numDifferingPixels > maxPixelsDifference
  } catch (err) {
    if (err instanceof Error && err.message !== 'Image sizes do not match.') {
      LoggerService.noticeError(
        err,
        'Error comparing previous frame and current frame'
      )
    }
    return true
  }
}

async function moderateFrame(
  frameToModerate: ReturnType<typeof captureFrameFromCanvas>
): Promise<void> {
  try {
    // Basic check to prevent tons of duplicate moderation requests
    if (shouldModerateFrame(frameToModerate)) {
      lastModeratedFrameBuffer.value = frameToModerate.imageData.data
      const formData = new FormData()
      formData.append('frame', frameToModerate.binary)
      formData.append('sessionId', store.state.user.session.id)
      // For now, subway will log when a frame is flagged. We won't do anything with the response.
      await ModerationService.checkIfVideoFrameIsClean(formData)
    }
  } catch (e) {
    LoggerService.noticeError(e, 'Error moderating screen share frame')
  }
}

function drawImage(
  canvas: HTMLCanvasElement,
  targetElement: HTMLVideoElement | HTMLCanvasElement
): ImageData {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2d context')
  const width = canvas.width
  const height = canvas.height
  ctx.drawImage(targetElement, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

function processFrameForModeration({
  canvas,
  targetElement,
}: {
  canvas: HTMLCanvasElement
  targetElement: HTMLVideoElement | HTMLCanvasElement
}): ReturnType<typeof captureFrameFromCanvas> {
  const imageData = drawImage(canvas, targetElement)
  return captureFrameFromCanvas(canvas, imageData)
}

function startModeration({
  targetElement,
  sampleInterval,
}: {
  targetElement: HTMLVideoElement | HTMLCanvasElement
  sampleInterval: number
}): ReturnType<typeof setInterval> {
  const captureCanvas = document.createElement('canvas')
  if (targetElement instanceof HTMLVideoElement) {
    captureCanvas.width = targetElement.videoWidth
    captureCanvas.height = targetElement.videoHeight
  } else {
    captureCanvas.width = targetElement.width
    captureCanvas.height = targetElement.height
  }

  const baseWidth = captureCanvas.width
  const baseHeight = captureCanvas.height

  function scaleDownFrame(frame: ReturnType<typeof captureFrameFromCanvas>) {
    // if the frame is too large, let's scale it down to 70% of the max byte size for frame and try again
    const targetSize = MAX_BYTE_SIZE_FOR_FRAME * 0.7
    const scaleFactor = Math.sqrt(targetSize / frame.binary.size)
    // AWS Rekognition has a minimum size of 80x80
    captureCanvas.width = Math.max(80, Math.floor(baseWidth * scaleFactor))
    captureCanvas.height = Math.max(80, Math.floor(baseHeight * scaleFactor))
    return processFrameForModeration({
      canvas: captureCanvas,
      targetElement,
    })
  }

  let frame = processFrameForModeration({
    canvas: captureCanvas,
    targetElement,
  })

  if (frame.binary.size >= MAX_BYTE_SIZE_FOR_FRAME) {
    frame = scaleDownFrame(frame)
  }

  moderateFrame(frame)

  return setInterval(() => {
    if (targetElement && captureCanvas) {
      let frame = processFrameForModeration({
        canvas: captureCanvas,
        targetElement,
      })

      if (frame.binary.size >= MAX_BYTE_SIZE_FOR_FRAME) {
        frame = scaleDownFrame(frame)
      }
      moderateFrame(frame)
    }
  }, sampleInterval)
}

export function moderateScreenShare(
  options: { sampleInterval: number } = {
    sampleInterval: store.getters['featureFlags/videoModerationSampleInterval'],
  }
) {
  const frameSampleIntervalRef = ref<NodeJS.Timeout | null>(null)

  async function beginScreenShareModeration(
    targetElement: HTMLCanvasElement | HTMLVideoElement | null
  ) {
    if (targetElement instanceof HTMLVideoElement) {
      // If the video is already loaded, start moderation immediately
      if (targetElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        frameSampleIntervalRef.value = startModeration({
          targetElement,
          sampleInterval: options.sampleInterval,
        })
      } else {
        // Wait for the video to load before starting moderation
        targetElement.addEventListener('loadeddata', () => {
          if (targetElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            frameSampleIntervalRef.value = startModeration({
              targetElement,
              sampleInterval: options.sampleInterval,
            })
          }
        })
      }
    } else if (targetElement instanceof HTMLCanvasElement) {
      frameSampleIntervalRef.value = startModeration({
        targetElement,
        sampleInterval: options.sampleInterval,
      })
    } else {
      // If the target element is not a video or canvas, we can't moderate
      throw new Error(
        `Can not start moderation: Target element is not a video or canvas: ${targetElement}`
      )
    }
  }

  function endScreenShareModeration() {
    if (frameSampleIntervalRef.value) {
      clearInterval(frameSampleIntervalRef.value)
      frameSampleIntervalRef.value = null
    }
  }

  return { beginScreenShareModeration, endScreenShareModeration }
}
