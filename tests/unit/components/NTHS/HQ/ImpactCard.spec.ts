import ImpactCard from '@/components/NTHS/HQ/ImpactCard.vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { impact } from '../../../fixtures/nths'

const IMPACT = impact({
  schoolYearToDate: {
    studentsHelped: 6,
    sessionsCompleted: 9,
    hoursTutored: 39.96,
    membersTutoring: 4,
  },
  allTime: { studentsHelped: 8, sessionsCompleted: 12, hoursTutored: 52.96 },
})

function numbers(wrapper: ReturnType<typeof mount>) {
  return ['impact-hours', 'impact-students', 'impact-sessions'].map((id) =>
    wrapper.find(`[data-testid="${id}"]`).text()
  )
}

describe('ImpactCard', () => {
  it('announces loading and hides the placeholder numbers until they arrive', async () => {
    const wrapper = mount(ImpactCard)
    const placeholder = wrapper.find('[data-testid="impact-numbers"]')

    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(placeholder.attributes('aria-hidden')).toBe('true')

    await wrapper.setProps({ impact: IMPACT })

    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(placeholder.attributes('aria-hidden')).toBeUndefined()
  })

  it('opens on this school year', () => {
    const wrapper = mount(ImpactCard, { props: { impact: IMPACT } })

    expect(
      wrapper
        .find('[data-testid="impact-tab-year"]')
        .attributes('aria-selected')
    ).toBe('true')
  })

  it.each([
    { tab: 'impact-tab-year', shown: ['39.9', '6', '9'] },
    { tab: 'impact-tab-all', shown: ['52', '8', '12'] },
  ])("shows $tab's own three numbers", async ({ tab, shown }) => {
    const wrapper = mount(ImpactCard, { props: { impact: IMPACT } })

    await wrapper.find(`[data-testid="${tab}"]`).trigger('click')

    expect(numbers(wrapper)).toEqual(shown)
  })
})
