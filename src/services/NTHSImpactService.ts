import type { NTHSChapterImpactPublic } from '@/services/NTHSGroupService'

export type Standing = 'pending' | 'official' | 'official-good-standing'

export const STANDING_LABELS: Record<Standing, string> = {
  pending: 'Pending',
  official: 'Official',
  'official-good-standing': 'Official in Good Standing',
}

export const LOADING_IMPACT_PLACEHOLDER: NTHSChapterImpactPublic = {
  groupId: '',
  schoolYear: { label: '0000–00', startsAt: '', endsAt: '' },
  schoolYearToDate: {
    studentsHelped: 0,
    sessionsCompleted: 0,
    hoursTutored: 0,
    membersTutoring: 0,
  },
  allTime: { studentsHelped: 0, sessionsCompleted: 0, hoursTutored: 0 },
  goals: { hoursTutored: 0, membersTutoring: 0 },
  official: false,
}

export function standingFor(impact: NTHSChapterImpactPublic): Standing {
  if (!impact.official) return 'pending'
  return impact.schoolYearToDate.hoursTutored >= impact.goals.hoursTutored
    ? 'official-good-standing'
    : 'official'
}

// One decimal place turns a few minutes of tutoring into '0', which reads as
// none at all.
export const UNDER_ONE_TENTH_HOURS_LABEL = '<0.1'

export function isUnderOneTenth(hours: number): boolean {
  return hours > 0 && hours < 0.1
}

/** One decimal, with a trailing `.0` dropped: `12.5`, `1873`. */
export function formatDecimalHours(hours: number): string {
  return (Math.round(hours * 10) / 10).toFixed(1).replace(/\.0$/, '')
}

/** Round toward zero, so 39.96 of 40 reads '39.9' rather than a complete-looking '40'. */
export function formatProgressHours(hours: number): string {
  if (isUnderOneTenth(hours)) return UNDER_ONE_TENTH_HOURS_LABEL
  return formatDecimalHours(Math.floor(hours * 10) / 10)
}

/** Bar fill for a requirement meter, clamped so an exceeded goal stays full. */
export function meterPercent(value: number, goal: number): number {
  if (goal <= 0) return 100
  return Math.max(0, Math.min(100, (value / goal) * 100))
}
