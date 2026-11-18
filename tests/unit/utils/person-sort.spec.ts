import { describe, expect, it } from 'vitest'
import {
  sortPeople,
  parsePersonSortQuery,
  type Person,
} from '@/utils/person-sort'

function person(firstName: string, date: string | null): Person {
  return { firstName, lastSession: date ? { date } : null }
}

const kenji = person('Kenji', '2026-11-08T15:00:00')
const noSession = person('Ada', null)
const fatima = person('Fatima', '2026-11-10T15:00:00')
const nalini = person('nalini', '2026-11-05T15:00:00')
const people = [kenji, noSession, fatima, nalini]

function names(sorted: Person[]) {
  return sorted.map((p) => p.firstName)
}

describe('sortPeople', () => {
  it('sorts by most recent session, with no-session people last', () => {
    expect(names([...people].sort(sortPeople('recent')))).toEqual([
      'Fatima',
      'Kenji',
      'nalini',
      'Ada',
    ])
  })

  it('sorts by oldest session, still with no-session people last', () => {
    expect(names([...people].sort(sortPeople('oldest')))).toEqual([
      'nalini',
      'Kenji',
      'Fatima',
      'Ada',
    ])
  })

  it('sorts by first name, ignoring case', () => {
    expect(names([...people].sort(sortPeople('alphabetical')))).toEqual([
      'Ada',
      'Fatima',
      'Kenji',
      'nalini',
    ])
  })

  it('puts the most recent session first for people with the same name', () => {
    const older = person('Sam', '2026-11-01T15:00:00')
    const newer = person('sam', '2026-11-09T15:00:00')

    expect([older, newer].sort(sortPeople('alphabetical'))).toEqual([
      newer,
      older,
    ])
  })
})

describe('parsePersonSortQuery', () => {
  it('returns a known sort', () => {
    expect(parsePersonSortQuery('alphabetical')).toBe('alphabetical')
  })

  it('falls back to most recent for a missing or unknown sort', () => {
    expect(parsePersonSortQuery(undefined)).toBe('recent')
    expect(parsePersonSortQuery('bogus')).toBe('recent')
  })
})
