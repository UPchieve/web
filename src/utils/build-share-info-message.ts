import type { ShareInfoFieldKey } from '@/consts'

export interface ShareableVolunteerData {
  occupations?: string[]
  numSessionsTutored?: number
  numStudentsTutored?: number
  totalHoursTutored?: number
}

export function volunteerDataFromUser(user: any): ShareableVolunteerData {
  return {
    occupations: user?.occupation ?? [],
    numSessionsTutored: user?.pastSessions?.length ?? 0,
    numStudentsTutored: user?.uniqueStudentsHelpedCount ?? 0,
    totalHoursTutored: user?.hoursTutored ?? 0,
  }
}

function pluralize(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

function joinAsSentence(clauses: string[]) {
  if (clauses.length <= 1) return clauses.join('')
  if (clauses.length === 2) return clauses.join(' and ')
  return `${clauses.slice(0, -1).join(', ')}, and ${clauses[clauses.length - 1]}`
}

const TUTORING_STAT_SLOTS: {
  key: ShareInfoFieldKey
  connector: string
  verb: string
  text: (data: ShareableVolunteerData) => string
}[] = [
  {
    key: 'studentsTutored',
    connector: '',
    verb: 'has tutored',
    text: (data) => pluralize(data.numStudentsTutored ?? 0, 'student'),
  },
  {
    key: 'sessionsTutored',
    connector: 'in',
    verb: 'has completed',
    text: (data) => pluralize(data.numSessionsTutored ?? 0, 'session'),
  },
  {
    key: 'hoursTutored',
    connector: 'over',
    verb: 'has volunteered',
    text: (data) => pluralize(data.totalHoursTutored ?? 0, 'hour'),
  },
]

function buildTutoringClause(
  fields: ShareInfoFieldKey[],
  data: ShareableVolunteerData
): string {
  const present = TUTORING_STAT_SLOTS.filter((slot) =>
    fields.includes(slot.key)
  )
  if (!present.length) return ''

  const textParts = present.map((slot, i) =>
    i === 0 ? slot.text(data) : `${slot.connector} ${slot.text(data)}`
  )

  return `${present[0].verb} ${textParts.join(' ')}`
}

export function buildShareInfoMessage(
  fields: ShareInfoFieldKey[],
  data: ShareableVolunteerData
): string {
  const occupations = (data.occupations ?? []).map((occupation) =>
    occupation.toLowerCase()
  )
  const occupationClause =
    fields.includes('occupation') && occupations.length
      ? `is ${joinAsSentence(occupations)}`
      : ''

  const tutoringClause = buildTutoringClause(fields, data)

  const clauses = [occupationClause, tutoringClause].filter(Boolean)
  if (!clauses.length) return ''

  return `Your tutor ${clauses.join(' and ')}.`
}
