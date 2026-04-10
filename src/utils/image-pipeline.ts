import { clamp } from 'lodash-es'
import { formatBytes } from './bytes'

type MimeType = 'image/jpeg' | 'image/png'

// Maps to MIME types that can be moderated via our moderation service
type ModeratableMimeType = MimeType
const extensions: Record<ModeratableMimeType, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
}

function fileNameWithExt(name: string, extension: string) {
  // Replace the last extension (if any) or append one
  return name.replace(/(?:\.[^.]+)?$/i, extension)
}

function ensureQualityRange(number: number) {
  return clamp(number, 0, 1)
}

export function isAllowedImageMime(mime: string) {
  return /^image\/(gif|jpe?g|a?png|svg|webp|bmp|heic)$/i.test(mime)
}

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function scaleToFitBox(
  w: number,
  h: number,
  maxW?: number,
  maxH?: number
): { width: number; height: number } {
  let width = w
  let height = h

  if (maxW && width > maxW) {
    height = Math.floor((h / w) * maxW)
    width = maxW
  }
  if (maxH && height > maxH) {
    width = Math.floor((w / h) * maxH)
    height = maxH
  }
  return { width, height }
}

async function drawImageToFile(
  img: HTMLImageElement,
  {
    filename,
    mimeType,
    width = img.naturalWidth,
    height = img.naturalHeight,
    quality = 0.9,
  }: {
    filename: string
    mimeType: MimeType
    width?: number
    height?: number
    quality?: number
  }
): Promise<File> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!

  // Must fill background since JPEGs can't have transparency
  if (mimeType === 'image/jpeg') {
    context.fillStyle = '#fff'
    context.fillRect(0, 0, width, height)
  }
  context.drawImage(img, 0, 0, width, height)

  const blob = await canvasToBlob(canvas, mimeType, quality)
  const newName = fileNameWithExt(filename, extensions[mimeType])
  return new File([blob], newName, { type: mimeType })
}

export async function encodeImageFile(
  file: File,
  data: {
    maxWidth?: number
    maxHeight?: number
    targetMime?: MimeType
    quality?: number
  } = {}
): Promise<File> {
  const img = await loadImageFromFile(file)
  const { width, height } = scaleToFitBox(
    img.naturalWidth,
    img.naturalHeight,
    data.maxWidth,
    data.maxHeight
  )
  const mimeType = (data.targetMime ?? (file.type as MimeType)) as MimeType
  const quality = ensureQualityRange(data.quality ?? 0.8)

  // Keep original file if same size, same type, and no explicit quality change
  if (
    width === img.naturalWidth &&
    height === img.naturalHeight &&
    mimeType === file.type &&
    !data.quality
  )
    return file

  return drawImageToFile(img, {
    filename: file.name,
    mimeType,
    width,
    height,
    quality,
  })
}

async function convertHeicFile(
  file: File,
  targetMime: MimeType = 'image/jpeg',
  quality: number = 1
): Promise<File> {
  const input = new Uint8Array(await file.arrayBuffer())
  const { default: convert } = await import('heic-convert/browser')
  const output = await convert({
    buffer: input,
    format: targetMime === 'image/jpeg' ? 'JPEG' : 'PNG',
    quality,
  })
  const blob = new Blob([output], { type: targetMime })
  const newFileName = fileNameWithExt(file.name, extensions[targetMime])

  return new File([blob], newFileName, { type: targetMime })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: MimeType,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      type,
      // PNG ignores quality
      type === 'image/jpeg' ? quality : undefined
    )
  )
}

export function getImageTooLargeMessage(maxFileSize: number): string {
  return `The image is too large. Please upload an image less than ${formatBytes(maxFileSize)}.`
}

function isModeratableMime(mime: string): mime is ModeratableMimeType {
  return mime in extensions
}

/**
 *
 * Pipeline:
 *  - HEIC: convert to JPEG/PNG first so the browser can actually draw it to a canvas.
 *  - Non-HEIC: if we need resize or mime change or JPEG quality change, do a single canvas pass.
 *
 * Notes:
 *  - Image moderation only works on JPEG/PNG.
 *  - `quality` applies only to JPEG encodes; PNG ignores it.
 *  - If `convertTo` is not provided, JPEG/PNG are preserved. Everything else is converted to JPEG.
 *
 * @param file
 * @param data Options:
 *   - convertTo?: 'image/jpeg' | 'image/png'  // desired output mimetype
 *   - quality?: number                        // JPEG quality (0..1)
 *   - downscale?: { maxWidth?: number; maxHeight?: number } // optional resize box for maintaining aspect ratio
 *
 */
export async function processImage(
  file: File,
  data: {
    convertTo?: ModeratableMimeType
    quality?: number
    downscale?: {
      maxWidth?: number
      maxHeight?: number
    }
  } = {}
): Promise<File> {
  // Image moderation constraint: we can only moderate JPEG/PNG.
  // We must convert all images to one of the types before sending it to moderation
  const outputMime: MimeType =
    data.convertTo ?? (isModeratableMime(file.type) ? file.type : 'image/jpeg')
  const quality = ensureQualityRange(data.quality ?? 0.8)
  let out = file
  if (out.type === 'image/heic') out = await convertHeicFile(out)

  const isResize = !!data.downscale
  const isMimeTypeChange = out.type !== outputMime
  // Re-encode just to apply JPEG compression (PNG ignores quality)
  const isQualityOnlyChange =
    out.type === 'image/jpeg' && !!data.quality && quality < 1

  if (isResize || isMimeTypeChange || isQualityOnlyChange) {
    return encodeImageFile(out, {
      maxWidth: data.downscale?.maxWidth,
      maxHeight: data.downscale?.maxHeight,
      targetMime: outputMime,
      quality,
    })
  }

  return out
}
