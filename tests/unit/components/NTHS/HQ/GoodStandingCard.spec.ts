import GoodStandingCard from '@/components/NTHS/HQ/GoodStandingCard.vue'
import type { NTHSChapterImpactPublic } from '@/services/NTHSGroupService'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

const IMPACT: NTHSChapterImpactPublic = {
  groupId: 'group-123',
  schoolYear: { label: '2026–27', startsAt: '', endsAt: '' },
  schoolYearToDate: {
    studentsHelped: 2,
    sessionsCompleted: 4,
    hoursTutored: 3,
    membersTutoring: 2,
  },
  allTime: { studentsHelped: 2, sessionsCompleted: 6, hoursTutored: 4.5 },
  goals: { hoursTutored: 40, membersTutoring: 3 },
  official: false,
}

describe('GoodStandingCard', () => {
  it('hides the placeholder numbers from assistive tech while loading', () => {
    const wrapper = mount(GoodStandingCard)

    expect(
      wrapper
        .find('[data-testid="good-standing-loading"]')
        .attributes('aria-busy')
    ).toBe('true')
    expect(
      wrapper
        .find('[data-testid="good-standing-meters"]')
        .attributes('aria-hidden')
    ).toBe('true')
  })

  it('exposes the real numbers once loaded, with nothing hidden', () => {
    const wrapper = mount(GoodStandingCard, { props: { impact: IMPACT } })

    expect(
      wrapper
        .find('[data-testid="good-standing-meters"]')
        .attributes('aria-hidden')
    ).toBeUndefined()
  })

  it.each([
    { official: false, shown: true },
    { official: true, shown: false },
  ])(
    'shows the members note only while pending (official: $official)',
    ({ official, shown }) => {
      const wrapper = mount(GoodStandingCard, {
        props: { impact: { ...IMPACT, official } },
      })

      expect(
        wrapper
          .find('[data-testid="members-meter"]')
          .text()
          .includes('makes you official')
      ).toBe(shown)
    }
  )
})
