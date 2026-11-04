import PersonCard, { type LastSession } from '@/components/PersonCard.vue'
import InitialsAvatar from '@/components/InitialsAvatar.vue'
import { avatarColor } from '@/components/NTHS/member-avatar'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

function lastSession(overrides: Partial<LastSession> = {}): LastSession {
  return {
    subject: 'Algebra 1',
    date: '2026-10-22T15:00:00',
    durationMinutes: 45,
    ...overrides,
  }
}

function mountCard(
  props: {
    type?: 'coach' | 'student'
    name?: string
    userId?: string
    lastSession?: LastSession | null
  } = {},
  slots = {}
) {
  return mount(PersonCard, {
    props: { type: 'coach', name: 'Riley', ...props },
    slots,
  })
}

function details(wrapper: ReturnType<typeof mountCard>) {
  return wrapper
    .findAll('[data-testid="person-card-detail"]')
    .map((detail) => detail.text())
}

describe('PersonCard', () => {
  it('shows the name and the last session subject, date and duration', () => {
    const wrapper = mountCard({ lastSession: lastSession() })

    expect(wrapper.find('[data-testid="person-card-name"]').text()).toBe(
      'Riley'
    )
    expect(details(wrapper)).toEqual(['Algebra 1', 'Oct 22, 2026', '45 min'])
  })

  it.each([
    [0.2, '1 min'],
    [59.6, '1 hr'],
    [60, '1 hr'],
    [65, '1 hr 5 min'],
    [130, '2 hr 10 min'],
  ])('formats a %s minute session as %s', (durationMinutes, expected) => {
    const wrapper = mountCard({
      lastSession: lastSession({ durationMinutes }),
    })

    expect(details(wrapper)).toContain(expected)
  })

  it('renders the actions slot only when one is passed', () => {
    expect(
      mountCard().find('[data-testid="person-card-actions"]').exists()
    ).toBe(false)

    const wrapper = mountCard({}, { actions: '<button>Message</button>' })
    expect(wrapper.find('[data-testid="person-card-actions"]').text()).toBe(
      'Message'
    )
  })

  it('renders the avatar badge slot inside the avatar only when one is passed', () => {
    expect(
      mountCard().find('[data-testid="person-card-avatar-badge"]').exists()
    ).toBe(false)

    const wrapper = mountCard({}, { 'avatar-badge': '<button>Star</button>' })
    const badge = wrapper.find(
      '.person-card__avatar [data-testid="person-card-avatar-badge"]'
    )
    expect(badge.text()).toBe('Star')
  })

  it("shows a student's first initial on a color keyed to their id", () => {
    const wrapper = mountCard({
      type: 'student',
      name: 'maya',
      userId: 'student-1',
    })

    const avatar = wrapper.findComponent(InitialsAvatar)
    expect(avatar.props('initials')).toBe('M')
    expect(avatar.props('bgColor')).toBe(avatarColor('student-1'))
  })

  it('shows the coach icon instead of initials for coaches', () => {
    const wrapper = mountCard({ type: 'coach' })

    expect(wrapper.findComponent(InitialsAvatar).exists()).toBe(false)
    expect(wrapper.find('.person-card__icon').exists()).toBe(true)
  })
})
