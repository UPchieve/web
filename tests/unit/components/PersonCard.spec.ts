import PersonCard, { type LastSession } from '@/components/PersonCard.vue'
import InitialsAvatar from '@/components/InitialsAvatar.vue'
import CoachAvatar from '@/components/CoachAvatar.vue'
import { avatarColor } from '@/components/NTHS/member-avatar'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

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
    nameClickable?: boolean
  } = {},
  slots = {},
  options: { attachTo?: HTMLElement } = {}
) {
  return mount(PersonCard, {
    props: { type: 'coach', name: 'Riley', ...props },
    slots,
    ...options,
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
      mountCard().find('[data-testid="coach-avatar-badge"]').exists()
    ).toBe(false)

    const wrapper = mountCard({}, { 'avatar-badge': '<button>Star</button>' })
    const badge = wrapper.find(
      '.person-card__avatar [data-testid="coach-avatar-badge"]'
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

  it('shows the coach avatar instead of initials for coaches', () => {
    const wrapper = mountCard({ type: 'coach' })

    expect(wrapper.findComponent(InitialsAvatar).exists()).toBe(false)
    expect(wrapper.findComponent(CoachAvatar).exists()).toBe(true)
  })
  describe('name popover', () => {
    let wrapper: ReturnType<typeof mountCard> | undefined

    afterEach(() => {
      wrapper?.unmount()
      wrapper = undefined
    })

    // Attached so isVisible() reflects the v-show state in the browser
    function mountWithPopover(props: { nameClickable?: boolean } = {}) {
      wrapper = mountCard(
        props,
        { 'name-popover': '<p>Coach info</p>' },
        { attachTo: document.body }
      )
      return wrapper
    }

    function popover(wrapper: ReturnType<typeof mountCard>) {
      return wrapper.find('[data-testid="person-card-name-popover"]')
    }

    it('keeps the name as plain text when no popover slot is passed', () => {
      const wrapper = mountCard()

      expect(
        wrapper.find('[data-testid="person-card-name-button"]').exists()
      ).toBe(false)
      expect(popover(wrapper).exists()).toBe(false)
      expect(wrapper.find('[data-testid="person-card-name"]').text()).toBe(
        'Riley'
      )
    })

    it('opens on mouse hover and closes when the mouse leaves', async () => {
      const wrapper = mountWithPopover()
      const trigger = wrapper.find('.person-card__name-trigger')

      expect(popover(wrapper).isVisible()).toBe(false)

      await trigger.trigger('pointerenter', { pointerType: 'mouse' })
      expect(popover(wrapper).isVisible()).toBe(true)
      expect(popover(wrapper).text()).toBe('Coach info')

      await trigger.trigger('pointerleave', { pointerType: 'mouse' })
      expect(popover(wrapper).isVisible()).toBe(false)
    })

    it('opens on keyboard focus and closes on Escape', async () => {
      const wrapper = mountWithPopover()
      const button = wrapper.find('[data-testid="person-card-name-button"]')

      await button.trigger('focus')
      expect(popover(wrapper).isVisible()).toBe(true)
      expect(button.attributes('aria-expanded')).toBe('true')

      await wrapper.find('.person-card__name-trigger').trigger('keydown', {
        key: 'Escape',
      })
      expect(popover(wrapper).isVisible()).toBe(false)
    })

    it('emits name-click and closes the popover when the name is clickable', async () => {
      const wrapper = mountWithPopover({ nameClickable: true })
      const button = wrapper.find('[data-testid="person-card-name-button"]')

      await wrapper
        .find('.person-card__name-trigger')
        .trigger('pointerenter', { pointerType: 'mouse' })
      expect(popover(wrapper).isVisible()).toBe(true)

      await button.trigger('pointerdown', { pointerType: 'mouse' })
      await button.trigger('click')
      expect(wrapper.emitted('name-click')).toHaveLength(1)
      expect(popover(wrapper).isVisible()).toBe(false)
    })

    it('makes the name a button without a popover when only clickable', async () => {
      const wrapper = mountCard({ nameClickable: true })
      const button = wrapper.find('[data-testid="person-card-name-button"]')

      expect(popover(wrapper).exists()).toBe(false)
      expect(button.attributes('aria-expanded')).toBeUndefined()
      await button.trigger('click')
      expect(wrapper.emitted('name-click')).toHaveLength(1)
    })

    it('toggles on tap', async () => {
      const wrapper = mountWithPopover()
      const button = wrapper.find('[data-testid="person-card-name-button"]')

      await button.trigger('pointerdown', { pointerType: 'touch' })
      await button.trigger('click')
      expect(popover(wrapper).isVisible()).toBe(true)

      await button.trigger('pointerdown', { pointerType: 'touch' })
      await button.trigger('click')
      expect(popover(wrapper).isVisible()).toBe(false)
    })
  })
})
