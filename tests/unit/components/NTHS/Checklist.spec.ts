import Checklist from '@/components/NTHS/Checklist.vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
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
  const store = createStore({
    modules: {
      nths: {
        namespaced: true,
        actions: {
          updateNTHSChecklistItemProgress: (_context, payload) =>
            update(payload),
        },
      },
    },
  })
  return {
    update,
    wrapper: mount(Checklist, {
      props: { groupId: GROUP_ID, checklist: checklistWith(item) },
      global: { plugins: [store] },
    }),
  }
}

describe('Checklist', () => {
  it('renders backend sections, descriptions, due dates and resources', () => {
    const { wrapper } = getWrapper()

    expect(wrapper.text()).toContain('Recruit')
    expect(wrapper.text()).toContain(ITEM.description)
    expect(wrapper.text()).toContain('Due')
    expect(
      wrapper
        .get('[data-testid="checklist-resource-invite-members"]')
        .attributes('href')
    ).toBe('https://example.com')
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

  it('excludes uncheckable items from progress and keeps informational sections open', async () => {
    const informationalItem = {
      ...ITEM,
      checkable: false,
      status: 'incomplete' as const,
    }
    const { wrapper } = getWrapper(informationalItem)

    expect(wrapper.text()).not.toContain('0 of 1 done')
    expect(wrapper.get('#checklist-section-1').exists()).toBe(true)
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
