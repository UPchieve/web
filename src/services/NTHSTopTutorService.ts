import type { NTHSTopTutorPublic } from '@/services/NTHSGroupService'
import { hoursLabel } from '@/services/NTHSRosterService'
import { plural } from '@/utils/plural'

export function topTutorDetail(topTutor: NTHSTopTutorPublic): string {
  const { sessionsCompleted } = topTutor
  const hours = hoursLabel(topTutor.hoursTutored)
  return `${hours} ${plural(hours, 'hour')} · ${sessionsCompleted} ${plural(sessionsCompleted, 'session')} this month`
}

export function viewerHoursLine(hours: number): string {
  if (hours <= 0) return 'You: no hours yet this month'
  const label = hoursLabel(hours)
  return `You: ${label} ${plural(label, 'hour')} this month`
}
