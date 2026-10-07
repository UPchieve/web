export function getQueryString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
