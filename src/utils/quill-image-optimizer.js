import { file2b64 } from '@/utils/fileToBase64'

export const MAX_FILE_SIZE_KB = 750
export const MAX_TOTAL_IMAGES = 5

export const maxImagesEventName = 'max-images-limit'
export const fileSizeTooBigEventName = 'file-size-limit'
export const volunteerAttemptedToAddImage = 'volunteer-attempted-to-add-image'

const isSafari =
  /constructor/i.test(window.HTMLElement) ||
  ((p) => p.toString() === '[object SafariRemoteNotification]')(
    !window['safari'] ||
      (typeof safari !== 'undefined' && window['safari'].pushNotification)
  )

const maxImagesEvent = new Event(maxImagesEventName)
const fileSizeEvent = new Event(fileSizeTooBigEventName)
const volunteerAttemptedToAddImageEvent = new Event(
  volunteerAttemptedToAddImage
)

const getImagesFromDragEvent = (evt) => {
  return Array.from(evt?.dataTransfer?.files ?? []).filter((f) =>
    matchedFileType(f.type)
  )
}

const getImagesFromPasteEvent = (evt) => {
  return Array.from(evt?.clipboardData?.items ?? []).filter((f) =>
    matchedFileType(f.type)
  )
}

const matchedFileType = (fileType) => {
  return fileType.match(/^image\/(gif|jpe?g|a?png|svg|webp|bmp)/i)
}

const isValidImageCount = (quill) => {
  const currentCount =
    (quill && quill.root && quill.root.querySelectorAll('img').length) || 0
  return currentCount < MAX_TOTAL_IMAGES
}

const calcFileSizeKiloBytes = (dataUrl) => {
  const fileSizeBytes = Math.round((dataUrl.length * 3) / 4)
  return Math.ceil(fileSizeBytes / 1024)
}

const getDimensions = (inputWidth, inputHeight, maxWidth, maxHeight) => {
  if (
    maxWidth &&
    maxHeight &&
    inputWidth <= maxWidth &&
    inputHeight <= maxHeight
  ) {
    return [inputWidth, inputHeight]
  }
  if (maxWidth && inputWidth > maxWidth) {
    const newHeight = Math.floor((inputHeight / inputWidth) * maxWidth)

    if (maxHeight && newHeight > maxHeight) {
      const newWidth = Math.floor((inputWidth / inputHeight) * maxHeight)
      return [newWidth, maxHeight]
    } else {
      return [maxWidth, newHeight]
    }
  }
  if (maxHeight && inputHeight > maxHeight) {
    const newWidth = Math.floor((inputWidth / inputHeight) * maxHeight)
    return [newWidth, maxHeight]
  }
  return [inputHeight, inputWidth]
}

const getBlobFromDragEvent = async (evt) => {
  const draggedUrl = evt.dataTransfer?.getData('URL')
  if (draggedUrl) {
    return await (await fetch(draggedUrl)).blob()
  }
}

const downscaleImage = async (
  dataUrl,
  maxWidth,
  maxHeight,
  imageType,
  keepImageTypes,
  ignoreImageTypes,
  imageQuality
) => {
  const inputImageType = dataUrl.split('')[0].split(':')[1]
  imageType = imageType || 'image/jpeg'
  imageQuality = imageQuality || 0.7

  const image = new Image()
  image.src = dataUrl
  await new Promise((resolve) => {
    image.onload = () => {
      resolve()
    }
  })
  const [newWidth, newHeight] = getDimensions(
    image.width,
    image.height,
    maxWidth,
    maxHeight
  )

  const canvas = document.createElement('canvas')
  canvas.width = newWidth
  canvas.height = newHeight

  const ctx = canvas.getContext('2d')

  if (imageType === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, image.width, image.height)
  }

  if (ignoreImageTypes?.includes(inputImageType)) {
    return dataUrl
  }

  if (keepImageTypes?.includes(inputImageType)) {
    imageType = inputImageType
  }

  ctx.drawImage(image, 0, 0, newWidth, newHeight)
  const newDataUrl = canvas.toDataURL(imageType, imageQuality)
  return newDataUrl
}

class ImageDrop {
  constructor(quill, onNewDataUrl, isVolunteer) {
    this.quill = quill
    this.onNewDataUrl = onNewDataUrl
    this.isVolunteer = isVolunteer
    this.quill.root.addEventListener(
      'drop',
      (e) => this.handleImageUpload(e, isVolunteer, () => this.handleDrop(e)),
      false
    )
    this.quill.root.addEventListener(
      'paste',
      (e) => this.handleImageUpload(e, isVolunteer, () => this.handlePaste(e)),
      false
    )
  }

