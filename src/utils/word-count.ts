/*
 * This pattern matches “words” as sequences of letters/numbers
 * potentially separated by certain punctuation. It counts “U.S.A”,
 * “123,120”, “co-op”, etc. as single words.
 *
 * [\p{L}\p{N}]+    // 1. One or more Unicode letters/digits
 *  (?:             // 2. Start of a non-capturing group for optional sub-parts:
 *    [-'.,/]       //    a) A dash, apostrophe, period, comma, or slash
 *    [\p{L}\p{N}]+ //    b) Followed by one or more letters/digits
 *  )*              // 3. Zero or more such sub-parts
 * /gu;             // 4. 'g' for global matches, 'u' for full Unicode support
 */
const WORDS = /[\p{L}\p{N}]+(?:[-'.,/][\p{L}\p{N}]+)*/gu

export function countWords(text: string): number {
  return text.match(WORDS)?.length ?? 0
}
