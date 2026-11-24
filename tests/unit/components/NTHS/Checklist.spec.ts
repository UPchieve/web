import Checklist from '@/components/NTHS/Checklist.vue'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { useNthsStore } from '@/stores/nths'
import type {
  NTHSChecklistItemPublic,
  NTHSChecklistPublic,
} from '@upchieve/api-contracts/nths-checklist'

const GROUP_ID = 'group-123'
const ITEM: NTHSChecklistItemPublic = {
  key: 'invite-members',
  order: 1,
  title: 'Invite members',
  description: 'Invite at least three members.',
  dueDate: '2026-10-30T00:00:00.000Z',
  resources: [{ label: 'Recruitment guide', url: 'https://example.com' }],
  checkable: true,
  skippable: true,
  status: 'incomplete',
}

const checklistWith = (item: NTHSChecklistItemPublic): NTHSChecklistPublic => ({
  sections: [{ id: 1, title: 'Recruit', order: 1, items: [item] }],
})

const secondItem: NTHSChecklistItemPublic = {
  ...ITEM,
  key: 'plan-kickoff',
  title: 'Plan kickoff',
}

function getWrapper(item = ITEM) {
  const update = vi.fn().mockResolvedValue(undefined)
  vi.spyOn(
    useNthsStore(),
    'updateNTHSChecklistItemProgress'
  ).mockImplementation(update)
  return {
    update,
    wrapper: mount(Checklist, {
      props: { groupId: GROUP_ID, checklist: checklistWith(item) },
      global: { stubs: { RouterLink: RouterLinkStub } },
    }),
  }
}

describe('Checklist', () => {
  it('renders sections, descriptions and resource links without a row due date', () => {
    const { wrapper } = getWrapper()

    expect(wrapper.text()).toContain('Recruit')
    expect(wrapper.text()).toContain(ITEM.description)
    expect(wrapper.text()).not.toContain('Due')
    expect(wrapper.text()).not.toContain('Resources:')
    expect(
      wrapper.get('[data-testid="checklist-resource-invite-members"]').text()
    ).toContain('Recruitment guide')
    expect(
      wrapper
        .get('[data-testid="checklist-resource-invite-members"]')
        .attributes('href')
    ).toBe('https://example.com')
  })

  it('opens an app page in the same tab and an outside link in a new tab', () => {
    const { wrapper } = getWrapper({
      ...ITEM,
      resources: [
        { label: 'Members', url: '/groups/manage' },
        { label: 'Recruitment guide', url: 'https://example.com' },
      ],
    })

    const [appLink, outsideLink] = wrapper.findAll(
      '[data-testid="checklist-resource-invite-members"]'
    )
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toBe(
      '/groups/manage'
    )
    expect(appLink.attributes('target')).toBeUndefined()
    expect(outsideLink.attributes('href')).toBe('https://example.com')
    expect(outsideLink.attributes('target')).toBe('_blank')
  })

  it('toggles sections independently', async () => {
    const { wrapper } = getWrapper()
    await wrapper.setProps({
      checklist: {
        sections: [
          ...checklistWith(ITEM).sections,
          { id: 2, title: 'Launch', order: 2, items: [secondItem] },
        ],
      },
    })

    await wrapper
      .get('[data-testid="checklist-section-toggle-1"]')
      .trigger('click')

    expect(wrapper.find('#checklist-section-1').exists()).toBe(false)
    expect(wrapper.get('#checklist-section-2').exists()).toBe(true)
  })

  it('starts completed sections collapsed but allows them to be reopened', async () => {
    const { wrapper } = getWrapper({ ...ITEM, status: 'complete' })
    const toggle = wrapper.get('[data-testid="checklist-section-toggle-1"]')

    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('#checklist-section-1').exists()).toBe(false)

    await toggle.trigger('click')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('#checklist-section-1').exists()).toBe(true)
  })

  it('does not collapse an open section when its final item is completed', async () => {
    const { wrapper } = getWrapper()

    await wrapper.setProps({
      checklist: checklistWith({ ...ITEM, status: 'complete' }),
    })

    expect(wrapper.get('#checklist-section-1').exists()).toBe(true)
  })

  it('shows the timeframe, intro and counts of each section head', () => {
    const info = { ...secondItem, checkable: false }
    const wrapper = mount(Checklist, {
      props: {
        groupId: GROUP_ID,
        checklist: {
          sections: [
            {
              id: 1,
              title: 'Recruit',
              order: 1,
              timeframe: 'Weeks 1-3',
              intro: 'Find your people.',
              items: [ITEM],
            },
            { id: 2, title: 'Habits', order: 2, items: [info] },
          ],
        },
      },
    })

    expect(wrapper.text()).toContain('Weeks 1-3')
    expect(wrapper.text()).toContain('Find your people.')
    expect(wrapper.text()).toContain('0 of 1 done')
    expect(wrapper.text()).toContain('1 left')
    expect(wrapper.text()).not.toContain('0 of 0')
  })

  it('counts only checkable items in mixed sections', async () => {
    const { wrapper } = getWrapper()
    await wrapper.setProps({
      checklist: {
        sections: [
          {
            id: 1,
            title: 'Recruit',
            order: 1,
            items: [ITEM, { ...secondItem, checkable: false }],
          },
        ],
      },
    })

    expect(wrapper.text()).toContain('0 of 1 done')
  })

  it.each([
    { current: 'incomplete', expected: 'complete' },
    { current: 'complete', expected: 'incomplete' },
  ] as const)(
    'changes $current items to $expected',
    async ({ current, expected }) => {
      const { wrapper, update } = getWrapper({ ...ITEM, status: current })
      if (current === 'complete')
        await wrapper
          .get('[data-testid="checklist-section-toggle-1"]')
          .trigger('click')

      await wrapper
        .get('[data-testid="checklist-checkbox-invite-members"]')
        .trigger('change')
      await flushPromises()

      expect(update).toHaveBeenCalledWith({
        groupId: GROUP_ID,
        itemKey: ITEM.key,
        status: expected,
      })
    }
  )

  it.each([
    { current: 'incomplete', expected: 'skipped' },
    { current: 'skipped', expected: 'incomplete' },
  ] as const)(
    'changes $current items to $expected from the skip control',
    async ({ current, expected }) => {
      const { wrapper, update } = getWrapper({ ...ITEM, status: current })
      if (current === 'skipped')
        await wrapper
          .get('[data-testid="checklist-section-toggle-1"]')
          .trigger('click')

      await wrapper
        .get('[data-testid="checklist-skip-invite-members"]')
        .trigger('click')
      await flushPromises()

      expect(update).toHaveBeenCalledWith({
        groupId: GROUP_ID,
        itemKey: ITEM.key,
        status: expected,
      })
    }
  )
})
