import type { Store } from 'vuex'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

export async function shouldGoToGroup(store: Store<any>) {
  return (
    store.state.nths.NTHSGroups.length > 0 ||
    (await store.dispatch('nths/fetchNthsData')).length > 0
  )
}

// An approved application is the only thing that unlocks chapter creation, and
// the server enforces that now. The user-is-approved-nths-president flag used to
// stand in for it, so honouring it here would offer a button the API refuses.
export function shouldGoToCreate(store: Store<any>) {
  const candidateApplicationStatus =
    store.state.nths.NTHSCandidateApplicationStatus

  return candidateApplicationStatus === 'approved'
}

// canApplyForNTHSPresident is the server's eligibility check, defaulted to
// false in the store.
export function shouldGoToApply(store: Store<any>) {
  const candidateApplicationStatus =
    store.state.nths.NTHSCandidateApplicationStatus
  const isApplicationPageFlagOn =
    store.getters['featureFlags/isNTHSApplicationPageEnabled']
  return (
    isApplicationPageFlagOn &&
    store.state.nths.canApplyForNTHSPresident &&
    !candidateApplicationStatus
  )
}

export function shouldGoToPending(store: Store<any>) {
  const isApplicationPageFlagOn =
    store.getters['featureFlags/isNTHSApplicationPageEnabled']
  const candidateApplicationStatus =
    store.state.nths.NTHSCandidateApplicationStatus

  return isApplicationPageFlagOn && candidateApplicationStatus === 'applied'
}

export function redirectBlockedApplicant(
  store: Store<any>,
  to: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  AnalyticsService.captureEvent(EVENTS.NTHS_APPLICATION_BLOCKED, {
    reasons: store.state.nths.NTHSApplicationIneligibilityReasons,
    attemptedRoute: to.path,
  })
  return next('/dashboard')
}
