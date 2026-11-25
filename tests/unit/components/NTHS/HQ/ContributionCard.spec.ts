import ContributionCard from '@/components/NTHS/HQ/ContributionCard.vue'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { describe, expect, it } from 'vitest'
import { impact, member, NO_PERIOD_ACTIVITY } from '../../../fixtures/nths'

function tutor(userId: string, hours: number, overrides = {}) {
  return member({
    userId,
    periodHours: { ...NO_PERIOD_ACTIVITY, thisSchoolYear: hours },
    ...overrides,
  })
}

function card(
  members: ReturnType<typeof tutor>[],
  props: { isLoading?: boolean } = {}
) {
  const store = createStore({
    modules: {
      user: {
        namespaced: true,
        getters: { avatar: () => ({ id: 'a', component: 'span' }) },
      },
    },
  })
  return mount(ContributionCard, {
    props: {
      members,
      currentUserId: 'me',
      impact: impact({
        schoolYearToDate: {
          studentsHelped: 1,
          sessionsCompleted: 1,
          hoursTutored: 22.75,
          membersTutoring: 2,
        },
      }),
      ...props,
    },
    global: { plugins: [store] },
  })
}

const text = (w: ReturnType<typeof card>, id: string) =>
  w.find(`[data-testid="${id}"]`).text()

describe('ContributionCard', () => {
  it('shows the member hours, the rest of the chapter and the bar values', () => {
    const wrapper = card([tutor('me', 5.5), tutor('a', 1), tutor('b', 1)])

    expect(text(wrapper, 'contribution-hours')).toBe('5h 30m')
    expect(text(wrapper, 'contribution-legend-you')).toBe('You · 5h 30m')
    expect(text(wrapper, 'contribution-legend-others')).toBe(
      '2 members · 17h 15m'
    )
    const bar = wrapper.find('[data-testid="contribution-bar"]')
    expect(bar.attributes('aria-valuenow')).toBe('22.75')
    expect(bar.attributes('aria-valuetext')).toBe('22h 45m of 40 member hours')
  })

  it('shows zero hours for a member with none', () => {
    expect(text(card([tutor('me', 0)]), 'contribution-hours')).toBe('0h 0m')
  })

  it('uses the singular for one other member', () => {
    const wrapper = card([tutor('me', 1), tutor('a', 1)])

    expect(text(wrapper, 'contribution-legend-others')).toMatch(/^1 member ·/)
  })

  it('keeps the card, with an empty bar, while the roster loads', () => {
    const wrapper = card([], { isLoading: true })

    expect(wrapper.find('[data-testid="contribution"]').exists()).toBe(true)
    expect(text(wrapper, 'contribution-legend-others')).toBe(
      '0 members · 0h 0m'
    )
  })

  it('renders nothing without a roster row for the viewer', () => {
    expect(
      card([tutor('a', 1)])
        .find('[data-testid="contribution"]')
        .exists()
    ).toBe(false)
  })
})
