import { countWords } from '@/utils/word-count'
import { describe, it, expect } from 'vitest'

describe('countWords', () => {
  it('counts words', () => {
    expect(countWords('')).toBe(0)
    expect(countWords(' . ??-!/')).toBe(0)
    expect(countWords('hello')).toBe(1)
    expect(countWords('hello world')).toBe(2)
    expect(countWords('hello, 123,456!')).toBe(2)
    expect(countWords("it's a me, mario!")).toBe(4)
    expect(
      countWords(`
      I'm a member of
      S.T.A.R.S
      `)
    ).toBe(5)
    expect(countWords('hi--how are you?')).toBe(4)
  })
})
