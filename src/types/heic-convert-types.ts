declare module 'heic-convert/browser' {
  export type Format = 'JPEG' | 'PNG'
  export interface HeicConvertOptions {
    buffer: ArrayBuffer | Uint8Array
    format: Format
    quality?: number
  }
  const convert: (opts: HeicConvertOptions) => Promise<ArrayBuffer | Uint8Array>
  export default convert
}
