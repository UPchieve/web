import type { Store } from 'vuex'

export async function shouldGoToGroup(store: Store<any>) {
  return (
    store.state.nths.NTHSGroups.length > 0 ||
    (await store.dispatch('nths/fetchNTHSGroupsForUser')).length > 0
  )
}

export function shouldGoToCreate(store: Store<any>) {
  const isApprovedPresident =
    store.getters['featureFlags/userIsApprovedNTHSPresident']
  const candidateApplicationStatus =
    store.state.nths.NTHSCandidateApplicationStatus

  return isApprovedPresident || candidateApplicationStatus === 'approved'
}

export function shouldGoToApply(store: Store<any>) {
  const candidateApplicationStatus =
    store.state.nths.NTHSCandidateApplicationStatus
  const isApplicationPageFlagOn =
    store.getters['featureFlags/isNTHSApplicationPageEnabled']
  const isApprovedPresident =
    store.getters['featureFlags/userIsApprovedNTHSPresident']
  return (
    isApplicationPageFlagOn &&
    !isApprovedPresident &&
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
