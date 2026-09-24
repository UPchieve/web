import NTHSMembersView from '@/views/NTHS/Tabs/NTHSMembersView.vue'
import LoggerService from '@/services/LoggerService'
import {
  DEFAULT_ROSTER_SORT,
  formatHours,
  formatPeriodActivity,
  formatSessions,
  roleTagLabel,
  ROSTER_FILTERS,
  ROSTER_PERIOD_LABELS,
  ROSTER_PERIODS,
  ROSTER_SORT_KEYS,
  rosterPeriodStarts,
  sortRoster,
  type RosterPeriod,
} from '@/services/NTHSRosterService'
import {
  impact,
  member,
  NO_PERIOD_ACTIVITY,
  rosterResponse,
  topTutor,
} from '../../fixtures/nths'
import {
  enableAutoUnmount,
  flushPromises,
  mount,
  RouterLinkStub,
} from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import { ref } from 'vue'

vi.mock('@/store', () => ({ default: { dispatch: vi.fn() } }))

// The view reads its layout width through @vueuse/core's useElementSize,
// which needs a real ResizeObserver measuring a laid-out element. Mocking it
// with a settable ref lets a test choose table vs. cards layout directly.
const rosterAreaWidth = ref(1400)
vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>()
  return {
    ...actual,
    useElementSize: () => ({ width: rosterAreaWidth, height: ref(0) }),
  }
})

const getNTHSChapterRoster = vi.fn()
const getNTHSChapterImpact = vi.fn()
const updateNTHSGroupMember = vi.fn()
vi.mock('@/services/NetworkService', () => ({
  default: {
    getNTHSChapterRoster: (...args: unknown[]) => getNTHSChapterRoster(...args),
    getNTHSChapterImpact: (...args: unknown[]) => getNTHSChapterImpact(...args),
    updateNTHSGroupMember: (...args: unknown[]) =>
      updateNTHSGroupMember(...args),
  },
}))

const showNthsUserManagementModal = vi.fn()
vi.mock('@/services/ModalService', () => ({
  default: {
    showNthsUserManagementModal: (props: unknown) =>
      showNthsUserManagementModal(props),
  },
}))

const downloadRosterCsv = vi.fn()
vi.mock('@/services/NTHSRosterService', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/services/NTHSRosterService')>()
  return {
    ...actual,
    downloadRosterCsv: (...args: unknown[]) => downloadRosterCsv(...args),
  }
})

const NOW = new Date('2026-10-15T00:00:00.000Z')

const IMPACT = impact()
const TOP_TUTOR = topTutor()

const MEMBERS = [
  member({ userId: 'president', firstName: 'Pat', roleName: 'admin' }),
  member({ userId: 'taylor', firstName: 'Taylor', trainingComplete: false }),
  member({ userId: 'sam', firstName: 'Sam', safetyApproved: false }),
  member({
    userId: 'jordan',
    firstName: 'Jordan',
    periodHours: NO_PERIOD_ACTIVITY,
    periodSessions: NO_PERIOD_ACTIVITY,
    lastActiveAt: undefined,
  }),
  member({
    userId: 'riley',
    firstName: 'Riley',
    periodHours: {
      ...NO_PERIOD_ACTIVITY,
      thisMonth: 2.5,
      thisSchoolYear: 2.5,
      allTime: 4,
    },
    periodSessions: {
      ...NO_PERIOD_ACTIVITY,
      thisMonth: 2,
      thisSchoolYear: 3,
      allTime: 4,
    },
    lastActiveAt: '2026-10-02T00:00:00.000Z',
  }),
]

function storeFor(
  roleName: 'admin' | 'member' = 'admin',
  viewerId = 'president'
) {
  return createStore({
    state: {
      nths: {
        NTHSGroups: [
          {
            groupInfo: { id: 'group-123', name: 'Test Chapter' },
            memberInfo: { roleName },
          },
        ],
        NTHSGroupMembers: {},
      },
      user: { user: { id: viewerId } },
    },
    getters: {
      'nths/hasAdminRole': () => roleName === 'admin',
    },
  })
}

enableAutoUnmount(afterEach)

