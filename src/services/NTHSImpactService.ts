import type { NTHSChapterImpactPublic } from '@/services/NTHSGroupService'
import { plural } from '@/utils/plural'

export type Standing = 'requirements-met' | 'members-met' | 'in-progress'

export const STANDING_LABELS: Record<Standing, string> = {
  'requirements-met': 'Requirements met',
  'members-met': 'Members met',
  'in-progress': 'In progress',
}

// Derived from the same goal numbers Home shows beside it, so the label
// can never contradict them. This reports progress toward the chapter's
// official status, a separate server-side determination.
export function standingFor(impact: NTHSChapterImpactPublic): Standing {
  const { membersTutoring, hoursTutored } = impact.schoolYearToDate
  const membersMet = membersTutoring >= impact.goals.membersTutoring
  const hoursMet = hoursTutored >= impact.goals.hoursTutored
  if (membersMet && hoursMet) return 'requirements-met'
  if (membersMet) return 'members-met'
  return 'in-progress'
}

export function allTimeLine(impact: NTHSChapterImpactPublic): string {
  const { studentsHelped, hoursTutored } = impact.allTime
  const formattedHours = isUnderOneTenth(hoursTutored)
    ? UNDER_ONE_TENTH_HOURS_LABEL
    : formatDecimalHours(hoursTutored)
  return `All time: ${formattedHours} ${plural(formattedHours, 'hour')} · ${studentsHelped} ${plural(studentsHelped, 'student')} helped`
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

/**
 * Round toward zero while short of the goal, so 39.96 of 40 reads '39.9' rather
 * than a complete-looking '40'.
 */
export function formatProgressHours(hours: number, goal: number): string {
  if (hours >= goal) return formatDecimalHours(hours)
  if (isUnderOneTenth(hours)) return UNDER_ONE_TENTH_HOURS_LABEL
  return formatDecimalHours(Math.floor(hours * 10) / 10)
}

/** Bar fill for a requirement meter, clamped so an exceeded goal stays full. */
export function meterPercent(value: number, goal: number): number {
  if (goal <= 0) return 100
  return Math.max(0, Math.min(100, (value / goal) * 100))
}
