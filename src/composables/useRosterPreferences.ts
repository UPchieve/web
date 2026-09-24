import { ref, watch } from 'vue'
import {
  DEFAULT_ROSTER_SORT,
  ROSTER_PERIODS,
  ROSTER_SORT_KEYS,
  type RosterPeriod,
  type RosterSort,
} from '@/services/NTHSRosterService'

const DEFAULT_ROSTER_PERIOD: RosterPeriod = 'thisWeek'

type RosterView = { period: RosterPeriod; sort: RosterSort }

const DEFAULT_VIEW: RosterView = {
  period: DEFAULT_ROSTER_PERIOD,
  sort: DEFAULT_ROSTER_SORT,
}

function storageKey(userId: string): string {
  return `${userId}-nths-roster-view`
}

function isSortDirection(value: unknown): value is RosterSort['direction'] {
  return value === 'asc' || value === 'desc'
}

// A malformed period and a malformed sort are independent mistakes, so one
// falls back to its default without taking the other down with it.
function readView(userId: string): RosterView {
  let stored: {
    period?: unknown
    sort?: { key?: unknown; direction?: unknown }
  } | null
  try {
    stored = JSON.parse(localStorage.getItem(storageKey(userId)) ?? 'null')
  } catch {
    return DEFAULT_VIEW
  }

  const period =
    ROSTER_PERIODS.find((p) => p === stored?.period) ?? DEFAULT_VIEW.period

  const key = ROSTER_SORT_KEYS.find((k) => k === stored?.sort?.key)
  const direction = stored?.sort?.direction
  const sort: RosterSort =
    key && isSortDirection(direction) ? { key, direction } : DEFAULT_VIEW.sort

  return { period, sort }
}

export function useRosterPreferences(userId: string) {
  const initial = readView(userId)
  const period = ref(initial.period)
  const sort = ref(initial.sort)
  watch([period, sort], ([newPeriod, newSort]) => {
    try {
      localStorage.setItem(
        storageKey(userId),
        JSON.stringify({ period: newPeriod, sort: newSort })
      )
    } catch {
      // Storage can be missing, full or blocked; the choice still applies for this visit.
    }
  })
  return { period, sort }
}
