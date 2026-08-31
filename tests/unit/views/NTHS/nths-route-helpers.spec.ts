import { describe, it, expect, vi, beforeEach } from 'vitest'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import {
  resolveNthsRoute,
  loadNTHSData,
  nthsDestination,
  redirectBlockedApplicant,
} from '@/views/NTHS/nths-route-helpers'
import LoggerService from '@/services/LoggerService'

vi.mock('@/services/LoggerService', () => ({
  default: { noticeError: vi.fn() },
}))

vi.mock('@/services/AnalyticsService')

type StoreShape = {
  groups?: unknown[]
  status?: string
  applicationPageOn?: boolean
  canApply?: boolean
  reasons?: string[]
}

// Only the fields nthsDestination reads, so a change to any of them is visible
// here.
function fakeStore({
  groups = [],
  status,
  applicationPageOn = true,
  canApply = true,
  reasons = [],
}: StoreShape) {
  return {
    state: {
      nths: {
        NTHSGroups: groups,
        NTHSCandidateApplicationStatus: status,
        canApplyForNTHSPresident: canApply,
        NTHSApplicationIneligibilityReasons: reasons,
      },
    },
    getters: { 'featureFlags/isNTHSApplicationPageEnabled': applicationPageOn },
    dispatch: vi.fn().mockResolvedValue([]),
  } as never
}

describe('nthsDestination', () => {
  it('sends a chapter member to their chapter', () => {
    expect(
      nthsDestination(fakeStore({ groups: [{ groupId: 123 }], canApply: true }))
    ).toBe('group')
  })

  // Membership outranks everything, otherwise a president who created a chapter
  // would keep being offered the create page.
  it('keeps a chapter member there even with an approved application', () => {
    expect(
      nthsDestination(
        fakeStore({ groups: [{ groupId: 123 }], status: 'approved' })
      )
    ).toBe('group')
  })

  it('sends an approved applicant to create a chapter', () => {
    expect(nthsDestination(fakeStore({ status: 'approved' }))).toBe('create')
  })

  // POST /nths-groups/new allows an approved application regardless of the
  // flag, so hiding the create page behind it would strand a president who was
  // already told they were approved.
  it('sends an approved applicant to create even with the page flagged off', () => {
    expect(
      nthsDestination(
        fakeStore({ status: 'approved', applicationPageOn: false })
      )
    ).toBe('create')
  })

  it('sends someone under review to the pending page', () => {
    expect(nthsDestination(fakeStore({ status: 'applied' }))).toBe('pending')
  })

  // Eligibility is the server's call and the frontend does not re-derive it from
  // the application status. Any previous application blocks today, and staff
  // reopen the door by hand, so a status the store still holds cannot be allowed
  // to override the answer.
  it('takes the server answer as final rather than reading the status', () => {
    expect(nthsDestination(fakeStore({ status: 'denied' }))).toBe('apply')
  })

  it('sends a first-time eligible coach to apply', () => {
    expect(nthsDestination(fakeStore({ status: undefined }))).toBe('apply')
  })

  // fetchNthsData writes the status and the eligibility in two separate
  // requests, so the store can briefly hold a fresh 'applied' and a stale
  // eligible. Status wins, or the sidebar would offer apply and pending at once.
  it('prefers the application status over a stale eligibility', () => {
    expect(
      nthsDestination(fakeStore({ status: 'applied', canApply: true }))
    ).toBe('pending')
    expect(
      nthsDestination(fakeStore({ status: 'approved', canApply: true }))
    ).toBe('create')
  })

  it('has no destination for a coach the server says is ineligible', () => {
    expect(
      nthsDestination(fakeStore({ status: undefined, canApply: false }))
    ).toBeUndefined()
  })

  // The flag reads false whenever PostHog has not answered, so gating pending
  // would drop an applicant's only link to their application status.
  it('sends someone under review to the pending page with the page flagged off', () => {
    expect(
      nthsDestination(
        fakeStore({ status: 'applied', applicationPageOn: false })
      )
    ).toBe('pending')
  })

  it.each(['denied', undefined])(
    'has no destination while the application page is flagged off (%s)',
    (status) => {
      expect(
        nthsDestination(fakeStore({ status, applicationPageOn: false }))
      ).toBeUndefined()
    }
  )
})

