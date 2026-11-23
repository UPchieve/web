import type { NTHSRosterMemberPublic } from '@/services/NTHSGroupService'
import { memberDisplayName } from '@/services/NTHSRosterService'
import { minutesToHoursAndMinutes } from '@/utils/time-utils'

const TOP_BOARD_SIZE = 3

export type TopMemberRow = {
  userId: string
  name: string
  hours: string
  place?: number
  line?: string
}

export type TopMembersBoard = {
  rows: TopMemberRow[]
  viewerRow?: TopMemberRow
}

export function formatMinutes(totalMinutes: number): string {
  return minutesToHoursAndMinutes(
    totalMinutes,
    ({ hours, minutes }) => `${hours}h ${minutes}m`
  ) as string
}

export function formatHoursMinutes(hours: number): string {
  return formatMinutes(Math.round(hours * 60))
}

export function findOpenViewer(
  members: NTHSRosterMemberPublic[],
  currentUserId: string
): NTHSRosterMemberPublic | undefined {
  return members.find(
    (member) => member.userId === currentUserId && !member.accountClosed
  )
}

export function contributionBar(
  ownHours: number,
  chapterHours: number,
  goalHours: number
) {
  const restHours = Math.max(0, chapterHours - ownHours)
  const scale = Math.max(ownHours + restHours, goalHours)
  return {
    ownWidth: (ownHours / scale) * 100,
    restWidth: (restHours / scale) * 100,
    restHours,
  }
}

export function rankMembers(
  members: NTHSRosterMemberPublic[]
): NTHSRosterMemberPublic[] {
  return members
    .filter(
      (member) => !member.accountClosed && member.periodHours.thisSchoolYear > 0
    )
    .sort(
      (a, b) =>
        b.periodHours.thisSchoolYear - a.periodHours.thisSchoolYear ||
        b.periodSessions.thisSchoolYear - a.periodSessions.thisSchoolYear ||
        (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0)
    )
}

// Server hours are rounded to 0.01h, so the extra minute absorbs up to 0.6 minutes of rounding.
export function minutesToOvertake(
  targetHours: number,
  viewerHours: number
): string {
  const gap = Math.round((targetHours - viewerHours) * 60 * 100) / 100
  // A session of one minute or less never counts toward a member's hours.
  const minutes = Math.max(Math.ceil(gap) + 1, 2)
  return minutes < 60 ? `${minutes}m` : formatMinutes(minutes)
}

export function topMembersBoard(
  members: NTHSRosterMemberPublic[],
  currentUserId: string
): TopMembersBoard {
  const ranked = rankMembers(members)
  const listed = ranked.slice(0, TOP_BOARD_SIZE)

  const rows = listed.map((member, index): TopMemberRow => {
    const isViewer = member.userId === currentUserId
    const name = memberDisplayName(member)
    return {
      userId: member.userId,
      name: isViewer ? `${name} (you)` : name,
      hours: formatHoursMinutes(member.periodHours.thisSchoolYear),
      place: index + 1,
      line:
        isViewer && index > 0
          ? `Log ${minutesToOvertake(listed[index - 1].periodHours.thisSchoolYear, member.periodHours.thisSchoolYear)} more to reach #${index}.`
          : undefined,
    }
  })

  const viewer = findOpenViewer(members, currentUserId)
  if (
    !viewer ||
    !listed.length ||
    rows.some((r) => r.userId === currentUserId)
  ) {
    return { rows }
  }

  const viewerHours = viewer.periodHours.thisSchoolYear
  const place = ranked.findIndex((member) => member.userId === viewer.userId)
  return {
    rows,
    viewerRow: {
      userId: viewer.userId,
      name: `${memberDisplayName(viewer)} (you)`,
      hours: formatHoursMinutes(viewerHours),
      place: place === -1 ? undefined : place + 1,
      line:
        listed.length === TOP_BOARD_SIZE
          ? `Log ${minutesToOvertake(listed[TOP_BOARD_SIZE - 1].periodHours.thisSchoolYear, viewerHours)} more to reach the top 3.`
          : 'Log a session to join the top 3.',
    },
  }
}
