import type { Store } from 'vuex'
import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import { EVENTS } from '@/consts'
import { dayjs } from '@/utils/time-utils'
import { useNthsStore } from '@/stores/nths'

export type NTHSDestination =
  | 'group'
  | 'create'
  | 'pending'
  | 'apply'
  | 'expired'

export const NTHS_DESTINATION_PATHS: Record<NTHSDestination, string> = {
  group: '/groups',
  create: '/groups/create',
  pending: '/groups/application-pending',
  apply: '/groups/apply',
  expired: '/groups/application-expired',
}

// Lives here rather than in SidebarLinks so the Record keeps a new destination
// from reaching the sidebar without a label; that file is untyped, so a gap
// there renders as an empty link instead of failing the build.
export const NTHS_DESTINATION_LABELS: Record<NTHSDestination, string> = {
  group: 'NTHS',
  create: 'NTHS',
  pending: 'NTHS application',
  apply: 'Apply to NTHS',
  expired: 'NTHS',
}

// A rejection here would abort the navigation and leave every NTHS route
// unreachable, so a failed load falls through to whatever the store already has.
// Returns whether the store can be trusted to describe the coach.
export async function loadNTHSData(): Promise<boolean> {
  const nths = useNthsStore()
  if (nths.NTHSGroups.length > 0) return true
  try {
    await nths.fetchNthsData()
    return true
  } catch (err) {
    LoggerService.noticeError(err, 'Could not load NTHS data for routing')
    return false
  }
}

export type NTHSDestinationSource = {
  getters: Record<string, any>
}

export function nthsDestination(
  store: NTHSDestinationSource
): NTHSDestination | undefined {
  const nths = useNthsStore()

  if (nths.NTHSGroups.length > 0) return 'group'
  if (nths.NTHSCandidateApplicationStatus === 'approved') {
    if (
      nths.approvalExpiresAt &&
      !dayjs(nths.approvalExpiresAt).isAfter(dayjs())
    )
      return 'expired'
    return 'create'
  }
  if (nths.NTHSCandidateApplicationStatus === 'applied') return 'pending'

  if (!store.getters['featureFlags/isNTHSApplicationPageEnabled']) return
  if (nths.canApplyForNTHSPresident) return 'apply'
}

// Every NTHS route asks the same question, so they all defer to nthsDestination.
// Returns the path to redirect to, or undefined when the coach belongs at
// destination and the navigation should proceed.
export async function resolveNthsRoute(
  store: Store<any>,
  destination: NTHSDestination,
  attemptedPath: string
): Promise<string | undefined> {
  const loaded = await loadNTHSData()
  const belongsAt = nthsDestination(store)
  // A failed load leaves the store empty, which looks the same as an ineligible
  // coach. Skip the analytics event here since it would record a network error
  // as an eligibility block.
  if (!belongsAt && !loaded) return '/dashboard'
  if (!belongsAt) return redirectBlockedApplicant(attemptedPath)
  if (belongsAt === destination) return
  return NTHS_DESTINATION_PATHS[belongsAt]
}

export function redirectBlockedApplicant(attemptedPath: string): string {
  AnalyticsService.captureEvent(EVENTS.NTHS_APPLICATION_BLOCKED, {
    reasons: useNthsStore().NTHSApplicationIneligibilityReasons,
    attemptedRoute: attemptedPath,
  })
  return '/dashboard'
}
