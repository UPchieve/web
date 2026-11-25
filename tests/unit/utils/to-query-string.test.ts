import { describe, it, expect } from 'vitest'
import { toQueryString } from '@/utils/to-query-string'

describe('toQueryString', () => {
  it.each([
    ['numbers', { page: 2, minMessagesSent: 0 }, 'page=2&minMessagesSent=0'],
    [
      'booleans',
      { showTestUsers: true, showBannedUsers: false },
      'showTestUsers=true&showBannedUsers=false',
    ],
    ['undefined', { page: 1, school: undefined }, 'page=1&school=undefined'],
    ['null', { page: 1, school: null }, 'page=1&school=null'],
    ['empty strings', { firstName: '', lastName: '' }, 'firstName=&lastName='],
    [
      'characters that need encoding',
      { email: 'a+b@example.com', name: 'Ann & Bo/Cy=?' },
      'email=a%2Bb%40example.com&name=Ann+%26+Bo%2FCy%3D%3F',
    ],
  ])('encodes %s', (_label, params, expected) => {
    expect(toQueryString(params)).toBe(expected)
  })
})
