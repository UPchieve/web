import MembersTable from '@/components/NTHS/Members/MembersTable.vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { member, NO_PERIOD_ACTIVITY } from '../../../fixtures/nths'

const NOW = new Date('2026-10-15T12:00:00.000Z')

const ME = member({ userId: 'me', firstName: 'Zoe', roleName: 'admin' })
const OTHER = member({
  userId: 'other',
  firstName: 'Ben',
  lastActiveAt: '2026-10-12T12:00:00.000Z',
})

enableAutoUnmount(afterEach)

function table(
  props: {
    members?: ReturnType<typeof member>[]
    isGroupAdmin?: boolean
    isLoading?: boolean
    loadFailed?: boolean
  } = {}
) {
  return mount(MembersTable, {
    props: {
      members: [ME, OTHER],
      currentUserId: 'me',
      isGroupAdmin: true,
      inviteCode: 'ABC123',
      referralCode: 'PERSON123',
      now: NOW,
      ...props,
    },
    attachTo: 'body',
  })
}

const ROW = '[data-testid="members-table-row"]'
const EXPAND = '[data-testid="members-table-expand"]'
const PROMPT = '[data-testid="members-table-invite"]'
const SCROLL = '[data-testid="members-table-scroll"]'

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
    }
  )

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

  it('shows the invite link with the referral code in the prompt', () => {
    const link = table({ members: [ME] })
      .find(PROMPT)
      .text()

    expect(link).toContain('ABC123')
    expect(link).toContain('PERSON123')
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
      allTime: 0,
      marks: ['Done', 'Not yet', 'Not yet'],
    },
    {
      safetyApproved: false,
      trainingComplete: true,
      allTime: 1,
      marks: ['Not yet', 'Done', 'Done'],
    },
  ])(
    'marks Screen, Training and 1st from their own fields: $marks',
    ({ safetyApproved, trainingComplete, allTime, marks }) => {
      const wrapper = table({
        members: [
          member({
            userId: 'u',
            safetyApproved,
            trainingComplete,
            periodSessions: { ...NO_PERIOD_ACTIVITY, allTime },
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
    { from: 'region', shiftKey: false, wrapsTo: 'expand' },
    { from: 'expand', shiftKey: true, wrapsTo: 'region' },
    { from: 'expand', shiftKey: false, wrapsTo: undefined },
    { from: 'region', shiftKey: true, wrapsTo: undefined },
  ])(
    'wraps Tab at the ends of the expanded card (from $from, shift $shiftKey)',
    async ({ from, shiftKey, wrapsTo }) => {
      const wrapper = table()
      await wrapper.find(EXPAND).trigger('click')
      const elements: Record<string, HTMLElement> = {
        expand: wrapper.find(EXPAND).element as HTMLElement,
        region: wrapper.find(SCROLL).element as HTMLElement,
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
    { shiftKey: true, target: 'scroll region' },
  ])(
    'pulls Tab back into the expanded card when focus is outside it (shift $shiftKey: $target)',
    async ({ shiftKey }) => {
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
        ? wrapper.find(SCROLL).element
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
})
