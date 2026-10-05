export const kiloToBytes = (kilobytes: number) => kilobytes * 1000
export const mbToBytes = (megabytes: number) => megabytes * kiloToBytes(1000)
export const gigaToBytes = (gigabytes: number) => gigabytes * mbToBytes(1000)

export const BYTES_PER_KILOBYTE = 1024
export const BYTES_PER_MEGABYTE = BYTES_PER_KILOBYTE * 1024

export function formatBytes(bytes: number): string {
  if (bytes >= BYTES_PER_MEGABYTE)
    return `${Math.round(bytes / BYTES_PER_MEGABYTE)} MB`
  if (bytes >= BYTES_PER_KILOBYTE)
    return `${Math.round(bytes / BYTES_PER_KILOBYTE)} KB`
  return `${bytes} B`
}
