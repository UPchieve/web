import MembersTable from '@/components/NTHS/Members/MembersTable.vue'
import vuetify from '@/plugins/vuetify'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import { page } from '@vitest/browser/context'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { RosterRange } from '@/services/NTHSRosterService'
import { member, NO_PERIOD_ACTIVITY } from '../../../fixtures/nths'

const NOW = new Date('2026-10-15T12:00:00.000Z')

const ME = member({ userId: 'me', firstName: 'Zoe', roleName: 'admin' })
const OTHER = member({
  userId: 'other',
  firstName: 'Ben',
  lastActiveAt: '2026-10-12T12:00:00.000Z',
})

const ANA = member({
  userId: 'ana',
  firstName: 'Ana',
  trainingComplete: false,
  periodHours: { ...NO_PERIOD_ACTIVITY, thisSchoolYear: 1 },
})
const CAL = member({
  userId: 'cal',
  firstName: 'Cal',
  periodHours: { ...NO_PERIOD_ACTIVITY, thisSchoolYear: 5 },
})
const DEE = member({
  userId: 'dee',
  firstName: 'Dee',
  periodHours: { ...NO_PERIOD_ACTIVITY, thisSchoolYear: 3 },
})
const TEAM = [ME, OTHER, ANA, CAL, DEE]

enableAutoUnmount(afterEach)
afterEach(async () => {
  await page.viewport(414, 896)
})

function table(
  props: {
    members?: ReturnType<typeof member>[]
    isGroupAdmin?: boolean
    isLoading?: boolean
    loadFailed?: boolean
    schoolYearLabel?: string
    range?: RosterRange
    sort?: { key: 'name'; direction: 'asc' }
  } = {},
  slots: Record<string, string> = {}
) {
  return mount(MembersTable, {
    slots,
    props: {
      members: [ME, OTHER],
      currentUserId: 'me',
      isGroupAdmin: true,
      inviteCode: 'ABC123',
      referralCode: 'PERSON123',
      now: NOW,
      schoolYearLabel: '2026–27',
      ...props,
    },
    global: { plugins: [vuetify] },
    attachTo: 'body',
  })
}

const ROW = '[data-testid="members-table-row"]'
const EXPAND = '[data-testid="members-table-expand"]'
const PROMPT = '[data-testid="members-table-invite"]'
const SCROLL = '[data-testid="members-table-scroll"]'
const DOWNLOAD = '[data-testid="members-table-download"]'
const chip = (filter: string) => `[data-testid="members-table-chip-${filter}"]`
const sortButton = (key: string) => `[data-testid="members-table-sort-${key}"]`

function shownNames(wrapper: VueWrapper) {
  return wrapper
    .findAll('[data-testid="member-name"]')
    .map((name) => name.text().split(',')[0])
}