async function getWrapper({
  widthPx = 1400,
  roleName = 'admin',
  viewerId = 'president',
}: {
  widthPx?: number
  roleName?: 'admin' | 'member'
  viewerId?: string
} = {}) {
  rosterAreaWidth.value = widthPx
  const wrapper = mount(NTHSMembersView, {
    global: {
      plugins: [storeFor(roleName, viewerId)],
      stubs: { RouterLink: RouterLinkStub },
    },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  localStorage.clear()
  vi.setSystemTime(NOW)
  getNTHSChapterRoster.mockReset()
  getNTHSChapterImpact.mockReset()
  updateNTHSGroupMember.mockReset()
  showNthsUserManagementModal.mockReset()
  getNTHSChapterRoster.mockResolvedValue(rosterResponse(MEMBERS))
  getNTHSChapterImpact.mockResolvedValue({ data: { impact: IMPACT } })
})

afterEach(() => vi.useRealTimers())

function rows(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('[data-testid^="roster-row-"]')
}

function rowIds(wrapper: ReturnType<typeof mount>) {
  return rows(wrapper).map((row) =>
    row.attributes('data-testid')!.replace('roster-row-', '')
  )
}

function expanded(wrapper: ReturnType<typeof mount>, userId: string) {
  return wrapper
    .find(`[data-testid="member-actions-${userId}"]`)
    .attributes('aria-expanded')
}

function rowCell(
  wrapper: ReturnType<typeof mount>,
  userId: string,
  testId: string
) {
  return wrapper
    .find(`[data-testid="roster-row-${userId}"]`)
    .find(`[data-testid="${testId}"]`)
    .text()
}

async function selectPeriod(
  wrapper: ReturnType<typeof mount>,
  period: RosterPeriod
) {
  await wrapper.find(`[data-testid="roster-period-${period}"]`).trigger('click')
}

function notTutoredChip(wrapper: ReturnType<typeof mount>) {
  return wrapper.find('[data-testid="roster-chip-not-tutored-in-period"]')
}

// Reads a chip's trailing "(n)" count without pinning its label wording.
function chipCount(wrapper: ReturnType<typeof mount>, filter: string) {
  const text = wrapper.find(`[data-testid="roster-chip-${filter}"]`).text()
  return Number(text.match(/\((\d+)\)$/)?.[1])
}

// The two /impact-derived numbers join the member count only once /impact has loaded.
function summaryText(wrapper: ReturnType<typeof mount>) {
  return wrapper.find('[data-testid="roster-summary"]').text()
}
function activeMemberCount(wrapper: ReturnType<typeof mount>) {
  return Number(summaryText(wrapper).match(/(\d+) active/)?.[1])
}
function tutoredThisYearCount(wrapper: ReturnType<typeof mount>) {
  return Number(summaryText(wrapper).match(/(\d+) tutored this year/)?.[1])
}
function hoursThisSchoolYear(wrapper: ReturnType<typeof mount>) {
  return Number(
    summaryText(wrapper).match(/([\d.]+) hours this school year/)?.[1]
  )
}

function header(wrapper: ReturnType<typeof mount>, key: string) {
  return wrapper
    .find(`[data-testid="roster-sort-${key}"]`)
    .element.closest('th')!
}

async function sortTable(wrapper: ReturnType<typeof mount>, key: string) {
  await wrapper.find(`[data-testid="roster-sort-${key}"]`).trigger('click')
}

describe('NTHSMembersView', () => {
  describe('loading and summary', () => {
    it.each([
      [
        'is still loading',
        () => {
          getNTHSChapterRoster.mockReturnValue(new Promise(() => {}))
          getNTHSChapterImpact.mockReturnValue(new Promise(() => {}))
        },
        (wrapper: Awaited<ReturnType<typeof getWrapper>>) => {
          expect(wrapper.find('[data-testid="roster-summary"]').exists()).toBe(
            false
          )
        },
      ],
      [
        'fails to load',
        () =>
          getNTHSChapterRoster.mockRejectedValue(new Error('network error')),
        (wrapper: Awaited<ReturnType<typeof getWrapper>>) => {
          expect(wrapper.find('[data-testid="roster-summary"]').exists()).toBe(
            false
          )
          expect(
            wrapper.find('[data-testid="roster-load-error"]').exists()
          ).toBe(true)
          expect(rows(wrapper)).toHaveLength(0)
          expect(wrapper.find('[data-testid="download-csv"]').exists()).toBe(
            false
          )
          expect(wrapper.find('[data-testid="member-activity"]').exists()).toBe(
            false
          )
          expect(wrapper.find('[data-testid="impact-error"]').exists()).toBe(
            false
          )
        },
      ],
    ])(
      'shows no summary while the roster %s',
      async (_label, setUp, assertions) => {
        setUp()
        const wrapper = await getWrapper()
        assertions(wrapper)
      }
    )

    it('reads the roster endpoint and shows every current member, the president included', async () => {
      const wrapper = await getWrapper()

      expect(getNTHSChapterRoster).toHaveBeenCalledWith(
        'group-123',
        expect.anything()
      )
      expect(rows(wrapper)).toHaveLength(5)
      expect(
        wrapper.find('[data-testid="roster-row-president"]').exists()
      ).toBe(true)
      expect(activeMemberCount(wrapper)).toBe(5)
      expect(tutoredThisYearCount(wrapper)).toBe(4)
      expect(hoursThisSchoolYear(wrapper)).toBe(7.5)
      expect(wrapper.find('[data-testid="top-tutor"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="roster-invite-nudge"]').exists()).toBe(
        false
      )
    })

    it('excludes closed accounts from the member count and keeps hours and tutored counts from /impact', async () => {
      getNTHSChapterRoster.mockResolvedValue(
        rosterResponse([
          ...MEMBERS,
          member({
            userId: 'departed',
            firstName: 'Departed',
            accountClosed: true,
            sessionsThisYear: 3,
            hoursThisYear: 5,
          }),
        ])
      )
      const wrapper = await getWrapper()

      expect(rows(wrapper)).toHaveLength(6)
      expect(activeMemberCount(wrapper)).toBe(5)
      expect(tutoredThisYearCount(wrapper)).toBe(4)
      expect(hoursThisSchoolYear(wrapper)).toBe(7.5)
    })

    it('shows the invite nudge above the table when the viewer is the only current member, keeping their row and the roster controls', async () => {
      getNTHSChapterRoster.mockResolvedValue(
        rosterResponse([
          MEMBERS[0],
          member({ userId: 'departed', accountClosed: true }),
        ])
      )
      const wrapper = await getWrapper()

      expect(wrapper.find('[data-testid="roster-invite-nudge"]').exists()).toBe(
        true
      )
      expect(
        wrapper.find('[data-testid="roster-row-president"]').exists()
      ).toBe(true)
      expect(wrapper.find('[data-testid="roster-chip-all"]').exists()).toBe(
        true
      )
      expect(wrapper.find('[data-testid="download-csv"]').exists()).toBe(true)
    })

    it.each([
      [39.96, '39.9 hours this school year'],
      [1, '1 hour this school year'],
    ])(
      'floors %s school-year hours the way Home does and words them to match',
      async (hoursTutored, expected) => {
        getNTHSChapterImpact.mockResolvedValue({
          data: {
            impact: impact({
              schoolYearToDate: { ...IMPACT.schoolYearToDate, hoursTutored },
            }),
          },
        })
        const wrapper = await getWrapper()

        expect(summaryText(wrapper)).toContain(expected)
      }
    )

    it.each([
      [
        'is still loading',
        () => getNTHSChapterImpact.mockReturnValue(new Promise(() => {})),
        false,
      ],
      [
        'fails',
        () =>
          getNTHSChapterImpact.mockRejectedValue(new Error('network error')),
        true,
      ],
    ])(
      'keeps the roster and activity card fully usable while /impact %s, showing the member count alone',
      async (_label, setUp, expectImpactError) => {
        setUp()
        getNTHSChapterRoster.mockResolvedValue(
          rosterResponse(MEMBERS, { topTutorThisMonth: TOP_TUTOR })
        )
        const wrapper = await getWrapper()

        expect(activeMemberCount(wrapper)).toBe(5)
        expect(tutoredThisYearCount(wrapper)).toBeNaN()
        expect(wrapper.find('[data-testid="member-activity"]').exists()).toBe(
          true
        )
        expect(wrapper.find('[data-testid="impact-error"]').exists()).toBe(
          expectImpactError
        )
      }
    )

    it('shows the top tutor card when the roster has a top tutor', async () => {
      getNTHSChapterRoster.mockResolvedValue(
        rosterResponse(MEMBERS, { topTutorThisMonth: TOP_TUTOR })
      )
      const wrapper = await getWrapper()

      expect(wrapper.find('[data-testid="top-tutor"]').exists()).toBe(true)
    })
  })

  describe('period and filters', () => {
    it('asks for the roster with the local calendar starts of each period, taken from the page load instant, and sends /impact the same month start so their top-tutor data cannot drift apart', async () => {
      await getWrapper()

      const [, starts] = getNTHSChapterRoster.mock.calls[0]
      expect(starts).toEqual(rosterPeriodStarts(NOW))
      const [, monthStartsAt] = getNTHSChapterImpact.mock.calls[0]
      expect(monthStartsAt).toEqual(starts.thisMonth)
    })

    it('counts members who tutored in the selected period, defaulting to this week', async () => {
      const wrapper = await getWrapper()
      const headline = () =>
        wrapper.find('[data-testid="member-activity-headline"]').text()

      expect(
        wrapper.find('[data-testid="roster-period-thisWeek"]').attributes()[
          'aria-pressed'
        ]
      ).toBe('true')
      const weekHeadline = headline()
      expect(weekHeadline.startsWith('3 of 5')).toBe(true)

      await selectPeriod(wrapper, 'thisMonth')
      const monthHeadline = headline()
      expect(monthHeadline.startsWith('4 of 5')).toBe(true)
      expect(
        wrapper.find('[data-testid="roster-period-thisWeek"]').attributes()[
          'aria-pressed'
        ]
      ).toBe('false')
    })

    it("shows each member's sessions and hours for the selected period in the table, under headers naming it", async () => {
      const wrapper = await getWrapper()
      const riley = MEMBERS.find((m) => m.userId === 'riley')!

      for (const period of ROSTER_PERIODS) {
        await selectPeriod(wrapper, period)
        expect(rowCell(wrapper, 'riley', 'roster-sessions')).toBe(
          formatSessions(riley.periodSessions[period])
        )
        expect(rowCell(wrapper, 'riley', 'roster-hours')).toBe(
          formatHours(riley.periodHours[period])
        )
        for (const key of ['sessions', 'hours']) {
          expect(
            wrapper.find(`[data-testid="roster-head-${key}"]`).text()
          ).toContain(ROSTER_PERIOD_LABELS[period])
        }
      }
    })

    it("shows each member's sessions and hours for the selected period on the cards", async () => {
      const wrapper = await getWrapper({ widthPx: 600 })
      const riley = MEMBERS.find((m) => m.userId === 'riley')!

      for (const period of ROSTER_PERIODS) {
        await selectPeriod(wrapper, period)
        expect(rowCell(wrapper, 'riley', 'roster-period-activity')).toBe(
          formatPeriodActivity(
            riley.periodSessions[period],
            riley.periodHours[period]
          )
        )
      }
    })

    it('switching period updates the not-tutored chip, and a selected filter survives the switch with its rows updated', async () => {
      const wrapper = await getWrapper()

      expect(notTutoredChip(wrapper).text()).toMatch(/\(2\)$/)

      await selectPeriod(wrapper, 'thisMonth')

      expect(notTutoredChip(wrapper).text()).toMatch(/\(1\)$/)

      await notTutoredChip(wrapper).trigger('click')
      expect(rowIds(wrapper)).toEqual(['jordan'])

      await selectPeriod(wrapper, 'thisWeek')
      expect(rowIds(wrapper)).toEqual(['jordan', 'riley'])
      expect(notTutoredChip(wrapper).attributes()['aria-pressed']).toBe('true')
    })

    it('labels each chip with a count that equals the rows shown after selecting it', async () => {
      const wrapper = await getWrapper()

      for (const filter of ROSTER_FILTERS) {
        const count = chipCount(wrapper, filter)
        await wrapper
          .find(`[data-testid="roster-chip-${filter}"]`)
          .trigger('click')
        expect(rows(wrapper)).toHaveLength(count)
      }
    })
  })

  describe('sorting', () => {
    it('lists members in the default sort and marks only that column sorted', async () => {
      const wrapper = await getWrapper()

      expect(rowIds(wrapper)).toEqual(
        sortRoster(MEMBERS, DEFAULT_ROSTER_SORT, 'thisWeek').map(
          (m) => m.userId
        )
      )
      for (const key of ROSTER_SORT_KEYS) {
        expect(header(wrapper, key).getAttribute('aria-sort')).toBe(
          key === DEFAULT_ROSTER_SORT.key ? 'ascending' : 'none'
        )
      }
    })

    it('sorts rows by the clicked column for the selected period', async () => {
      const wrapper = await getWrapper()
      await selectPeriod(wrapper, 'thisMonth')
      await sortTable(wrapper, 'hours')
      expect(rowIds(wrapper)).toEqual([
        'riley',
        'president',
        'sam',
        'taylor',
        'jordan',
      ])
      expect(header(wrapper, 'hours').getAttribute('aria-sort')).toBe(
        'descending'
      )
    })

    it('keeps the sort across filter and period changes', async () => {
      const wrapper = await getWrapper()
      await sortTable(wrapper, 'status')
      await sortTable(wrapper, 'status')
      await selectPeriod(wrapper, 'thisMonth')
      await wrapper
        .find('[data-testid="roster-chip-not-tutored-in-period"]')
        .trigger('click')
      await wrapper.find('[data-testid="roster-chip-all"]').trigger('click')
      expect(rowIds(wrapper)).toEqual([
        'jordan',
        'president',
        'riley',
        'sam',
        'taylor',
      ])
      expect(header(wrapper, 'status').getAttribute('aria-sort')).toBe(
        'descending'
      )
    })

    it('sorts the cards from the Sort by control with the same rules', async () => {
      const wrapper = await getWrapper({ widthPx: 600 })
      await wrapper
        .find('[data-testid="roster-sort-key"]')
        .setValue('lastActive')
      expect(rowIds(wrapper)).toEqual([
        'president',
        'sam',
        'taylor',
        'riley',
        'jordan',
      ])
    })

    it('restores the chosen period and sort after unmounting and remounting', async () => {
      const wrapper = await getWrapper()
      await selectPeriod(wrapper, 'thisMonth')
      await sortTable(wrapper, 'hours')
      wrapper.unmount()

      const remounted = await getWrapper()
      expect(
        remounted.find('[data-testid="roster-period-thisMonth"]').attributes()[
          'aria-pressed'
        ]
      ).toBe('true')
      expect(header(remounted, 'hours').getAttribute('aria-sort')).toBe(
        'descending'
      )
    })
  })

  describe('CSV export', () => {
    beforeEach(() => downloadRosterCsv.mockReset())

    it('downloads the filtered, sorted rows for the active period, with its start and the school year', async () => {
      const wrapper = await getWrapper()

      await notTutoredChip(wrapper).trigger('click')
      await selectPeriod(wrapper, 'thisMonth')
      await sortTable(wrapper, 'name')
      await wrapper.find('[data-testid="download-csv"]').trigger('click')

      expect(downloadRosterCsv).toHaveBeenCalledTimes(1)
      const [rows, options] = downloadRosterCsv.mock.calls[0]
      expect(rows.map((m: { userId: string }) => m.userId)).toEqual(['jordan'])
      expect(options).toEqual({
        period: 'thisMonth',
        periodStarts: rosterPeriodStarts(NOW),
        schoolYearLabel: rosterResponse([]).data.roster.schoolYear.label,
      })
    })

    it('hides the download button when the filter matches nobody', async () => {
      getNTHSChapterRoster.mockResolvedValue(rosterResponse([MEMBERS[0]]))
      const wrapper = await getWrapper()

      await wrapper
        .find('[data-testid="roster-chip-training-incomplete"]')
        .trigger('click')
      expect(wrapper.find('[data-testid="roster-empty"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="download-csv"]').exists()).toBe(false)
    })
  })

  describe('row actions', () => {
    it('changes a role through the row menu, patches the row immediately, and refreshes roster and impact in the background', async () => {
      updateNTHSGroupMember.mockResolvedValue(undefined)
      const wrapper = await getWrapper()
      const sam = MEMBERS.find((m) => m.userId === 'sam')!

      // The refresh never resolves, so the row can only change from the patch.
      getNTHSChapterRoster.mockReturnValueOnce(new Promise(() => {}))

      await wrapper.find('[data-testid="member-actions-sam"]').trigger('click')
      await wrapper
        .find('[data-testid="member-make-admin-sam"]')
        .trigger('click')
      await flushPromises()

      expect(updateNTHSGroupMember).toHaveBeenCalledWith('group-123', 'sam', {
        role: 'admin',
      })
      expect(wrapper.find('[data-testid="roster-row-sam"]').text()).toContain(
        roleTagLabel({ ...sam, roleName: 'admin' })
      )
      expect(chipCount(wrapper, 'all')).toBe(5)

      expect(getNTHSChapterRoster).toHaveBeenCalledTimes(2)
      expect(getNTHSChapterImpact).toHaveBeenCalledTimes(2)
      expect(wrapper.find('[data-testid="roster-load-error"]').exists()).toBe(
        false
      )
    })

    it('drops the row immediately and refreshes roster and impact in the background once the remove modal reports the member gone', async () => {
      const wrapper = await getWrapper()

      getNTHSChapterRoster.mockReturnValueOnce(new Promise(() => {}))

      await wrapper.find('[data-testid="member-actions-sam"]').trigger('click')
      await wrapper.find('[data-testid="member-remove-sam"]').trigger('click')

      const props = showNthsUserManagementModal.mock.calls[0][0]
      expect(props.memberToRemove.nthsGroupId).toBe('group-123')
      props.onRemoved()
      await flushPromises()

      expect(rows(wrapper)).toHaveLength(4)
      expect(chipCount(wrapper, 'all')).toBe(4)
      expect(getNTHSChapterRoster).toHaveBeenCalledTimes(2)
      expect(getNTHSChapterImpact).toHaveBeenCalledTimes(2)
    })

    it('shows a friendly role-change error in an alert and logs the raw error once', async () => {
      const raw = new Error('Database update error: null value in column')
      updateNTHSGroupMember.mockRejectedValue(raw)
      const noticeError = vi
        .spyOn(LoggerService, 'noticeError')
        .mockImplementation(() => {})
      const wrapper = await getWrapper()

      await wrapper.find('[data-testid="member-actions-sam"]').trigger('click')
      await wrapper
        .find('[data-testid="member-make-admin-sam"]')
        .trigger('click')
      await flushPromises()

      const error = wrapper.find('[data-testid="roster-error"]')
      expect(error.attributes('role')).toBe('alert')
      expect(error.text()).not.toContain(raw.message)
      expect(noticeError).toHaveBeenCalledTimes(1)
      expect(noticeError.mock.calls[0][0]).toBe(raw)
      noticeError.mockRestore()
    })

    it('keeps each pending role change busy until its own request settles', async () => {
      const pending: Record<string, () => void> = {}
      updateNTHSGroupMember.mockImplementation(
        (_groupId: string, userId: string) =>
          new Promise<void>((resolve) => {
            pending[userId] = resolve
          })
      )
      const wrapper = await getWrapper()
      const trigger = (userId: string) =>
        wrapper.find(`[data-testid="member-actions-${userId}"]`)

      await trigger('sam').trigger('click')
      await wrapper
        .find('[data-testid="member-make-admin-sam"]')
        .trigger('click')
      await trigger('taylor').trigger('click')
      await wrapper
        .find('[data-testid="member-make-admin-taylor"]')
        .trigger('click')

      expect(trigger('sam').attributes('aria-disabled')).toBe('true')
      expect(trigger('taylor').attributes('aria-disabled')).toBe('true')

      pending.sam()
      await flushPromises()
      expect(trigger('sam').attributes('aria-disabled')).toBe('false')
      expect(trigger('taylor').attributes('aria-disabled')).toBe('true')
    })

    it('opens the second row menu instead of closing both when its trigger is clicked while another is open', async () => {
      const wrapper = await getWrapper()

      await wrapper.find('[data-testid="member-actions-sam"]').trigger('click')
      expect(expanded(wrapper, 'sam')).toBe('true')

      await wrapper
        .find('[data-testid="member-actions-taylor"]')
        .trigger('click')

      expect(expanded(wrapper, 'taylor')).toBe('true')
      expect(expanded(wrapper, 'sam')).toBe('false')
    })
  })

  describe('permissions', () => {
    it('gives the president no actions on their own row', async () => {
      const wrapper = await getWrapper()
      expect(
        wrapper.find('[data-testid="member-actions-president"]').exists()
      ).toBe(false)
      expect(wrapper.find('[data-testid="member-actions-sam"]').exists()).toBe(
        true
      )
    })

    it.each([
      ['table', { widthPx: 1400, layout: 'roster-table' as const }],
      ['cards', { widthPx: 600, layout: 'roster-cards' as const }],
    ])(
      'shows the roster rows but no row-menu triggers, head-actions column, or CSV button in the %s layout',
      async (_label, { layout, ...options }) => {
        const wrapper = await getWrapper({
          ...options,
          roleName: 'member',
          viewerId: 'jordan',
        })

        expect(rows(wrapper)).toHaveLength(MEMBERS.length)
        expect(wrapper.find(`[data-testid="${layout}"]`).exists()).toBe(true)
        expect(
          wrapper.find('[data-testid="roster-head-actions"]').exists()
        ).toBe(false)
        expect(
          wrapper.findAll('[data-testid^="member-actions-"]')
        ).toHaveLength(0)
        expect(wrapper.find('[data-testid="download-csv"]').exists()).toBe(
          false
        )
      }
    )
  })
})
