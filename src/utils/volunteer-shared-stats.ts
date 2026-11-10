import type { VolunteerPublicProfileInfoShared } from '@/types/sessions'

export type SharedStatKey = Exclude<
  keyof VolunteerPublicProfileInfoShared,
  'occupation'
>

export type SharedStatLabels = Record<
  SharedStatKey,
  { singular: string; plural: string }
>

const SHARED_STAT_KEYS: readonly SharedStatKey[] = [
  'numSessionsTutored',
  'numStudentsHelped',
  'totalVolunteerHours',
]

export const LONG_STAT_LABELS: SharedStatLabels = {
  numSessionsTutored: { singular: 'session', plural: 'sessions' },
  numStudentsHelped: { singular: 'student helped', plural: 'students helped' },
  totalVolunteerHours: { singular: 'hour tutored', plural: 'hours tutored' },
}

export const SHORT_STAT_LABELS: SharedStatLabels = {
  numSessionsTutored: { singular: 'session', plural: 'sessions' },
  numStudentsHelped: { singular: 'student', plural: 'students' },
  totalVolunteerHours: { singular: 'hour', plural: 'hours' },
}

export type SharedStat = {
  key: SharedStatKey
  value: number
  label: string
}

export function getSharedStats(
  info: VolunteerPublicProfileInfoShared,
  labels: SharedStatLabels = LONG_STAT_LABELS
): SharedStat[] {
  return SHARED_STAT_KEYS.flatMap((key) => {
    const value = info[key]
    if (value == null) return []
    const { singular, plural } = labels[key]
    return [{ key, value, label: value === 1 ? singular : plural }]
  })
}

export function hasSharedInfo(
  info: VolunteerPublicProfileInfoShared | null | undefined
): boolean {
  if (!info) return false
  if (info.occupation?.length) return true
  return getSharedStats(info).length > 0
}
