import DoThisNowCard from '@/components/NTHS/DoThisNowCard.vue'
import type { NTHSChecklistItemPublic } from '@upchieve/api-contracts/nths-checklist'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const item = (
  overrides: Partial<NTHSChecklistItemPublic> = {}
): NTHSChecklistItemPublic => ({
  key: 'write-message',
  order: 1,
  title: 'Write your message',
  description: 'Tell your recruits why you are starting.',
  resources: [
    { label: 'Message template', url: 'https://example.com/template' },
  ],
  checkable: true,
  skippable: false,
  status: 'incomplete',
  ...overrides,
})

function card(itemProps: Partial<NTHSChecklistItemPublic> = {}) {
  return mount(DoThisNowCard, {
    props: { item: item(itemProps) },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 24, 12))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('DoThisNowCard', () => {
  it.each([
    { label: 'a future due date', dueDate: '2026-12-01T00:00:00', shown: true },
    { label: 'a due date today', dueDate: '2026-11-24T00:00:00', shown: true },
    { label: 'a past due date', dueDate: '2026-10-08T00:00:00', shown: false },
  ])(
    'shows the due date only when it is not past: $label',
    ({ dueDate, shown }) => {
      const wrapper = card({ dueDate })

      expect(wrapper.find('[data-testid="do-this-now-due"]').exists()).toBe(
        shown
      )
    }
  )

  it('renders no button when the task has no resource with a url', () => {
    const wrapper = card({
      dueDate: '2026-12-01T00:00:00',
      resources: [{ label: 'Label only' }],
    })

    expect(wrapper.find('[data-testid="do-this-now-button"]').exists()).toBe(
      false
    )
    expect(wrapper.find('[data-testid="do-this-now-due"]').exists()).toBe(true)
  })

  it('opens the resource link in a new tab', () => {
    const wrapper = card()
    const button = wrapper.get('[data-testid="do-this-now-button"]')

    expect(button.attributes('href')).toBe('https://example.com/template')
    expect(button.attributes('target')).toBe('_blank')
  })

  it('opens an app page in the same tab', () => {
    const wrapper = card({
      resources: [{ label: 'Members', url: '/groups/manage' }],
    })

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe(
      '/groups/manage'
    )
  })
})
