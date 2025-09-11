import type Quill from 'quill'

type Options = {
  processAndInsertImage: (file: File) => Promise<void>
  isAllowedImageMime: (mime: string) => boolean
}

export class ImageDropPaste {
  private readonly quill: Quill
  private readonly processAndInsertImage: (file: File) => Promise<void>
  private readonly isAllowedImageMime: (mime: string) => boolean

  constructor(quill: Quill, options: Options) {
    this.quill = quill
    this.processAndInsertImage = options.processAndInsertImage
    this.isAllowedImageMime = options.isAllowedImageMime

    this.quill.root.addEventListener(
      'drop',
      (event) => this.onEditorPasteOrDrop(event),
      true
    )
    this.quill.root.addEventListener(
      'paste',
      (event) => this.onEditorPasteOrDrop(event),
      true
    )
  }

  private async onEditorPasteOrDrop(
    event: DragEvent | ClipboardEvent
  ): Promise<void> {
    let file: File | null = null

    if (event.type === 'drop')
      file = await this.extractImageFileFromDrop(event as DragEvent)
    else if (event.type === 'paste')
      file = this.extractImageFileFromPaste(event as ClipboardEvent)

    // Not an image file, let Quill handle it normally
    if (!file) return

    // Stop Quill's default handlers so we can process the image ourselves
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()

    await this.processAndInsertImage(file)
    // Put the cursor after the image we just inserted
    const range = this.quill.getSelection(true) ?? {
      index: this.quill.getLength(),
      length: 0,
    }
    this.quill.setSelection(range.index + 1, 0, 'api')
  }

  private async extractImageFileFromDrop(
    event: DragEvent
  ): Promise<File | null> {
    const files = Array.from(event.dataTransfer?.files ?? [])
    const firstImg = files.find((file) => this.isAllowedImageMime(file.type))
    if (firstImg) return firstImg

    const url = event.dataTransfer?.getData('URL')
    if (url) {
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        if (!this.isAllowedImageMime(blob.type)) return null
        return new File([blob], 'dropped-image', { type: blob.type })
      } catch {
        return null
      }
    }

    return null
  }

  private extractImageFileFromPaste(event: ClipboardEvent): File | null {
    const items = Array.from(event.clipboardData?.items ?? [])
    const item = items.find(
      (item) => item.kind === 'file' && this.isAllowedImageMime(item.type)
    )
    return item?.getAsFile() ?? null
  }
}