describe('MembersTable', () => {
  it('lists every member in name order', () => {
    const names = table().findAll('[data-testid="member-name"]')

    expect(names.map((name) => name.text())).toEqual([
      'Ben R., rank 2',
      'Zoe R. (you), rank 1',
    ])
  })

  it.each([
    { isGroupAdmin: true, adminColumns: true },
    { isGroupAdmin: false, adminColumns: false },
  ])(
    'shows status and marks when admin is $isGroupAdmin',
    ({ isGroupAdmin, adminColumns }) => {
      const wrapper = table({ isGroupAdmin })

      expect(wrapper.find('[data-testid="member-status"]').exists()).toBe(
        adminColumns
      )
      expect(wrapper.find('[data-testid="member-marks"]').exists()).toBe(
        adminColumns
      )
      expect(wrapper.find('[data-testid="member-days"]').exists()).toBe(
        !adminColumns
      )
      expect(wrapper.find(sortButton('days')).exists()).toBe(!adminColumns)
      expect(wrapper.find('[data-testid="member-subjects"]').exists()).toBe(
        adminColumns
      )
      expect(wrapper.find('[data-testid="member-students"]').exists()).toBe(
        !adminColumns
      )
    }
  )

  it('shows a member the students helped and a count of subjects', () => {
    const wrapper = table({
      isGroupAdmin: false,
      members: [
        member({
          userId: 'x',
          firstName: 'Xi',
          subjects: ['Algebra', 'Biology'],
          studentsHelpedThisYear: 4,
        }),
      ],
    })
    const row = wrapper.find(ROW)
    expect(row.find('[data-testid="member-students"]').text()).toBe('4')
    expect(row.find('[data-testid="member-subject-count"]').text()).toBe('2')
  })

  it.each([
    {
      trainingComplete: false,
      safetyApproved: true,
      thisWeek: 0,
      label: 'Needs training',
    },
    {
      trainingComplete: true,
      safetyApproved: false,
      thisWeek: 0,
      label: 'Needs approval',
    },
    {
      trainingComplete: true,
      safetyApproved: true,
      thisWeek: 1,
      label: 'Active this week',
    },
    {
      trainingComplete: true,
      safetyApproved: true,
      thisWeek: 0,
      label: 'No hours this week',
    },
  ])(
    'labels a member $label',
    ({ trainingComplete, safetyApproved, thisWeek, label }) => {
      const subject = member({
        userId: 'subject',
        trainingComplete,
        safetyApproved,
        periodHours: { ...NO_PERIOD_ACTIVITY, thisWeek },
      })
      const wrapper = table({ members: [subject] })

      expect(wrapper.find('[data-testid="member-status"]').text()).toBe(label)
    }
  )

  it('shows a member the whole days since each last session', () => {
    const wrapper = table({ isGroupAdmin: false })

    expect(wrapper.find('[data-testid="member-days"]').text()).toBe('3')
  })

  it.each([
    { isGroupAdmin: true, prompt: true },
    { isGroupAdmin: false, prompt: false },
  ])(
    'shows the invite prompt to a lone viewer when admin is $isGroupAdmin: $prompt',
    ({ isGroupAdmin, prompt }) => {
      const wrapper = table({ members: [ME], isGroupAdmin })

      expect(wrapper.find(PROMPT).exists()).toBe(prompt)
      expect(wrapper.find(ROW).exists()).toBe(!prompt)
      expect(wrapper.find(EXPAND).exists()).toBe(!prompt)
    }
  )

  it('shows the invite code in the prompt', () => {
    const link = table({ members: [ME] })
      .find(PROMPT)
      .text()

    expect(link).toContain('ABC123')
  })

  it('shows no invite prompt while the roster loads', () => {
    const wrapper = table({ members: [], isLoading: true })

    expect(wrapper.find(PROMPT).exists()).toBe(false)
  })

  it('shows the invite prompt to an admin with no members', () => {
    expect(table({ members: [] }).find(PROMPT).exists()).toBe(true)
  })

  it.each([
    { props: { isLoading: true }, error: false },
    { props: { loadFailed: true }, error: true },
  ])('shows no rows for $props', ({ props, error }) => {
    const wrapper = table(props)

    expect(wrapper.find(ROW).exists()).toBe(false)
    expect(wrapper.find('[data-testid="members-table-error"]').exists()).toBe(
      error
    )
  })

  it.each([
    {
      name: 'a ranked member who tutored today',
      hours: 2,
      shown: '2h 0m',
      active: NOW,
      rank: ', rank 1',
      days: '0',
    },
    {
      name: 'a member with no hours and no sessions',
      hours: 0,
      shown: '0h 0m',
      active: undefined,
      rank: ', not ranked yet',
      days: 'No sessions yet',
    },
  ])('shows $name', ({ hours, shown, active, rank, days }) => {
    const wrapper = table({
      members: [
        member({
          userId: 'u',
          periodHours: {
            ...NO_PERIOD_ACTIVITY,
            thisSchoolYear: hours,
            allTime: 9,
          },
          periodSessions: { ...NO_PERIOD_ACTIVITY, thisSchoolYear: 1 },
          lastActiveAt: active?.toISOString(),
        }),
      ],
      isGroupAdmin: false,
    })

    expect(wrapper.find('[data-testid="member-name"]').text()).toContain(rank)
    expect(wrapper.find('[data-testid="member-hours"]').text()).toBe(shown)
    expect(wrapper.find('[data-testid="member-days"]').text()).toContain(days)
  })

  it.each([
    {
      safetyApproved: true,
      trainingComplete: false,
      thisSchoolYear: 0,
      marks: ['Done', 'Not yet', 'Not yet'],
    },
    {
      safetyApproved: false,
      trainingComplete: true,
      thisSchoolYear: 1,
      marks: ['Not yet', 'Done', 'Done'],
    },
  ])(
    'marks Screen, Training and 1st from their own fields: $marks',
    ({ safetyApproved, trainingComplete, thisSchoolYear, marks }) => {
      const wrapper = table({
        members: [
          member({
            userId: 'u',
            safetyApproved,
            trainingComplete,
            periodSessions: {
              ...NO_PERIOD_ACTIVITY,
              allTime: 3,
              thisSchoolYear,
            },
          }),
        ],
      })

      expect(
        wrapper
          .findAll('[data-testid="member-marks"]')
          .map((mark) => mark.text())
      ).toEqual(marks)
    }
  )

  it('leaves Escape and Tab to a menu that has focus outside the card', async () => {
    const wrapper = table()
    await wrapper.find(EXPAND).trigger('click')
    const container = document.body.appendChild(document.createElement('div'))
    container.className = 'v-overlay-container'
    const inMenu = container.appendChild(document.createElement('button'))
    inMenu.focus()

    for (const key of ['Escape', 'Tab'])
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true })
      )
    await nextTick()

    expect(wrapper.find(EXPAND).attributes('aria-pressed')).toBe('true')
    expect(document.activeElement).toBe(inMenu)
    container.remove()
  })

  it('collapses on Escape and returns focus to the expand button', async () => {
    const wrapper = table()
    const expand = wrapper.find(EXPAND)
    await expand.trigger('click')
    expect(expand.attributes('aria-pressed')).toBe('true')
    ;(wrapper.find(SCROLL).element as HTMLElement).focus()

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    )
    await nextTick()
    await nextTick()

    expect(expand.attributes('aria-pressed')).toBe('false')
    expect(document.activeElement).toBe(expand.element)
  })

  it('collapses from the button and keeps focus on it', async () => {
    const wrapper = table()
    const expand = wrapper.find(EXPAND)

    await expand.trigger('click')
    await nextTick()
    expect(document.activeElement).toBe(expand.element)

    await expand.trigger('click')
    expect(expand.attributes('aria-pressed')).toBe('false')
    expect(document.activeElement).toBe(expand.element)
  })

  it.each([
    { width: 1024, from: 'lastHeading', shiftKey: false, wrapsTo: 'expand' },
    { width: 1024, from: 'expand', shiftKey: true, wrapsTo: 'lastHeading' },
    { width: 1024, from: 'expand', shiftKey: false, wrapsTo: undefined },
    { width: 1024, from: 'lastHeading', shiftKey: true, wrapsTo: undefined },
    { width: 414, from: 'region', shiftKey: false, wrapsTo: 'expand' },
    { width: 414, from: 'expand', shiftKey: true, wrapsTo: 'region' },
  ])(
    'wraps Tab at the visible ends of the expanded card ($width px, from $from, shift $shiftKey)',
    async ({ width, from, shiftKey, wrapsTo }) => {
      await page.viewport(width, 896)
      const wrapper = table()
      await wrapper.find(EXPAND).trigger('click')
      const elements: Record<string, HTMLElement> = {
        expand: wrapper.find(EXPAND).element as HTMLElement,
        region: wrapper.find(SCROLL).element as HTMLElement,
        lastHeading: wrapper.find(sortButton('subjects'))
          .element as HTMLElement,
      }
      elements[from].focus()
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      })

      document.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(wrapsTo !== undefined)
      expect(document.activeElement).toBe(elements[wrapsTo ?? from])
    }
  )

  it.each(['Escape', 'Tab'])('leaves %s alone while collapsed', async (key) => {
    const wrapper = table()
    const region = wrapper.find(SCROLL).element as HTMLElement
    region.focus()
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    })

    document.dispatchEvent(event)
    await nextTick()
    await nextTick()

    expect(event.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(region)
  })

  it.each([
    { shiftKey: false, target: 'expand button' },
    { shiftKey: true, target: 'last heading button' },
  ])(
    'pulls Tab back into the expanded card when focus is outside it (shift $shiftKey: $target)',
    async ({ shiftKey }) => {
      await page.viewport(1024, 896)
      const wrapper = table()
      await wrapper.find(EXPAND).trigger('click')
      ;(document.activeElement as HTMLElement).blur()
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      })
      document.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
      const expected = shiftKey
        ? wrapper.find(sortButton('subjects')).element
        : wrapper.find(EXPAND).element
      expect(document.activeElement).toBe(expected)
    }
  )

  it.each([
    { members: [ME, OTHER], title: '2 Members' },
    { members: [ME], title: 'Members' },
  ])('titles the card "$title"', ({ members, title }) => {
    const wrapper = table({ members })

    expect(wrapper.find('[data-testid="members-table-title"]').text()).toBe(
      title
    )
  })

  it.each([
    { props: {}, tools: true },
    { props: { isGroupAdmin: false }, tools: false },
    { props: { members: [ME] }, tools: false },
    { props: { isLoading: true }, tools: false },
    { props: { loadFailed: true }, tools: false },
  ])(
    'shows the filters and download for $props: $tools',
    ({ props, tools }) => {
      const wrapper = table(props)

      expect(wrapper.find(chip('everyone')).exists()).toBe(tools)
      expect(wrapper.find(DOWNLOAD).exists()).toBe(tools)
    }
  )

  it('shows only the members of the pressed filter and counts them', async () => {
    const wrapper = table({ members: TEAM })

    await wrapper.find(chip('needs-training')).trigger('click')

    expect(
      wrapper.find(chip('needs-training')).attributes('aria-pressed')
    ).toBe('true')
    expect(shownNames(wrapper)).toEqual(['Ana R.'])
    expect(wrapper.find(chip('needs-training')).text()).toContain('(1)')
    expect(wrapper.find(chip('everyone')).text()).toContain('(5)')
  })

  it('keeps the headings and says so when a filter matches no one', async () => {
    const wrapper = table({ members: TEAM })

    await wrapper.find(chip('needs-approval')).trigger('click')

    expect(wrapper.find(ROW).exists()).toBe(false)
    expect(wrapper.find('[data-testid="members-table-empty"]').exists()).toBe(
      true
    )
    expect(wrapper.find(sortButton('name')).exists()).toBe(true)
  })

  it('reports the name sort at rest', () => {
    const wrapper = table({ members: TEAM })

    expect(
      wrapper
        .find('[data-testid="members-table-th-name"]')
        .attributes('aria-sort')
    ).toBe('ascending')
  })

  it('reverses the names on the first press on Name', async () => {
    const wrapper = table({ members: TEAM })

    await wrapper.find(sortButton('name')).trigger('click')

    expect(shownNames(wrapper)[0]).toBe('Zoe R. (you)')
    expect(
      wrapper
        .find('[data-testid="members-table-th-name"]')
        .attributes('aria-sort')
    ).toBe('descending')
  })

  it('sorts by Vol hours from most on the second press', async () => {
    const wrapper = table({ members: TEAM })

    await wrapper.find(sortButton('hours')).trigger('click')
    await wrapper.find(sortButton('hours')).trigger('click')

    expect(shownNames(wrapper)[0]).toBe('Cal R.')
    expect(
      wrapper
        .find('[data-testid="members-table-th-hours"]')
        .attributes('aria-sort')
    ).toBe('descending')
  })

  it('keeps a rank badge under a filter and a sort', async () => {
    const wrapper = table({ members: TEAM })

    await wrapper.find(chip('needs-training')).trigger('click')
    await wrapper.find(sortButton('hours')).trigger('click')

    expect(wrapper.find('[data-testid="member-name"]').text()).toBe(
      'Ana R., rank 5'
    )
  })

  const COUNTED = [
    { ...ME, studentsHelpedThisYear: 3, subjects: ['Algebra', 'Biology'] },
    { ...OTHER, studentsHelpedThisYear: 0, subjects: [] },
    { ...ANA, studentsHelpedThisYear: 4, subjects: ['Algebra'] },
    {
      ...CAL,
      studentsHelpedThisYear: 1,
      subjects: ['Art', 'Biology', 'Chemistry'],
    },
    {
      ...DEE,
      studentsHelpedThisYear: 2,
      subjects: ['Art', 'Algebra', 'Math', 'Physics'],
    },
  ]

  it.each([
    {
      key: 'hours',
      names: ['Cal R.', 'Dee R.', 'Zoe R. (you)', 'Ben R.', 'Ana R.'],
    },
    {
      key: 'students',
      names: ['Ana R.', 'Zoe R. (you)', 'Dee R.', 'Cal R.', 'Ben R.'],
    },
    {
      key: 'subjects',
      names: ['Dee R.', 'Cal R.', 'Zoe R. (you)', 'Ana R.', 'Ben R.'],
    },
  ])(
    'sorts most first from the Sort by select by $key',
    async ({ key, names }) => {
      const wrapper = table({ isGroupAdmin: false, members: COUNTED })

      await wrapper
        .find('[data-testid="members-table-sort-select"]')
        .setValue(key)

      expect(shownNames(wrapper)).toEqual(names)
    }
  )

  it.each([
    {
      choices: ['status'],
      names: ['Ben R.', 'Zoe R. (you)', 'Cal R.', 'Dee R.', 'Ana R.'],
    },
    {
      choices: ['hours', ''],
      names: ['Ana R.', 'Ben R.', 'Cal R.', 'Dee R.', 'Zoe R. (you)'],
    },
  ])('sorts from the Sort by select: $choices', async ({ choices, names }) => {
    const wrapper = table({ members: TEAM })
    const select = wrapper.find('[data-testid="members-table-sort-select"]')

    for (const choice of choices) {
      await select.setValue(choice)
    }

    expect(shownNames(wrapper)).toEqual(names)
  })

  it.each([
    {
      isGroupAdmin: true,
      options: ['', 'name', 'status', 'hours', 'subjects'],
    },
    {
      isGroupAdmin: false,
      options: ['', 'name', 'hours', 'students', 'subjects', 'days'],
    },
    {
      isGroupAdmin: true,
      range: { firstDay: new Date(2026, 9, 5), lastDay: new Date(2026, 9, 11) },
      options: ['', 'name', 'hours', 'sessions', 'role', 'status', 'subjects'],
    },
  ])(
    'offers $options in the Sort by select when admin is $isGroupAdmin',
    ({ isGroupAdmin, range, options }) => {
      const select = table({ isGroupAdmin, range }).find(
        '[data-testid="members-table-sort-select"]'
      ).element as HTMLSelectElement

      expect(Array.from(select.options, (option) => option.value)).toEqual(
        options
      )
    }
  )

  it('shows Default order in the Sort by select at rest', () => {
    const select = table({ members: TEAM }).find(
      '[data-testid="members-table-sort-select"]'
    ).element as HTMLSelectElement

    expect(select.value).toBe('')
  })

  it('shows Default order for an equal copy of the default sort, such as a remembered one', () => {
    const select = table({
      members: TEAM,
      sort: { key: 'name', direction: 'asc' },
    }).find('[data-testid="members-table-sort-select"]')
      .element as HTMLSelectElement

    expect(select.value).toBe('')
  })

  it.each([
    { sort: 'hours', value: 'hours' },
    { sort: 'training', value: '' },
  ])(
    'shows "$value" in the Sort by select after sorting $sort',
    async ({ sort, value }) => {
      const wrapper = table({ members: TEAM })

      await wrapper.find(sortButton(sort)).trigger('click')

      expect(
        (
          wrapper.find('[data-testid="members-table-sort-select"]')
            .element as HTMLSelectElement
        ).value
      ).toBe(value)
    }
  )

  describe('download', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('downloads the rows shown with the school-year columns and the full roster labels', async () => {
      const blobs: Blob[] = []
      vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
        blobs.push(blob as Blob)
        return 'blob:test'
      })
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
        () => {}
      )
      const coPresident = member({
        userId: 'co',
        firstName: 'Eve',
        title: 'President',
      })
      const president = member({
        userId: 'pres',
        firstName: 'Fay',
        title: 'President',
        trainingComplete: false,
      })
      const wrapper = table({
        members: [ME, coPresident, president, ANA, CAL, DEE],
      })
      await wrapper.find(chip('needs-training')).trigger('click')
      await wrapper.find(sortButton('hours')).trigger('click')
      await wrapper.find(sortButton('hours')).trigger('click')

      await wrapper.find(DOWNLOAD).trigger('click')

      const [header, ...lines] = (await blobs[0].text()).split('\r\n')
      expect(lines.filter(Boolean).map((line) => line.split(',')[0])).toEqual([
        'Fay R.',
        'Ana R.',
      ])
      expect(lines[0].split(',')[1]).toBe('Co-President')
      expect(header).toContain('Hours (2026–27 school year)')
      expect(header).not.toContain('This week')
    })

    it('is disabled while the filter shows no one', async () => {
      const wrapper = table({ members: TEAM })

      await wrapper.find(chip('needs-approval')).trigger('click')

      expect(wrapper.find(DOWNLOAD).attributes('disabled')).toBeDefined()
    })

    it.each([
      { elapsed: 1999, disabled: true },
      { elapsed: 2000, disabled: false },
    ])(
      'is disabled $elapsed ms after a press: $disabled',
      async ({ elapsed, disabled }) => {
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
          () => {}
        )
        vi.useFakeTimers()
        const wrapper = table()

        await wrapper.find(DOWNLOAD).trigger('click')
        vi.advanceTimersByTime(elapsed)
        await nextTick()

        expect(
          wrapper.find(DOWNLOAD).attributes('disabled') !== undefined
        ).toBe(disabled)
      }
    )
  })

  describe('with a range', () => {
    const RANGE: RosterRange = {
      firstDay: new Date(2026, 9, 5),
      lastDay: new Date(2026, 9, 11),
    }
    const PRESIDENT = member({
      userId: 'pres',
      firstName: 'Pat',
      roleName: 'admin',
      title: 'President',
      rangeHours: 1.5,
      rangeSessions: 2,
    })
    const ADMIN = member({ userId: 'adm', firstName: 'Ada', roleName: 'admin' })
    const CLOSED = member({
      userId: 'gone',
      firstName: 'Gus',
      accountClosed: true,
    })
    const QUIET = member({
      userId: 'quiet',
      firstName: 'Quinn',
      periodSessions: { ...NO_PERIOD_ACTIVITY, thisSchoolYear: 1 },
    })
    const RANGED = [PRESIDENT, ADMIN, CLOSED, QUIET]

    function cells(wrapper: VueWrapper, testId: string) {
      return wrapper
        .findAll(`[data-testid="${testId}"]`)
        .map((cell) => cell.text())
    }

    it('shows hours, sessions, role and status over the range, by name with no rank', () => {
      const wrapper = table({ members: RANGED, range: RANGE })

      expect(
        wrapper
          .findAll('[data-testid^="members-table-th-"]')
          .map((th) => th.text())
      ).toEqual([
        'Name',
        'Vol hours',
        'Sessions',
        'Role',
        'Status',
        'Screen',
        'Training',
        '1st',
        'Subjects',
      ])
      expect(shownNames(wrapper)).toEqual([
        'Ada R.',
        'Gus R.',
        'Pat R.',
        'Quinn R.',
      ])
      expect(wrapper.find(ROW).text()).not.toContain('#')
      expect(cells(wrapper, 'member-hours')).toEqual([
        '0h 0m',
        '0h 0m',
        '1h 30m',
        '0h 0m',
      ])
      expect(cells(wrapper, 'member-sessions')).toEqual(['0', '0', '2', '0'])
      expect(cells(wrapper, 'member-role')).toEqual([
        'Admin',
        'Member',
        'President',
        'Member',
      ])
      expect(cells(wrapper, 'member-status')).toEqual([
        'No hours',
        'Account closed',
        'Active',
        'No hours',
      ])
    })

    it('keeps a lone admin in the table and counts only current members in the title', () => {
      const wrapper = table({ members: [ME, CLOSED], range: RANGE })

      expect(wrapper.find(PROMPT).exists()).toBe(false)
      expect(wrapper.find(ROW).exists()).toBe(true)
      expect(wrapper.find('[data-testid="members-table-title"]').text()).toBe(
        '1 Member'
      )
    })

    it('marks a first session from the school year whatever the range holds', () => {
      const wrapper = table({ members: [QUIET], range: RANGE })

      expect(cells(wrapper, 'member-marks')[2]).toBe('Done')
    })

    it('offers the range filters beside the range control', () => {
      const wrapper = table(
        { members: RANGED, range: RANGE },
        { range: '<button data-testid="range-slot">Range</button>' }
      )

      expect(wrapper.find('[data-testid="range-slot"]').exists()).toBe(true)
      expect(wrapper.find(chip('no-hours')).text()).toBe('No hours (2)')
      expect(wrapper.find(chip('no-hours-this-week')).exists()).toBe(false)
    })

    it.each([
      { isGroupAdmin: true, picker: true },
      { isGroupAdmin: false, picker: false },
    ])(
      'keeps the range control but no filters after a failed reload, for an admin: $isGroupAdmin',
      ({ isGroupAdmin, picker }) => {
        const wrapper = table(
          { members: RANGED, range: RANGE, loadFailed: true, isGroupAdmin },
          { range: '<button data-testid="range-slot">Range</button>' }
        )

        expect(wrapper.find('[data-testid="range-slot"]').exists()).toBe(picker)
        expect(wrapper.find(chip('everyone')).exists()).toBe(false)
      }
    )

    it('reports a sort change so the page can remember it', async () => {
      const wrapper = table({ members: RANGED, range: RANGE })

      await wrapper.find(sortButton('sessions')).trigger('click')

      expect(wrapper.emitted('update:sort')).toEqual([
        [{ key: 'sessions', direction: 'asc' }],
      ])
    })

    it('emits the action chosen from a row menu and closes it', async () => {
      const wrapper = table({ members: RANGED, range: RANGE })

      await wrapper.find('[data-testid="member-actions-adm"]').trigger('click')
      await wrapper
        .find('[data-testid="member-remove-admin-adm"]')
        .trigger('click')

      expect(wrapper.emitted('act')).toEqual([[ADMIN, 'remove_admin']])
      expect(
        wrapper
          .find('[data-testid="member-actions-adm"]')
          .attributes('aria-expanded')
      ).toBe('false')
    })

    it('closes only the row menu on Escape when the table is expanded', async () => {
      const wrapper = table({ members: RANGED, range: RANGE })
      await wrapper.find(EXPAND).trigger('click')
      const actions = wrapper.find('[data-testid="member-actions-adm"]')
      await actions.trigger('click')

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      )
      await nextTick()

      expect(actions.attributes('aria-expanded')).toBe('false')
      expect(wrapper.find(EXPAND).attributes('aria-pressed')).toBe('true')
    })

    it('downloads only the rows shown', async () => {
      const blobs: Blob[] = []
      vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
        blobs.push(blob as Blob)
        return 'blob:test'
      })
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
        () => {}
      )
      const wrapper = table({ members: RANGED, range: RANGE })
      await wrapper.find(chip('no-hours')).trigger('click')

      await wrapper.find(DOWNLOAD).trigger('click')

      const [, ...lines] = (await blobs[0].text()).split('\r\n')
      expect(lines.filter(Boolean).map((line) => line.split(',')[0])).toEqual([
        'Ada R.',
        'Quinn R.',
      ])
    })
  })
})
