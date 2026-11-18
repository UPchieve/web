export type PersonSort = 'recent' | 'oldest' | 'alphabetical'

export const PERSON_SORT_OPTIONS: { value: PersonSort; label: string }[] = [
  { value: 'recent', label: 'Most recent session' },
  { value: 'oldest', label: 'Oldest session' },
  { value: 'alphabetical', label: 'Alphabetically' },
]

export const DEFAULT_PERSON_SORT: PersonSort = 'recent'

export interface Person {
  firstName: string
  lastSession: { date: string | Date } | null
}

export function parsePersonSortQuery(value: unknown): PersonSort {
  return PERSON_SORT_OPTIONS.some((option) => option.value === value)
    ? (value as PersonSort)
    : DEFAULT_PERSON_SORT
}

function sessionTime(person: Person) {
  return person.lastSession ? new Date(person.lastSession.date).getTime() : null
}

function sortBySession(a: Person, b: Person, oldestFirst: boolean) {
  const timeA = sessionTime(a)
  const timeB = sessionTime(b)
  if (timeA === null || timeB === null) {
    return Number(timeA === null) - Number(timeB === null)
  }
  return oldestFirst ? timeA - timeB : timeB - timeA
}

export function sortPeople(sort: PersonSort) {
  return (a: Person, b: Person) => {
    if (sort === 'alphabetical') {
      // People with the same name fall back to most recent session first
      return (
        a.firstName.localeCompare(b.firstName, undefined, {
          sensitivity: 'base',
        }) || sortBySession(a, b, false)
      )
    }
    return sortBySession(a, b, sort === 'oldest')
  }
}
