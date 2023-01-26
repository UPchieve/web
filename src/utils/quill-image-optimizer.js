
const MAX_FILE_SIZE_KB = 700

const getFilesFromDragEvent = async (evt) => evt?.dataTransfer?.files

const matchedFileType = (fileType) => {
  return !!fileType.match(
    /^image\/(gif|jpe?g|a?png|svg|webp|bmp)/i
  )
}

const calcFileSizeKiloBytes = (dataUrl) => {
  const head = 'data:image/pngbase64,'
  const fileSizeBytes = Math.round(((dataUrl.length - head.length) * 3) / 4)
  return (fileSizeBytes / 1024).toFixed(0)
}

const getDimensions = (
  inputWidth,
  inputHeight,
  maxWidth,
  maxHeight
) => {
  if (maxWidth && maxHeight && inputWidth <= maxWidth && inputHeight <= maxHeight) {
    return [inputWidth, inputHeight]
  }
  if (maxWidth && inputWidth > maxWidth) {
    const newWidth = maxWidth
    const newHeight = Math.floor((inputHeight / inputWidth) * newWidth)

    if (maxHeight && newHeight > maxHeight) {
      const newHeight = maxHeight
      const newWidth = Math.floor((inputWidth / inputHeight) * newHeight)
      return [newWidth, newHeight]
    } else {
      return [newWidth, newHeight]
    }
  }
  if (maxHeight && inputHeight > maxHeight) {
    const newHeight = maxHeight
    const newWidth = Math.floor((inputWidth / inputHeight) * newHeight)
    return [newWidth, newHeight]
  }
  return [inputHeight, inputWidth]
}

const getBlobFromDragEvent = async (evt) => {
  const draggedUrl = evt.dataTransfer?.getData('URL')
  if (draggedUrl) {
    const blob = await (await fetch(draggedUrl)).blob()
    return blob
  }
}

const downscaleImage = async (
  dataUrl,
  maxWidth,
  maxHeight,
  imageType,
  keepImageTypes,
  ignoreImageTypes,
  imageQuality,
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

const file2b64 = async (file) => {
  const fileReader = new FileReader()
  const promise = new Promise < string > ((resolve, reject) => {
    fileReader.addEventListener(
      'load',
      () => {
        const base64ImageSrc = fileReader.result?.toString()
        if (!base64ImageSrc) {
          reject('could not convert file to base64')
        } else {
          resolve(base64ImageSrc)
        }
      },
      false
    )
  })
  fileReader.readAsDataURL(file)
  return promise
}

const b64toBlob = (dataURI) => {
  const byteString = atob(dataURI.split(',')[1])
  const type = dataURI.slice(5).split('')[0]
  const ab = new ArrayBuffer(byteString.length)
  let ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; ++i) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: type })
}

class ImageDrop {
  constructor(quill, onNewDataUrl,
  ) {
    this.quill = quill
    onNewDataUrl = onNewDataUrl
    this.quill.root.addEventListener('drop', (e) => this.handleDrop(e), false)
    this.quill.root.addEventListener(
      'paste',
      (e) => this.handlePaste(e),
      false
    )
  }

  async handleDrop(evt) {
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
    const files = await getFilesFromDragEvent(evt)
    const filesFiltered = Array.from(files || []).filter(f => matchedFileType(f.type))
    const firstImage = filesFiltered?.[0]
    if (firstImage) {
      const base64ImageSrc = await file2b64(firstImage)
      this.onNewDataUrl(base64ImageSrc)
      return
    }
    const blob = await getBlobFromDragEvent(evt)
    if (!!blob) {
      const base64ImageSrc = await file2b64(blob)
      this.onNewDataUrl(base64ImageSrc)
      return
    }
  }

  async handlePaste(evt) {
    const files = Array.from(evt?.clipboardData?.items || [])
    const images = files.filter(f => matchedFileType(f.type))

    if (!images.length) {
      return
    }

    const imagesNoHtml = images.filter(f => f.type !== 'text/html')
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

    warnAboutOptions(options)
    const onImageDrop = async (dataUrl) => {
      const dataUrlCompressed = await this.downscaleImageFromUrl(dataUrl)
      this.insertToEditor(dataUrlCompressed, b64toBlob(dataUrlCompressed))
    }
    this.imageDrop = new ImageDrop(quill, onImageDrop)
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

    this.fileHolder.onchange = () => this.fileChanged().then(() => onFileChanged && onFileChanged())

    document.body.appendChild(this.fileHolder)

    this.fileHolder.click()

    window.requestAnimationFrame(() => {
      this.fileHolder && document.body.removeChild(this.fileHolder)
    })
  }

  async fileChanged(externallyProvidedFiles) {
    const files = externallyProvidedFiles || this.fileHolder?.files
    if (!files || !files.length) {
      return
    }
    const file = files[0]
    if (!file) {
      return
    }
    const base64ImageSrc = await file2b64(file)
    const base64ImageSmallSrc = await this.downscaleImageFromUrl(
      base64ImageSrc
    )
    this.insertToEditor(base64ImageSmallSrc, b64toBlob(base64ImageSmallSrc))
  }

  async downscaleImageFromUrl(dataUrl) {
    const dataUrlCompressed = await downscaleImage(
      dataUrl,
      this.options.maxWidth,
      this.options.maxHeight,
      this.options.imageType,
      this.options.keepImageTypes,
      this.options.ignoreImageTypes,
      this.options.quality,
    )
    return dataUrlCompressed
  }

  insertToEditor(url, blob) {
    if (this.options.insertIntoEditor) {
      this.options.insertIntoEditor(url, blob)
    } else {
      this.range = this.quill.getSelection()
      const range = this.range
      if (!range) {
        return
      }

      const fileSize = calcFileSizeKiloBytes(url)
      if (fileSize > MAX_FILE_SIZE_KB) {
        return
      }
      this.quill.insertEmbed(range.index, 'image', `${url}`, 'user')
      range.index++
      this.quill.setSelection(range, 'api')
    }
  }
}

