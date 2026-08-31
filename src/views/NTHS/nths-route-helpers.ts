import type { Store } from 'vuex'
import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import { EVENTS } from '@/consts'

export type NTHSDestination = 'group' | 'create' | 'pending' | 'apply'

export const NTHS_DESTINATION_PATHS: Record<NTHSDestination, string> = {
  group: '/groups',
  create: '/groups/create',
  pending: '/groups/application-pending',
  apply: '/groups/apply',
}

// Lives here rather than in SidebarLinks so the Record keeps a new destination
// from reaching the sidebar without a label; that file is untyped, so a gap
// there renders as an empty link instead of failing the build.
export const NTHS_DESTINATION_LABELS: Record<NTHSDestination, string> = {
  group: 'NTHS',
  create: 'NTHS',
  pending: 'NTHS application',
  apply: 'Apply to NTHS',
}

// A rejection here would abort the navigation and leave every NTHS route
// unreachable, so a failed load falls through to whatever the store already has.
// Returns whether the store can be trusted to describe the coach.
export async function loadNTHSData(store: Store<any>): Promise<boolean> {
  if (store.state.nths.NTHSGroups.length > 0) return true
  try {
    await store.dispatch('nths/fetchNthsData')
    return true
  } catch (err) {
    LoggerService.noticeError(err, 'Could not load NTHS data for routing')
    return false
  }
}

export function nthsDestination(
  store: Store<any>
): NTHSDestination | undefined {
  const {
    NTHSGroups,
    NTHSCandidateApplicationStatus,
    canApplyForNTHSPresident,
  } = store.state.nths

  if (NTHSGroups.length > 0) return 'group'
  if (NTHSCandidateApplicationStatus === 'approved') return 'create'
  if (NTHSCandidateApplicationStatus === 'applied') return 'pending'

  if (!store.getters['featureFlags/isNTHSApplicationPageEnabled']) return
  if (canApplyForNTHSPresident) return 'apply'
}

// Every NTHS route asks the same question, so they all defer to nthsDestination.
// Returns the path to redirect to, or undefined when the coach belongs at
// destination and the navigation should proceed.
export async function resolveNthsRoute(
  store: Store<any>,
  destination: NTHSDestination,
  attemptedPath: string
): Promise<string | undefined> {
  const loaded = await loadNTHSData(store)
  const belongsAt = nthsDestination(store)
  // A failed load leaves the store empty, which looks the same as an ineligible
  // coach. Skip the analytics event here since it would record a network error
  // as an eligibility block.
  if (!belongsAt && !loaded) return '/dashboard'
  if (!belongsAt) return redirectBlockedApplicant(store, attemptedPath)
  if (belongsAt === destination) return
  return NTHS_DESTINATION_PATHS[belongsAt]
}

export function redirectBlockedApplicant(
  store: Store<any>,
  attemptedPath: string
): string {
  AnalyticsService.captureEvent(EVENTS.NTHS_APPLICATION_BLOCKED, {
    reasons: store.state.nths.NTHSApplicationIneligibilityReasons,
    attemptedRoute: attemptedPath,
  })
  return '/dashboard'
}
