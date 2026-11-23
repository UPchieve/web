import RightNowCard from '@/components/NTHS/HQ/RightNowCard.vue'
import { NTHS_RECRUITMENT_TEMPLATES_URL } from '@/services/NTHSGroupService'
import { enableAutoUnmount, mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { impact } from '../../../fixtures/nths'

enableAutoUnmount(afterEach)

function card(props: Record<string, unknown> = {}) {
  return mount(RightNowCard, {
    props: {
      impact: impact({
        schoolYearToDate: {
          studentsHelped: 0,
          sessionsCompleted: 0,
          hoursTutored: 0,
          membersTutoring: 2,
        },
      }),
      memberCount: 3,
      inviteCode: 'ABC123',
      referralCode: 'PERSON123',
      ...props,
    },
    global: { stubs: { RouterLink: RouterLinkStub, transition: false } },
  })
}

describe('RightNowCard', () => {
  it('shows the step and its three actions, copying the invite link', async () => {
    const wrapper = card()

    expect(wrapper.get('[data-testid="right-now-line"]').text()).toBe(
      'Get 1 more member to their first session'
    )
    let copied = ''
    vi.spyOn(document, 'execCommand').mockImplementation(() => {
      copied = (document.activeElement as HTMLTextAreaElement).value
      return true
    })
    await wrapper.get('[data-testid="right-now-copy"]').trigger('click')
    expect(copied).toContain('/join-team/ABC123?referral=PERSON123')
    expect(
      wrapper.get('[data-testid="right-now-scripts"]').attributes('href')
    ).toBe(NTHS_RECRUITMENT_TEMPLATES_URL)
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe(
      '/groups/resources'
    )
  })

  it('hides the copy button without an invite code', () => {
    const wrapper = card({ inviteCode: undefined })

    expect(wrapper.find('[data-testid="right-now-copy"]').exists()).toBe(false)
  })

  it.each([
    { memberCount: 1, tutoring: 0, text: 'Invite your first member' },
    { memberCount: 2, tutoring: 0, text: 'Invite 1 more member' },
    {
      memberCount: 3,
      tutoring: 1,
      text: 'Get 2 more members to their first session',
    },
  ])(
    'reads "$text" at $memberCount members',
    ({ memberCount, tutoring, text }) => {
      const wrapper = card({
        memberCount,
        impact: impact({
          schoolYearToDate: {
            studentsHelped: 0,
            sessionsCompleted: 0,
            hoursTutored: 0,
            membersTutoring: tutoring,
          },
        }),
      })

      expect(wrapper.get('[data-testid="right-now-line"]').text()).toBe(text)
    }
  )

  it('reads the hours left in hours and minutes', () => {
    const wrapper = card({
      impact: impact({
        schoolYearToDate: {
          studentsHelped: 0,
          sessionsCompleted: 0,
          hoursTutored: 22.75,
          membersTutoring: 3,
        },
      }),
    })

    expect(wrapper.get('[data-testid="right-now-line"]').text()).toBe(
      'Log 17h 15m more to reach 40 hours'
    )
  })
})
