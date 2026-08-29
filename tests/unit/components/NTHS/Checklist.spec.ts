import Checklist from '@/components/NTHS/Checklist.vue'
import LoggerService from '@/services/LoggerService'
import store from '@/store'
import Spinner from '@/components/Spinner.vue'
import NetworkService from '@/services/NetworkService'
import {
  CheckboxStatus,
  NTHS_ORIENTATION_URL,
  NTHS_RESOURCES_URL,
  type ChecklistItem,
} from '@/services/NTHSGroupService'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { createMemoryHistory, createRouter } from 'vue-router'

const GROUP_ID = 'group-123'

const NAME_ITEM: ChecklistItem = {
  text: 'Name your team',
  controlText: 'Edit in Settings',
  routeTo: '/groups/settings',
  status: CheckboxStatus.NotDone,
  actionId: 1,
  actionName: 'NAMED YOUR TEAM',
}

const RESOURCES_ITEM: ChecklistItem = {
  text: 'Review NTHS resources',
  controlText: 'View resources',
  url: NTHS_RESOURCES_URL,
  status: CheckboxStatus.NotDone,
  actionId: 2,
  actionName: 'REVIEWED RESOURCES',
}

const ORIENTATION_ITEM: ChecklistItem = {
  text: 'Complete orientation',
  controlText: 'Open orientation',
  url: NTHS_ORIENTATION_URL,
  status: CheckboxStatus.NotDone,
  actionId: 3,
  actionName: 'ATTENDED ORIENTATION',
}

const AFFILIATION_ITEM: ChecklistItem = {
  text: 'Choose your chapter type',
  controlText: 'Choose in Settings',
  routeTo: '/groups/settings',
  locked: true,
  lockedTooltip: 'Choose your chapter type in Settings and this ticks itself.',
  status: CheckboxStatus.NotDone,
  actionName: 'MARKED SCHOOL AFFILIATION IN PROGRESS',
}

const SPRINT_ITEM: ChecklistItem = {
  text: 'Complete the recruitment sprint',
  status: CheckboxStatus.NotDone,
  actionId: 5,
  actionName: 'RECRUITMENT SPRINT',
}

const ALL_ITEMS = [
  NAME_ITEM,
  RESOURCES_ITEM,
  ORIENTATION_ITEM,
  AFFILIATION_ITEM,
  SPRINT_ITEM,
]

const row = (actionName: string) =>
  `[data-testid="checklist-item-${actionName}"]`
const checkbox = (actionName: string) =>
  `[data-testid="checklist-checkbox-${actionName}"]`
const control = (actionName: string) =>
  `[data-testid="checklist-control-${actionName}"]`
const tooltip = (actionName: string) =>
  `[data-testid="checklist-tooltip-${actionName}"]`
const CARD_TITLE = '[data-testid="card-title"]'

const AFFILIATION = AFFILIATION_ITEM.actionName
const ORIENTATION = ORIENTATION_ITEM.actionName

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/groups/settings', component: { template: '<div />' } },
  ],
})

async function getWrapper(checklist: ChecklistItem[]) {
  await router.push('/')
  await router.isReady()
  // Real focus, hover and computed styles need the row in the document.
  return mount(Checklist, {
    props: { groupId: GROUP_ID, checklist },
    global: { plugins: [router] },
    attachTo: 'body',
  })
}

// The card heading sits above every row, clear of the anchors and the tooltip.
const parkPointer = (wrapper: VueWrapper) =>
  userEvent.hover(wrapper.find(CARD_TITLE).element, { force: true })

async function getLockedRow() {
  const wrapper = await getWrapper([AFFILIATION_ITEM])
  const input = wrapper.find(checkbox(AFFILIATION)).element as HTMLInputElement
  const tip = wrapper.find(tooltip(AFFILIATION)).element as HTMLElement
  // A row mounted under a resting pointer picks up a hover of its own.
  await parkPointer(wrapper)
  return {
    wrapper,
    input,
    tip,
    label: input.closest('label') as HTMLLabelElement,
    anchor: tip.parentElement as HTMLElement,
  }
}

