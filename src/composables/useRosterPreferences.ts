import { ref, watch } from 'vue'
import {
  DEFAULT_MEMBER_SORT,
  MEMBER_SORT_KEYS,
  type MemberSort,
} from '@/services/NTHSMembersTableService'
import {
  getNTHSRosterView,
  setNTHSRosterView,
} from '@/services/BrowserStorageService'
import { ROSTER_PERIODS, type RosterPeriod } from '@/services/NTHSRosterService'

const DEFAULT_ROSTER_PERIOD: RosterPeriod = 'thisWeek'

// Days picked on the calendar are not stored, so the next visit starts on the
// default period.
type RosterView = { period: RosterPeriod | undefined; sort: MemberSort }

const DEFAULT_VIEW: RosterView = {
  period: DEFAULT_ROSTER_PERIOD,
  sort: DEFAULT_MEMBER_SORT,
}

function isSortDirection(value: unknown): value is MemberSort['direction'] {
  return value === 'asc' || value === 'desc'
}

// A malformed period and a malformed sort are independent mistakes, so one
// falls back to its default without taking the other down with it.
function readView(userId: string): RosterView {
  const stored = getNTHSRosterView(userId) as
    | {
        period?: unknown
        sort?: { key?: unknown; direction?: unknown }
      }
    | null
    | undefined

  const period =
    ROSTER_PERIODS.find((p) => p === stored?.period) ?? DEFAULT_VIEW.period

  const key = MEMBER_SORT_KEYS.find((k) => k === stored?.sort?.key)
  const direction = stored?.sort?.direction
  const sort: MemberSort =
    key && isSortDirection(direction) ? { key, direction } : DEFAULT_VIEW.sort

  return { period, sort }
}

export function useRosterPreferences(userId: string) {
  const initial = readView(userId)
  const period = ref(initial.period)
  const sort = ref(initial.sort)
  watch([period, sort], ([newPeriod, newSort]) => {
    setNTHSRosterView(userId, { period: newPeriod, sort: newSort })
  })
  return { period, sort }
}
