import RosterRowMenu from '@/components/NTHS/Members/RosterRowMenu.vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { member } from '../../../fixtures/nths'

const MEMBER = member({ userId: 'sam', firstName: 'Sam', lastInitial: 'Q' })

enableAutoUnmount(afterEach)

describe('RosterRowMenu', () => {
  const TRIGGER = `[data-testid="member-actions-${MEMBER.userId}"]`

  it('points aria-controls at the open popover id, and at nothing while closed', async () => {
    const closed = mount(RosterRowMenu, {
      props: { member: MEMBER, open: false },
    })
    expect(closed.find(TRIGGER).attributes('aria-controls')).toBeUndefined()

    const wrapper = mount(RosterRowMenu, {
      props: { member: MEMBER, open: true },
    })
    await flushPromises()

    const controlsId = wrapper.find(TRIGGER).attributes('aria-controls')
    expect(controlsId).toBe(`member-menu-${MEMBER.userId}`)
    expect(wrapper.find(`#${controlsId}`).exists()).toBe(true)
  })

  it('does not emit toggle from a trigger click while busy', async () => {
    const wrapper = mount(RosterRowMenu, {
      props: { member: MEMBER, open: false, busy: true },
    })

    await wrapper.find(TRIGGER).trigger('click')

    expect(wrapper.emitted('toggle')).toBeUndefined()
  })

  describe('row actions', () => {
    it.each([
      ['member', 'member-make-admin', 'admin'],
      ['admin', 'member-remove-admin', 'member'],
    ] as const)(
      'a %s row emits changeRole %s from its role action and returns focus to the trigger',
      async (roleName, testidPrefix, nextRole) => {
        const wrapper = mount(RosterRowMenu, {
          props: { member: { ...MEMBER, roleName }, open: true },
          attachTo: document.body,
        })
        await flushPromises()

        await wrapper
          .find(`[data-testid="${testidPrefix}-${MEMBER.userId}"]`)
          .trigger('click')

        expect(wrapper.emitted('changeRole')?.[0]).toEqual([nextRole])
        expect(document.activeElement).toBe(wrapper.find(TRIGGER).element)
      }
    )

    it.each(['member', 'admin'] as const)(
      'a closed-account %s row offers only Remove, focused on open',
      async (roleName) => {
        const wrapper = mount(RosterRowMenu, {
          props: {
            member: { ...MEMBER, roleName, accountClosed: true },
            open: true,
          },
          attachTo: document.body,
        })
        await flushPromises()

        const items = wrapper.findAll('[role="menuitem"]')
        expect(items.map((item) => item.attributes('data-testid'))).toEqual([
          `member-remove-${MEMBER.userId}`,
        ])
        expect(document.activeElement).toBe(items[0].element)
      }
    )

    it('emits remove from the Remove action and returns focus to the trigger', async () => {
      const wrapper = mount(RosterRowMenu, {
        props: { member: MEMBER, open: true },
        attachTo: document.body,
      })
      await flushPromises()

      await wrapper
        .find(`[data-testid="member-remove-${MEMBER.userId}"]`)
        .trigger('click')

      expect(wrapper.emitted('remove')).toHaveLength(1)
      expect(document.activeElement).toBe(wrapper.find(TRIGGER).element)
    })
  })

  describe('keyboard behaviour', () => {
    // The document click/keydown listeners this relies on only fire for
    // events dispatched inside the live document, so mount there directly.
    async function openMenu() {
      const wrapper = mount(RosterRowMenu, {
        props: { member: MEMBER, open: true },
        attachTo: document.body,
      })
      await flushPromises()
      return wrapper
    }

    function items(wrapper: Awaited<ReturnType<typeof openMenu>>) {
      return wrapper.findAll('[role="menuitem"]').map((w) => w.element)
    }

    it.each([
      ['ArrowDown moves to the next item', ['ArrowDown'], 1],
      [
        'ArrowDown wraps back to the first from the last',
        ['End', 'ArrowDown'],
        0,
      ],
      ['ArrowUp wraps to the last item from the first', ['ArrowUp'], -1],
      ['End focuses the last item', ['End'], -1],
      ['Home focuses the first item after moving away', ['End', 'Home'], 0],
    ] as const)('%s', async (_label, keys, expectedIndex) => {
      const wrapper = await openMenu()
      const menuItems = items(wrapper)

      for (const key of keys) {
        await wrapper.trigger('keydown', { key })
      }

      expect(document.activeElement).toBe(menuItems.at(expectedIndex))
    })

    it('closes on Escape and returns focus to the trigger', async () => {
      const wrapper = await openMenu()

      await wrapper.trigger('keydown', { key: 'Escape' })

      expect(wrapper.emitted('close')).toHaveLength(1)
      expect(document.activeElement).toBe(wrapper.find(TRIGGER).element)
    })

    it('closes on Tab, since the menu items are not tab-reachable', async () => {
      const wrapper = await openMenu()

      await wrapper.trigger('keydown', { key: 'Tab' })

      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('emits close on a document click outside the menu', async () => {
      const wrapper = await openMenu()

      document.body.click()

      expect(wrapper.emitted('close')).toHaveLength(1)
    })
  })
})
