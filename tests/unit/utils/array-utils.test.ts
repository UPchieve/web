import { describe, it, expect } from 'vitest'
import { interleave } from '../../../src/utils/array-utils'

describe('Interleave', () => {
  it.each([
    [
      [1, 3, 5],
      [2, 4, 6],
      [1, 2, 3, 4, 5, 6],
    ],
    [
      [2, 4, 6],
      [1, 3, 5],
      [2, 1, 4, 3, 6, 5],
    ],
    [[1, 2, 3], [], [1, 2, 3]],
    [
      [1, 2, 3],
      [4, 5],
      [1, 4, 2, 5, 3],
    ],
    [
      [1, 2],
      [3, 4, 5],
      [1, 3, 2, 4, 5],
    ],
  ])('Interleaves the elements of the arrays', (arr1, arr2, expected) => {
    expect(interleave(arr1, arr2)).toEqual(expected)
  })
})
