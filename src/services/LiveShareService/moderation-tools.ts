import { ref } from 'vue'
import ModerationService from '@/services/ModerationService'
import LoggerService from '@/services/LoggerService'
import store from '@/store'
import pixelmatch from 'pixelmatch'

// This is the size of the image that we want to send to subway for moderation
const TARGET_LARGEST_IMAGE_DIMENSION_IN_PIXELS = 3000

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
// 16 seems to be the standard size of cursors in OSX and Windows
const CURSOR_WIDTH_IN_PIXELS = 16 * window.devicePixelRatio
const CURSOR_HEIGHT_IN_PIXELS = 16 * window.devicePixelRatio
const MAX_PIXELS_DIFFERENCE = CURSOR_WIDTH_IN_PIXELS * CURSOR_HEIGHT_IN_PIXELS

const lastModeratedFrameBuffer = ref<null | Uint8ClampedArray>(null)
async function shouldModerateFrame(
  frame: ReturnType<typeof captureFrameFromCanvas>
): Promise<boolean> {
  const lastFrame = lastModeratedFrameBuffer.value
  lastModeratedFrameBuffer.value = frame.imageData.data

  if (lastFrame === null) {
    return true
  }

  const numDifferingPixels = pixelmatch(
    lastFrame,
    frame.imageData.data,
    null,
    frame.imageData.width,
    frame.imageData.height
  )

  return numDifferingPixels > MAX_PIXELS_DIFFERENCE
}

async function moderateFrame(
  frameToModerate: ReturnType<typeof captureFrameFromCanvas>
): Promise<void> {
  try {
    // Basic check to prevent tons of duplicate moderation requests
    if (await shouldModerateFrame(frameToModerate)) {
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

function getScaledDimensions(dimensions: { width: number; height: number }): {
  width: number
  height: number
} {
  const largerDimension =
    dimensions.width > dimensions.height ? 'width' : 'height'
  const scaleFactor =
    TARGET_LARGEST_IMAGE_DIMENSION_IN_PIXELS / dimensions[largerDimension]
  const width =
    scaleFactor > 1 ? dimensions.width : dimensions.width * scaleFactor
  const height =
    scaleFactor > 1 ? dimensions.height : dimensions.height * scaleFactor
  return { width, height }
}

function drawImage(
  canvas: HTMLCanvasElement,
  targetElement: HTMLVideoElement | HTMLCanvasElement
): ImageData {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2d context')
  const { width, height } = getScaledDimensions({
    width: canvas.width,
    height: canvas.height,
  })
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
  captureCanvas.width = targetElement.width
  captureCanvas.height = targetElement.height
  moderateFrame(
    processFrameForModeration({ canvas: captureCanvas, targetElement })
  )
  return setInterval(() => {
    if (targetElement && captureCanvas) {
      moderateFrame(
        processFrameForModeration({ canvas: captureCanvas, targetElement })
      )
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
    if (!store.getters['featureFlags/isVideoModerationEnabled']) return
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
