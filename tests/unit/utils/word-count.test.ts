import { countWords } from '@/utils/word-count'
import { describe, it, expect } from 'vitest'

describe('countWords', () => {
  it('counts words', () => {
    expect(countWords('')).toBe(0)
    expect(countWords(' . ??-!/')).toBe(0)
    expect(countWords('hello')).toBe(1)
    expect(countWords('hello world')).toBe(2)
    expect(countWords('hello, 123,456!')).toBe(3)
    expect(countWords("it's a me, mario!")).toBe(4)
    expect(
      countWords(`
      I'm a member of
      STARS ⭐
      `)
    ).toBe(6)
    expect(countWords('hi--how are you?')).toBe(4)

    // U+2019 : RIGHT SINGLE QUOTATION MARK
    expect(countWords('isn’t')).toBe(1)

    // U+2014 : EM DASH
    expect(countWords('silent—exactly')).toBe(2)
  })
})
