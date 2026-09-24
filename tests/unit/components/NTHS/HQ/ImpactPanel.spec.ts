import ImpactPanel from '@/components/NTHS/HQ/ImpactPanel.vue'
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
}

describe('ImpactPanel', () => {
  it('hides the placeholder numbers from assistive tech while loading', () => {
    const wrapper = mount(ImpactPanel)

    expect(
      wrapper.find('[data-testid="impact-loading"]').attributes('aria-busy')
    ).toBe('true')
    expect(
      wrapper.find('[data-testid="impact-header"]').attributes('aria-hidden')
    ).toBe('true')
    expect(
      wrapper.find('[data-testid="impact-cards"]').attributes('aria-hidden')
    ).toBe('true')

    const status = wrapper.find('[role="status"]')
    expect(status.exists()).toBe(true)
    expect(status.text().length).toBeGreaterThan(0)
  })

  it('exposes the real numbers once loaded, with nothing hidden', () => {
    const wrapper = mount(ImpactPanel, { props: { impact: IMPACT } })

    expect(
      wrapper.find('[data-testid="impact-header"]').attributes('aria-hidden')
    ).toBeUndefined()
    expect(
      wrapper.find('[data-testid="impact-cards"]').attributes('aria-hidden')
    ).toBeUndefined()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="students-helped"]').text()).toBe('2')
  })
})