describe('loadNTHSData', () => {
  it('fetches when the store holds no chapter', async () => {
    const store = fakeStore({ groups: [] })
    await loadNTHSData(store)
    expect((store as any).dispatch).toHaveBeenCalledWith('nths/fetchNthsData')
  })

  // Membership is the top destination, so there is nothing a refetch could
  // change about the answer.
  it('skips the fetch once a chapter is in the store', async () => {
    const store = fakeStore({ groups: [{ groupId: 123 }] })
    await loadNTHSData(store)
    expect((store as any).dispatch).not.toHaveBeenCalled()
  })

  // Rejecting here would reject the route guard and cancel the navigation, so
  // a sick eligibility endpoint would make every NTHS route unreachable.
  it('reports a failed fetch instead of rejecting the guard', async () => {
    const store = fakeStore({ groups: [] })
    const boom = new Error('network down')
    ;(store as any).dispatch = vi.fn().mockRejectedValue(boom)

    await expect(loadNTHSData(store)).resolves.toBe(false)
    expect(LoggerService.noticeError).toHaveBeenCalledWith(
      boom,
      'Could not load NTHS data for routing'
    )
  })
})

describe('redirectBlockedApplicant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports the server reasons and the route that was refused', () => {
    const redirect = redirectBlockedApplicant(
      fakeStore({ canApply: false, reasons: ['notApproved'] }),
      '/groups/apply'
    )

    expect(AnalyticsService.captureEvent).toHaveBeenCalledWith(
      EVENTS.NTHS_APPLICATION_BLOCKED,
      { reasons: ['notApproved'], attemptedRoute: '/groups/apply' }
    )
    expect(redirect).toBe('/dashboard')
  })
})

describe('resolveNthsRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // The destination each route claims, mirrored from router.ts. A route wired to
  // the wrong one would redirect people away from the page they belong on, and
  // nothing else in the suite would notice.
  const ROUTES = [
    ['/groups/apply', 'apply'],
    ['/groups/apply/form', 'apply'],
    ['/groups/application-pending', 'pending'],
    ['/groups/create', 'create'],
    ['/groups', 'group'],
  ] as const

  const STORE_FOR = {
    apply: { status: undefined },
    pending: { status: 'applied' },
    create: { status: 'approved' },
    group: { groups: [{ groupId: 123 }] },
  } as const

  it.each(ROUTES)(
    'lets %s through for someone who belongs there',
    async (path, destination) => {
      await expect(
        resolveNthsRoute(fakeStore(STORE_FOR[destination]), destination, path)
      ).resolves.toBeUndefined()
    }
  )

  it.each(ROUTES)(
    'redirects %s to where the coach does belong',
    async (path, destination) => {
      const elsewhere = destination === 'apply' ? 'pending' : 'apply'
      await expect(
        resolveNthsRoute(fakeStore(STORE_FOR[elsewhere]), destination, path)
      ).resolves.toBe(
        elsewhere === 'apply' ? '/groups/apply' : '/groups/application-pending'
      )
    }
  )

  it('lets the pending route through with the application page flagged off', async () => {
    await expect(
      resolveNthsRoute(
        fakeStore({ status: 'applied', applicationPageOn: false }),
        'pending',
        '/groups/application-pending'
      )
    ).resolves.toBeUndefined()
  })

  it('sends a coach with no NTHS destination to the dashboard', async () => {
    await expect(
      resolveNthsRoute(
        fakeStore({ canApply: false, reasons: ['notApproved'] }),
        'apply',
        '/groups/apply'
      )
    ).resolves.toBe('/dashboard')
    expect(AnalyticsService.captureEvent).toHaveBeenCalledWith(
      EVENTS.NTHS_APPLICATION_BLOCKED,
      { reasons: ['notApproved'], attemptedRoute: '/groups/apply' }
    )
  })

  // A failed load leaves the store at its defaults, which read exactly like an
  // ineligible coach. Capturing that would put outage traffic in the funnel.
  it('does not report a failed load as a business-rule block', async () => {
    const store = fakeStore({ canApply: false, reasons: [] })
    ;(store as any).dispatch = vi.fn().mockRejectedValue(new Error('down'))

    await expect(
      resolveNthsRoute(store, 'apply', '/groups/apply')
    ).resolves.toBe('/dashboard')
    expect(AnalyticsService.captureEvent).not.toHaveBeenCalledWith(
      EVENTS.NTHS_APPLICATION_BLOCKED,
      expect.anything()
    )
  })

  it('loads before deciding, so a cold store does not send everyone away', async () => {
    const store = fakeStore({ canApply: false })
    ;(store as any).dispatch = vi.fn().mockImplementation(async () => {
      ;(store as any).state.nths.canApplyForNTHSPresident = true
      return []
    })
    await expect(
      resolveNthsRoute(store, 'apply', '/groups/apply')
    ).resolves.toBeUndefined()
  })
})
