import { ref } from 'vue'
import ModerationService from '@/services/ModerationService'
import LoggerService from '@/services/LoggerService'
import store from '@/store'

// This is the size of the image that we want to send to subway for moderation
//
const TARGET_LARGEST_IMAGE_DIMENSION_IN_PIXELS = 1000

function captureFrameFromCanvas(canvas: HTMLCanvasElement): {
  binary: Blob
  string: string
} {
  const frame = canvas.toDataURL('image/png').split(';base64,')[1]
  const binaryFrame = atob(frame)
  const bytes = new Uint8Array(binaryFrame.length)
  for (let i = 0; i < binaryFrame.length; i++) {
    bytes[i] = binaryFrame.charCodeAt(i)
  }
  return { binary: new Blob([bytes], { type: 'image/png' }), string: frame }
}
const MAX_RECENT_MODERATED_FRAMES = 5
const recentlyModeratedFrames = new Set<string>()
function addModeratedFrame(frame: string): Set<string> {
  if (recentlyModeratedFrames.size >= MAX_RECENT_MODERATED_FRAMES) {
    // Remove the oldest element (first added)
    const oldestFrame = [...recentlyModeratedFrames][0]
    recentlyModeratedFrames.delete(oldestFrame)
  }
  recentlyModeratedFrames.add(frame)
  return recentlyModeratedFrames
}

function frameHasBeenModerated(frame: string): boolean {
  const hasBeenModerated = recentlyModeratedFrames.has(frame)
  if (!hasBeenModerated) {
    addModeratedFrame(frame)
  }
  return hasBeenModerated
}

async function moderateFrame(
  frameToModerate: ReturnType<typeof captureFrameFromCanvas>
): Promise<void> {
  try {
    // Basic check to prevent tons of duplicate moderation requests
    if (!frameHasBeenModerated(frameToModerate.string)) {
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
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height } = getScaledDimensions({
    width: canvas.width,
    height: canvas.height,
  })
  ctx.drawImage(targetElement, 0, 0, width, height)
}

function processFrameForModeration({
  canvas,
  targetElement,
}: {
  canvas: HTMLCanvasElement
  targetElement: HTMLVideoElement | HTMLCanvasElement
}): ReturnType<typeof captureFrameFromCanvas> {
  drawImage(canvas, targetElement)
  return captureFrameFromCanvas(canvas)
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
