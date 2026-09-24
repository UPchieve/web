export function plural(count: number | string, word: string): string {
  return String(count) === '1' ? word : `${word}s`
}
