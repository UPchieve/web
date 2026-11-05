export type ShareInfoModalState = {
  isFeatureEnabled: boolean
  hasChosen: boolean
  wasClosedThisVisit: boolean
  productFlagsLoaded: boolean
  dismissedAt?: string | null
  numSessionsTutored?: number
}

// Wait until after the coach's first session, so new coaches aren't asked
// during signup and the preview shows real numbers. They can opt in earlier
// from their profile.
export function shouldShowShareInfoModal(state: ShareInfoModalState) {
  return (
    state.isFeatureEnabled &&
    !state.hasChosen &&
    !state.wasClosedThisVisit &&
    // A coach who dismissed it before shouldn't see it flash while flags load
    state.productFlagsLoaded &&
    !state.dismissedAt &&
    (state.numSessionsTutored ?? 0) >= 1
  )
}
