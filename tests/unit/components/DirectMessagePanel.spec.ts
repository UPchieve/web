import DirectMessagePanel from '@/components/DirectMessagePanel.vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import { avatarColor, AVATAR_TEXT_COLOR } from '@/components/NTHS/member-avatar'

vi.mock('@/store', () => ({
  default: {
    getters: { 'featureFlags/isShowCoachStatusEnabled': true },
  },
}))

function mountPanel({
  props = {},
  slots = {},
}: {
  props?: Record<string, unknown>
  slots?: Record<string, string>
} = {}) {
  return mount(DirectMessagePanel, {
    attachTo: document.body,
    props: {
      partnerId: 'coach-1',
      partnerName: 'Alex',
      partnerType: 'coach',
      ...props,
    },
    slots,
    global: {
      plugins: [
        createStore({
          modules: {
            app: {
              namespaced: true,
              getters: { mobileMode: () => false },
            },
          },
        }),
      ],
      // Use the real Transition so the close is emitted after the panel
      // slides out
      stubs: {
        transition: false,
        DirectMessageChat: true,
        DirectMessageReport: true,
      },
    },
  })
}

describe('DirectMessagePanel', () => {
  let wrapper: ReturnType<typeof mountPanel> | undefined

  beforeEach(() => {
    document.body.appendChild(document.createElement('ion-app'))
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    document.querySelector('ion-app')?.remove()
  })

  it('shows the partner name and passes the conversation to the chat', () => {
    wrapper = mountPanel()

    expect(wrapper.find('.dm-panel__name').text()).toBe('Alex')
    expect(
      wrapper.findComponent({ name: 'DirectMessageChat' }).props()
    ).toEqual({
      partnerId: 'coach-1',
      partnerName: 'Alex',
    })
  })

  it('emits close when the close button is clicked', async () => {
    wrapper = mountPanel()

    await wrapper.find('[data-testid="dm-panel-close"]').trigger('click')

    await vi.waitFor(() => expect(wrapper!.emitted('close')).toHaveLength(1))
  })

  it('emits close when the grayed-out background is clicked', async () => {
    wrapper = mountPanel()

    await wrapper.find('[data-testid="dm-panel-scrim"]').trigger('click')

    await vi.waitFor(() => expect(wrapper!.emitted('close')).toHaveLength(1))
  })

  it('slides out before emitting close', async () => {
    wrapper = mountPanel()

    await wrapper.find('[data-testid="dm-panel-close"]').trigger('click')

    expect(wrapper.emitted('close')).toBeUndefined()
    await vi.waitFor(() => expect(wrapper!.emitted('close')).toHaveLength(1))
    expect(wrapper.find('.dm-panel').exists()).toBe(false)
  })

  it('does not close when clicking inside the panel', async () => {
    wrapper = mountPanel()

    await wrapper.find('.dm-panel').trigger('click')

    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('emits close when Escape is pressed', async () => {
    wrapper = mountPanel()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    await vi.waitFor(() => expect(wrapper!.emitted('close')).toHaveLength(1))
  })

  it('locks page scrolling while open', () => {
    wrapper = mountPanel()
    expect(document.body.classList.contains('disable-scroll')).toBe(true)

    wrapper.unmount()
    wrapper = undefined
    document.querySelector('ion-app')?.remove()
    expect(document.body.classList.contains('disable-scroll')).toBe(false)
  })

  it.each([
    ['online', 'Online now'],
    ['in-session', 'In session'],
    ['offline', 'Offline'],
  ])('shows the %s status label and presence dot', (status, label) => {
    wrapper = mountPanel({ props: { status } })

    expect(wrapper.find('[data-testid="dm-panel-status"]').text()).toBe(label)
    expect(wrapper.find('[data-testid="presence-dot"]').classes()).toContain(
      `presence-dot--${status}`
    )
  })

  it('shows no status when none is given', () => {
    wrapper = mountPanel()

    expect(wrapper.find('[data-testid="dm-panel-status"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="presence-dot"]').exists()).toBe(false)
  })

  it('renders the avatar badge and actions slots', () => {
    wrapper = mountPanel({
      slots: {
        'avatar-badge': '<button data-testid="badge">star</button>',
        actions: '<button data-testid="action">Request session</button>',
      },
    })

    expect(
      wrapper
        .find('[data-testid="coach-avatar-badge"] [data-testid="badge"]')
        .exists()
    ).toBe(true)
    expect(
      wrapper
        .find('[data-testid="dm-panel-actions"] [data-testid="action"]')
        .exists()
    ).toBe(true)
  })

  it('renders no actions area without the actions slot', () => {
    wrapper = mountPanel()

    expect(wrapper.find('[data-testid="dm-panel-actions"]').exists()).toBe(
      false
    )
  })

  it('uses the coach avatar for coaches', () => {
    wrapper = mountPanel()

    const avatar = wrapper.findComponent({ name: 'CoachAvatar' })
    expect(avatar.exists()).toBe(true)
    expect(avatar.props('size')).toBe(56)
    expect(wrapper.findComponent({ name: 'InitialsAvatar' }).exists()).toBe(
      false
    )
  })

  it('uses the initials avatar for students', () => {
    wrapper = mountPanel({
      props: { partnerType: 'student', partnerName: 'jordan' },
    })

    const avatar = wrapper.findComponent({ name: 'InitialsAvatar' })
    expect(avatar.props()).toMatchObject({
      initials: 'J',
      widthPx: 56,
      bgColor: avatarColor('coach-1'),
      fgColor: AVATAR_TEXT_COLOR,
    })
    expect(wrapper.findComponent({ name: 'CoachAvatar' }).exists()).toBe(false)
  })

  it.each(['coach', 'student'])(
    'shows a named report option in the %s menu',
    async (partnerType) => {
      wrapper = mountPanel({ props: { partnerType, partnerName: 'Nalini' } })
      expect(wrapper.find('[data-testid="dm-report"]').exists()).toBe(false)
      wrapper
        .findComponent({ name: 'DirectMessageChat' })
        .vm.$emit('conversation-ready', 'conversation-1')
      await wrapper.vm.$nextTick()
      await wrapper.find('[data-testid="dm-menu"]').trigger('click')
      expect(wrapper.find('[data-testid="dm-report"]').text()).toBe(
        'Report Nalini'
      )
      expect(
        wrapper.find('[data-testid="dm-menu"]').attributes('aria-expanded')
      ).toBe('true')
      await wrapper.find('[data-testid="dm-report"]').trigger('click')
      expect(
        wrapper
          .findComponent({ name: 'DirectMessageReport' })
          .props('partnerType')
      ).toBe(partnerType)
      expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    }
  )

  it('opens the menu with the keyboard and closes it on Escape without closing the panel', async () => {
    wrapper = mountPanel()
    wrapper
      .findComponent({ name: 'DirectMessageChat' })
      .vm.$emit('conversation-ready', 'conversation-1')
    await wrapper.vm.$nextTick()
    await wrapper
      .find('[data-testid="dm-menu"]')
      .trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    await wrapper
      .find('[data-testid="dm-report"]')
      .trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('closes the menu when clicking elsewhere in the panel', async () => {
    wrapper = mountPanel()
    wrapper
      .findComponent({ name: 'DirectMessageChat' })
      .vm.$emit('conversation-ready', 'conversation-1')
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="dm-menu"]').trigger('click')
    await wrapper.find('.dm-panel__name').trigger('pointerdown')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('enables reporting only after the conversation is ready', async () => {
    wrapper = mountPanel()
    expect(
      wrapper.find('[data-testid="dm-menu"]').attributes('disabled')
    ).toBeDefined()
    wrapper
      .findComponent({ name: 'DirectMessageChat' })
      .vm.$emit('conversation-ready', 'conversation-1')
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="dm-menu"]').trigger('click')
    await wrapper.find('[data-testid="dm-report"]').trigger('click')
    const reportModal = document.querySelector(
      '[data-testid="dm-report-modal"]'
    )!
    expect(reportModal.parentElement).toBe(document.querySelector('ion-app'))
    expect(wrapper.find('.dm-panel').element.contains(reportModal)).toBe(false)
    expect(wrapper.find('.dm-panel').attributes('inert')).toBeDefined()
    expect(
      wrapper.findComponent({ name: 'DirectMessageChat' }).isVisible()
    ).toBe(true)
    const report = wrapper.findComponent({ name: 'DirectMessageReport' })
    expect(report.props()).toEqual({
      conversationId: 'conversation-1',
      partnerType: 'coach',
    })
    report.vm.$emit('submitted')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Your report has been submitted')
    expect(wrapper.find('[data-testid="dm-menu"]').exists()).toBe(true)
    await wrapper.find('[data-testid="dm-menu"]').trigger('click')
    await wrapper.find('[data-testid="dm-report"]').trigger('click')
    expect(
      wrapper.findComponent({ name: 'DirectMessageReport' }).exists()
    ).toBe(true)
    expect(wrapper.text()).not.toContain('Your report has been submitted')
  })

  it('returns to chat on Escape while reporting instead of closing the panel', async () => {
    wrapper = mountPanel()
    wrapper
      .findComponent({ name: 'DirectMessageChat' })
      .vm.$emit('conversation-ready', 'conversation-1')
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="dm-menu"]').trigger('click')
    await wrapper.find('[data-testid="dm-report"]').trigger('click')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(
      wrapper.findComponent({ name: 'DirectMessageReport' }).exists()
    ).toBe(false)
    expect(wrapper.emitted('close')).toBeUndefined()
  })
  it('keeps the panel open while a report is submitting', async () => {
    wrapper = mountPanel()
    wrapper
      .findComponent({ name: 'DirectMessageChat' })
      .vm.$emit('conversation-ready', 'conversation-1')
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-testid="dm-menu"]').trigger('click')
    await wrapper.find('[data-testid="dm-report"]').trigger('click')
    wrapper
      .findComponent({ name: 'DirectMessageReport' })
      .vm.$emit('submitting', true)
    await wrapper.vm.$nextTick()
    expect(
      wrapper.find('[data-testid="dm-panel-close"]').attributes('disabled')
    ).toBeDefined()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.find('[data-testid="dm-panel-scrim"]').trigger('click')
    expect(
      wrapper.findComponent({ name: 'DirectMessageReport' }).exists()
    ).toBe(true)
    expect(wrapper.emitted('close')).toBeUndefined()
  })
})