  async handleImageUpload(evt, isVolunteer, callback) {
    // Prevent volunteers from uploading images
    const isImageUpload =
      (evt.type === 'drop' && getImagesFromDragEvent(evt).length) ||
      (evt.type === 'paste' && getImagesFromPasteEvent(evt).length)
    if (isVolunteer && isImageUpload) {
      this.quill.root.dispatchEvent(volunteerAttemptedToAddImageEvent)
      evt.preventDefault()
    } else {
      await callback()
    }
  }

  async handleDrop(evt) {
    if (!isValidImageCount(this.quill)) {
      this.quill.root.dispatchEvent(maxImagesEvent)
      return
    }
    evt.preventDefault()
    if (document.caretRangeFromPoint) {
      const selection = document.getSelection()
      const range = document.caretRangeFromPoint(evt.clientX, evt.clientY)
      if (selection && range) {
        selection.setBaseAndExtent(
          range.startContainer,
          range.startOffset,
          range.startContainer,
          range.startOffset
        )
      }
    }
    const firstImage = getImagesFromDragEvent(evt)[0]
    if (firstImage) {
      const base64ImageSrc = await file2b64(firstImage)
      this.onNewDataUrl(base64ImageSrc)
      return
    }
    const blob = await getBlobFromDragEvent(evt)
    if (blob) {
      const base64ImageSrc = await file2b64(blob)
      this.onNewDataUrl(base64ImageSrc)
      return
    }
  }

  async handlePaste(evt) {
    if (!isValidImageCount(this.quill)) {
      this.quill.root.dispatchEvent(maxImagesEvent)
      return
    }

    const images = getImagesFromPasteEvent(evt)

    const imagesNoHtml = images.filter((f) => f.type !== 'text/html')
    if (!imagesNoHtml.length) {
      return
    }
    evt.preventDefault()
    const blob = images.pop()?.getAsFile()
    if (!blob) {
      return
    }
    const base64ImageSrc = await file2b64(blob)
    this.onNewDataUrl(base64ImageSrc)
  }
}

export class ImageCompressor {
  constructor(quill, options) {
    this.quill = quill
    this.options = options || {}
    if (isSafari && this.options.imageType === 'image/webp') {
      this.options.imageType = 'image/jpeg'
    }
    this.maxImages = options.maxImages ?? MAX_TOTAL_IMAGES

    const onImageDrop = async (dataUrl) => {
      if (!dataUrl) {
        return
      }
      const dataUrlCompressed = await this.downscaleImageFromUrl(dataUrl)
      this.insertToEditor(dataUrlCompressed)
    }
    this.imageDrop = new ImageDrop(quill, onImageDrop, this.options.isVolunteer)
    const toolbar = this.quill.getModule('toolbar')
    if (toolbar) {
      toolbar.addHandler('image', () => this.selectLocalImage())
    }
  }

  selectLocalImage(onFileChanged) {
    this.range = this.quill.getSelection()
    this.fileHolder = document.createElement('input')
    this.fileHolder.setAttribute('type', 'file')
    this.fileHolder.setAttribute('accept', 'image/*')
    this.fileHolder.setAttribute('style', 'visibility:hidden')

    this.fileHolder.onchange = () =>
      this.fileChanged().then(() => onFileChanged && onFileChanged())

    document.body.appendChild(this.fileHolder)

    this.fileHolder.click()

    window.requestAnimationFrame(() => {
      this.fileHolder && document.body.removeChild(this.fileHolder)
    })
  }

  async fileChanged(externallyProvidedFiles) {
    if (!isValidImageCount(this.quill)) {
      this.quill.root.dispatchEvent(maxImagesEvent)
      return
    }
    const files = externallyProvidedFiles || this.fileHolder?.files
    if (!files || !files.length || !files[0]) {
      return
    }

    const base64ImageSrc = await file2b64(files[0])
    const base64ImageSmallSrc = await this.downscaleImageFromUrl(base64ImageSrc)
    this.insertToEditor(base64ImageSmallSrc)
  }

  async downscaleImageFromUrl(dataUrl) {
    const dataUrlCompressed = await downscaleImage(
      dataUrl,
      this.options.maxWidth,
      this.options.maxHeight,
      this.options.imageType,
      this.options.keepImageTypes,
      this.options.ignoreImageTypes,
      this.options.quality
    )
    return dataUrlCompressed
  }

  insertToEditor(url) {
    this.range = this.quill.getSelection()
    const range = this.range
    if (!range) {
      return
    }

    const fileSize = calcFileSizeKiloBytes(url)
    if (fileSize > MAX_FILE_SIZE_KB) {
      this.quill.root.dispatchEvent(fileSizeEvent)
      return
    }
    this.quill.insertEmbed(range.index, 'image', `${url}`, 'user')
    range.index++
    this.quill.setSelection(range, 'api')
  }
}