// visibility is transitioned, so it reports the outgoing value for a frame either way.
const settle = (el: Element, state: 'visible' | 'hidden') =>
  vi.waitFor(() => expect(getComputedStyle(el).visibility).toBe(state))

describe('Checklist', () => {
  beforeEach(() => {
    NetworkService.createActionForNTHSGroup = vi
      .fn()
      .mockResolvedValue({ data: { action: {} } })
  })

  it('leaves every item label as plain text', async () => {
    const wrapper = await getWrapper(ALL_ITEMS)

    for (const item of ALL_ITEMS) {
      const label = wrapper.find(`${row(item.actionName)} label`)
      expect(label.text()).toBe(item.text)
      expect(label.find('a').exists()).toBe(false)
    }

    wrapper.unmount()
  })

  it.each([{ item: NAME_ITEM }, { item: AFFILIATION_ITEM }])(
    'sends $item.actionName to the settings tab in-app',
    async ({ item }) => {
      const wrapper = await getWrapper(ALL_ITEMS)

      const link = wrapper.find(control(item.actionName))
      expect(link.attributes('href')).toBe('/groups/settings')
      expect(link.attributes('target')).toBeUndefined()
      expect(link.attributes('rel')).toBeUndefined()

      wrapper.unmount()
    }
  )

  it.each([
    { item: RESOURCES_ITEM, url: NTHS_RESOURCES_URL },
    { item: ORIENTATION_ITEM, url: NTHS_ORIENTATION_URL },
  ])('opens $item.actionName in a new tab', async ({ item, url }) => {
    const wrapper = await getWrapper(ALL_ITEMS)

    const link = wrapper.find(control(item.actionName))
    expect(link.attributes('href')).toBe(url)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')

    wrapper.unmount()
  })

  it('gives the recruitment sprint no trailing control', async () => {
    const wrapper = await getWrapper(ALL_ITEMS)

    expect(wrapper.find(control('RECRUITMENT SPRINT')).exists()).toBe(false)
    expect(wrapper.find(`${row('RECRUITMENT SPRINT')} a`).exists()).toBe(false)

    wrapper.unmount()
  })

  it('names the locked checkbox after its item and describes it with the tooltip', async () => {
    const { wrapper, input } = await getLockedRow()

    await expect.element(input).toHaveAccessibleName('Choose your chapter type')
    await expect
      .element(input)
      .toHaveAccessibleDescription(
        'Choose your chapter type in Settings and this ticks itself.'
      )

    wrapper.unmount()
  })

  it('describes the locked checkbox with a tooltip', async () => {
    const { wrapper, input, tip } = await getLockedRow()

    expect(input.getAttribute('aria-describedby')).toBe(tip.id)
    expect(tip.getAttribute('role')).toBe('tooltip')
    // A native title attribute would double up with the tooltip on hover.
    expect(input.getAttribute('title')).toBeNull()

    wrapper.unmount()
  })

  it('keeps the tooltip out of the locked checkbox accessible name', async () => {
    const wrapper = await getWrapper([AFFILIATION_ITEM])

    expect(
      wrapper.find(`${row(AFFILIATION)} label [role="tooltip"]`).exists()
    ).toBe(false)

    wrapper.unmount()
  })

  it('keeps the locked checkbox in the tab order', async () => {
    const { wrapper, input } = await getLockedRow()

    expect(input.getAttribute('aria-disabled')).toBe('true')
    expect(input.disabled).toBe(false)
    ;(document.activeElement as HTMLElement | null)?.blur()
    await userEvent.tab()

    expect(document.activeElement).toBe(input)

    wrapper.unmount()
  })

  it('refuses a click on the locked checkbox', async () => {
    const { wrapper, input } = await getLockedRow()

    // Playwright treats aria-disabled as disabled and would wait out its
    // actionability check.
    await userEvent.click(input, { force: true })
    await flushPromises()

    expect(input.checked).toBe(false)
    expect(NetworkService.createActionForNTHSGroup).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('shows the tooltip on hover and on focus', async () => {
    const { wrapper, input, label, tip } = await getLockedRow()

    await settle(tip, 'hidden')

    input.focus()
    await settle(tip, 'visible')

    input.blur()
    await settle(tip, 'hidden')

    await userEvent.hover(label)
    await settle(tip, 'visible')

    await parkPointer(wrapper)
    await settle(tip, 'hidden')

    wrapper.unmount()
  })

  it('dismisses the tooltip on escape without moving focus', async () => {
    const { wrapper, input, tip } = await getLockedRow()

    input.focus()
    await settle(tip, 'visible')

    await userEvent.keyboard('{Escape}')
    await settle(tip, 'hidden')

    expect(document.activeElement).toBe(input)

    input.blur()
    input.focus()
    await settle(tip, 'visible')

    wrapper.unmount()
  })

  it('dismisses a hover-opened tooltip on escape while focus is elsewhere', async () => {
    const { wrapper, label, tip } = await getLockedRow()

    await userEvent.hover(label)
    await settle(tip, 'visible')
    expect(document.activeElement).toBe(document.body)

    await userEvent.keyboard('{Escape}')
    await settle(tip, 'hidden')

    wrapper.unmount()
  })

  it('leaves no dead zone between the locked row and its tooltip', async () => {
    const { wrapper, label, tip, anchor } = await getLockedRow()

    await userEvent.hover(label)
    await settle(tip, 'visible')

    const anchorBox = anchor.getBoundingClientRect()
    const gap = { x: 4, y: anchorBox.height + 2 }
    expect(
      document.elementFromPoint(anchorBox.left + gap.x, anchorBox.top + gap.y)
    ).toBe(tip)

    wrapper.unmount()
  })

  it('ticks the locked checkbox when the item is done', async () => {
    const wrapper = await getWrapper([
      { ...AFFILIATION_ITEM, status: CheckboxStatus.Done },
    ])

    expect(wrapper.find(checkbox(AFFILIATION)).element.checked).toBe(true)

    wrapper.unmount()
  })

  it('logs a failed toggle and clears the saving state', async () => {
    vi.mocked(NetworkService.createActionForNTHSGroup).mockRejectedValue(
      new Error('save failed')
    )
    const noticeError = vi
      .spyOn(LoggerService, 'noticeError')
      .mockImplementation(() => {})
    const dispatch = vi.spyOn(store, 'dispatch')
    const wrapper = await getWrapper([ORIENTATION_ITEM])

    await wrapper.find(checkbox(ORIENTATION)).trigger('input')
    await flushPromises()

    expect(noticeError).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith(
      'nths/removeFromChecksInFlight',
      ORIENTATION_ITEM.actionId
    )

    noticeError.mockRestore()
    dispatch.mockRestore()
    wrapper.unmount()
  })

  it('still toggles an unlocked item', async () => {
    const wrapper = await getWrapper(ALL_ITEMS)

    await wrapper.find(checkbox(ORIENTATION)).trigger('input')
    await flushPromises()

    expect(NetworkService.createActionForNTHSGroup).toHaveBeenCalledWith(
      GROUP_ID,
      ORIENTATION
    )

    wrapper.unmount()
  })

  it('swaps the checkbox for a spinner while saving', async () => {
    const wrapper = await getWrapper([
      { ...ORIENTATION_ITEM, status: CheckboxStatus.Saving },
    ])

    expect(wrapper.find(checkbox(ORIENTATION)).exists()).toBe(false)
    expect(wrapper.findComponent(Spinner).exists()).toBe(true)

    wrapper.unmount()
  })
})
