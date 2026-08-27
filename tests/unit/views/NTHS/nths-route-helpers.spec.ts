import { describe, it, expect, vi, beforeEach } from 'vitest'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import {
  redirectBlockedApplicant,
  shouldGoToApply,
  shouldGoToCreate,
  shouldGoToPending,
} from '@/views/NTHS/nths-route-helpers'

vi.mock('@/services/AnalyticsService')

type StoreShape = {
  status?: string
  applicationPageOn?: boolean
  canApply?: boolean
  reasons?: string[]
}

// Only the fields these helpers read, so a change to any of them is visible here.
function fakeStore({
  status,
  applicationPageOn = true,
  canApply = true,
  reasons = [],
}: StoreShape) {
  return {
    state: {
      nths: {
        NTHSCandidateApplicationStatus: status,
        canApplyForNTHSPresident: canApply,
        NTHSApplicationIneligibilityReasons: reasons,
      },
    },
    getters: { 'featureFlags/isNTHSApplicationPageEnabled': applicationPageOn },
  } as never
}

describe('shouldGoToCreate', () => {
  it('is true once the application is approved', () => {
    expect(shouldGoToCreate(fakeStore({ status: 'approved' }))).toBe(true)
  })

  it.each(['applied', 'denied', undefined])(
    'is false when the application is %s',
    (status) => {
      expect(shouldGoToCreate(fakeStore({ status }))).toBe(false)
    }
  )

  // POST /nths-groups/new requires an approved application, so routing anyone
  // else to the create page hands them a 403.
  it('ignores the approved-president feature flag', () => {
    const store = fakeStore({ status: undefined })
    ;(store as any).getters['featureFlags/userIsApprovedNTHSPresident'] = true

    expect(shouldGoToCreate(store)).toBe(false)
  })
})

describe('shouldGoToApply', () => {
  it('is true for someone who has never applied', () => {
    expect(shouldGoToApply(fakeStore({ status: undefined }))).toBe(true)
  })

  it.each(['applied', 'approved', 'denied'])(
    'is false once an application exists (%s)',
    (status) => {
      expect(shouldGoToApply(fakeStore({ status }))).toBe(false)
    }
  )

  it('is false while the application page is flagged off', () => {
    expect(
      shouldGoToApply(
        fakeStore({ status: undefined, applicationPageOn: false })
      )
    ).toBe(false)
  })

  // Without this the apply routes stay reachable by URL for anyone the server
  // would refuse, even though the sidebar link is hidden.
  it('is false when the server says the coach is not eligible', () => {
    expect(
      shouldGoToApply(fakeStore({ status: undefined, canApply: false }))
    ).toBe(false)
  })

  // The flag used to suppress the apply route. Left in place it would strand a
  // flagged user with no application: unable to apply and refused on create.
  it('does not let the approved-president flag suppress applying', () => {
    const store = fakeStore({ status: undefined })
    ;(store as any).getters['featureFlags/userIsApprovedNTHSPresident'] = true

    expect(shouldGoToApply(store)).toBe(true)
  })
})

describe('shouldGoToPending', () => {
  it('is true only while an application is under review', () => {
    expect(shouldGoToPending(fakeStore({ status: 'applied' }))).toBe(true)
    expect(shouldGoToPending(fakeStore({ status: 'approved' }))).toBe(false)
    expect(shouldGoToPending(fakeStore({ status: undefined }))).toBe(false)
  })
})

describe('redirectBlockedApplicant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports the server reasons and the route that was refused', () => {
    const next = vi.fn()

    redirectBlockedApplicant(
      fakeStore({ canApply: false, reasons: ['notApproved'] }),
      { path: '/groups/apply' } as never,
      next
    )

    expect(AnalyticsService.captureEvent).toHaveBeenCalledWith(
      EVENTS.NTHS_APPLICATION_BLOCKED,
      { reasons: ['notApproved'], attemptedRoute: '/groups/apply' }
    )
    expect(next).toHaveBeenCalledWith('/dashboard')
  })
})
