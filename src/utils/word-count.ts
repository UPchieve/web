/*
 * This pattern matches “words” as sequences of letters/digits/emojis,
 * potentially separated by certain punctuation. It should count "co-op" or "isn't" as a single
 * word, but "1,2" and "1.2" as each having two separate words.
 * This matches Google Docs word count implementation.
 *
 * [\p{L}\p{N}\p{Emoji}]+    // 1. One or more Unicode letters/digits or emoji.
 *  (?:                      // 2. Start of a non-capturing group for optional sub-parts:
 *    [-']                   //    a) A dash or apostrophe..
 *    [\p{L}\p{N}\p{Emoji}]+ //    b) ..followed by one or more letters/digits or emoji.
 *  )*                       // 3. Zero or more such sub-parts.
 * /gu;                      // 4. 'g' for global matches, 'u' for full Unicode support.
 */
const WORDS = /[\p{L}\p{N}\p{Emoji}]+(?:[-'’][\p{L}\p{N}\p{Emoji}]+)*/gu

export function countWords(text: string): number {
  return text.match(WORDS)?.length ?? 0
}
