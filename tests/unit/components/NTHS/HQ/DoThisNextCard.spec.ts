import DoThisNextCard from '@/components/NTHS/HQ/DoThisNextCard.vue'
import LoggerService from '@/services/LoggerService'
import {
  checklistControls,
  NTHS_ORIENTATION_URL,
  NTHS_SETUP_ROUTE,
  type AffiliationStatus,
  type NTHSActionName,
} from '@/services/NTHSGroupService'
import nths from '@/store/modules/nths'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { userEvent } from '@vitest/browser/context'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createStore } from 'vuex'

// toggleCheckbox dispatches to the app's store module, so route it to the
// store under test.
vi.mock('@/store', () => ({
  default: {
    dispatch: (type: string, payload: unknown) => store.dispatch(type, payload),
  },
}))

const getActionsForNTHSGroup = vi.fn()
const createActionForNTHSGroup = vi.fn()
vi.mock('@/services/NetworkService', () => ({
  default: {
    getActionsForNTHSGroup: (groupId: string) =>
      getActionsForNTHSGroup(groupId),
    createActionForNTHSGroup: (groupId: string, action: NTHSActionName) =>
      createActionForNTHSGroup(groupId, action),
  },
}))

const GROUP_ID = 'group-123'

const ACTIONS: { id: number; name: NTHSActionName }[] = [
  { id: 1, name: 'NAMED YOUR TEAM' },
  { id: 2, name: 'REVIEWED RESOURCES' },
  { id: 3, name: 'ATTENDED ORIENTATION' },
  { id: 4, name: 'MARKED SCHOOL AFFILIATION IN PROGRESS' },
  { id: 5, name: 'RECRUITMENT SPRINT' },
]

const ORIENTATION = 'ATTENDED ORIENTATION'
const NAME = 'NAMED YOUR TEAM'
const RESOURCES = 'REVIEWED RESOURCES'
const CHAPTER_TYPE = 'MARKED SCHOOL AFFILIATION IN PROGRESS'
const SPRINT = 'RECRUITMENT SPRINT'

const groupAction = (actionName: NTHSActionName) => ({
  id: 100 + ACTIONS.findIndex(({ name }) => name === actionName),
  groupId: GROUP_ID,
  actionId: ACTIONS.find(({ name }) => name === actionName)!.id,
  actionName,
  createdAt: '2026-09-01T00:00:00.000Z',
})

const controlFor = (actionName: NTHSActionName) =>
  checklistControls.find(({ action }) => action === actionName)!

function respondWithDone(...done: NTHSActionName[]) {
  getActionsForNTHSGroup.mockResolvedValue({
    data: {
      groupId: GROUP_ID,
      actions: ACTIONS,
      groupActions: done.map(groupAction),
    },
  })
}

function makeStore(schoolAffiliationStatus: AffiliationStatus | null) {
  return createStore({
    modules: {
      nths: {
        ...nths,
        state: () => ({
          ...nths.state,
          NTHSGroups: [
            {
              groupInfo: { id: GROUP_ID },
              memberInfo: { roleName: 'admin' },
              schoolAffiliationStatus,
            },
          ],
        }),
      },
    },
  })
}
let store: ReturnType<typeof makeStore>

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: NTHS_SETUP_ROUTE, component: { template: '<div />' } },
    { path: '/groups/to-do', component: { template: '<div />' } },
  ],
})

const CARD = '[data-testid="do-this-next"]'
const TITLE = '[data-testid="do-this-next-title"]'
const HELP = '[data-testid="do-this-next-help"]'
const RESOURCE = '[data-testid="do-this-next-resource"]'
const MARK_DONE = '[data-testid="do-this-next-mark-done"]'
const TO_DO = '[data-testid="do-this-next-to-do"]'
const STATUS = '[data-testid="do-this-next-status"]'

enableAutoUnmount(afterEach)

async function getWrapper({
  schoolAffiliationStatus = null,
}: { schoolAffiliationStatus?: AffiliationStatus | null } = {}) {
  store = makeStore(schoolAffiliationStatus)
  await router.push('/')
  await router.isReady()
  // Focus only moves between elements in the document.
  const wrapper = mount(DoThisNextCard, {
    props: { groupId: GROUP_ID },
    global: { plugins: [store, router] },
    attachTo: 'body',
  })
  await flushPromises()
  return wrapper
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

beforeEach(() => {
  getActionsForNTHSGroup.mockReset()
  createActionForNTHSGroup.mockReset()
  respondWithDone()
  createActionForNTHSGroup.mockImplementation(
    async (groupId: string, action: NTHSActionName) => ({
      data: { groupId, action: groupAction(action) },
    })
  )
  vi.spyOn(LoggerService, 'noticeError').mockImplementation(() => {})
})

afterEach(() => vi.restoreAllMocks())

describe('DoThisNextCard', () => {
  it('shows the first item that is not done, in checklist order', async () => {
    respondWithDone(ORIENTATION, RESOURCES)
    const wrapper = await getWrapper()

    expect(getActionsForNTHSGroup).toHaveBeenCalledWith(GROUP_ID)
    expect(wrapper.find(TITLE).text()).toBe(controlFor(NAME).text)
    expect(wrapper.find(HELP).text()).toBe(controlFor(NAME).help)
    expect(wrapper.find(TO_DO).attributes('href')).toBe('/groups/to-do')
  })

  it('shows the chapter type item, with no Mark as done, until the chapter has chosen a path', async () => {
    respondWithDone(ORIENTATION, NAME, RESOURCES)

    const wrapper = await getWrapper()
    expect(wrapper.find(TITLE).text()).toBe(controlFor(CHAPTER_TYPE).text)
    expect(wrapper.find(MARK_DONE).exists()).toBe(false)
  })

  it.each([
    {
      kind: 'a nationaltutor.org resource, in a new tab',
      done: [],
      affiliation: null,
      href: NTHS_ORIENTATION_URL,
      target: '_blank',
    },
    {
      kind: 'an in-app page',
      done: [ORIENTATION],
      affiliation: null,
      href: NTHS_SETUP_ROUTE,
      target: undefined,
    },
  ] as const)('links $kind', async ({ done, affiliation, href, target }) => {
    respondWithDone(...done)
    const wrapper = await getWrapper({ schoolAffiliationStatus: affiliation })
    const link = wrapper.find(RESOURCE)

    expect(link.attributes('href')).toBe(href)
    expect(link.attributes('target')).toBe(target)
    if (target) expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  it('records the item, announces it and moves focus to the next item', async () => {
    const wrapper = await getWrapper()

    ;(wrapper.find(MARK_DONE).element as HTMLButtonElement).focus()
    await userEvent.keyboard('{Enter}')

    expect(createActionForNTHSGroup).toHaveBeenCalledWith(GROUP_ID, ORIENTATION)
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(wrapper.find(TITLE).element)
    )
    expect(wrapper.find(TITLE).text()).toBe(controlFor(NAME).text)
    expect(wrapper.find(RESOURCE).attributes('href')).toBe(NTHS_SETUP_ROUTE)
    expect(wrapper.find(STATUS).text()).toContain(controlFor(ORIENTATION).text)
  })

  it('ignores further presses while saving', async () => {
    const save = deferred<unknown>()
    createActionForNTHSGroup.mockReturnValue(save.promise)
    const wrapper = await getWrapper()
    const button = wrapper.find(MARK_DONE).element as HTMLButtonElement

    await userEvent.click(button)
    await flushPromises()
    expect(button.getAttribute('aria-disabled')).toBe('true')
    // Playwright treats aria-disabled as disabled and would wait out its
    // actionability check.
    await userEvent.click(button, { force: true })
    await flushPromises()

    save.resolve({ data: { action: groupAction(ORIENTATION) } })
    await vi.waitFor(() =>
      expect(wrapper.find(TITLE).text()).toBe(controlFor(NAME).text)
    )
    expect(createActionForNTHSGroup).toHaveBeenCalledTimes(1)
  })

  it('keeps the item and explains when saving fails, then lets the president try again', async () => {
    const boom = new Error('save failed')
    createActionForNTHSGroup.mockRejectedValueOnce(boom)
    const wrapper = await getWrapper()
    const button = wrapper.find(MARK_DONE).element as HTMLButtonElement

    await userEvent.click(button)
    await flushPromises()

    expect(wrapper.find(TITLE).text()).toBe(controlFor(ORIENTATION).text)
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(LoggerService.noticeError).toHaveBeenCalledWith(boom)
    expect(button.getAttribute('aria-disabled')).toBeNull()
    expect(document.activeElement).toBe(button)

    await userEvent.click(button)
    await vi.waitFor(() =>
      expect(wrapper.find(TITLE).text()).toBe(controlFor(NAME).text)
    )
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('leaves and emits finished once the last item is done', async () => {
    respondWithDone(ORIENTATION, NAME, RESOURCES)
    const wrapper = await getWrapper({ schoolAffiliationStatus: 'AFFILIATED' })

    await userEvent.click(wrapper.find(MARK_DONE).element)

    await vi.waitFor(() => expect(wrapper.emitted('finished')).toHaveLength(1))
    expect(wrapper.find(CARD).exists()).toBe(false)
    expect(wrapper.find(STATUS).text()).toContain(controlFor(SPRINT).text)
  })

  it.each([
    {
      state: 'every item is already done',
      respond: () => respondWithDone(ORIENTATION, NAME, RESOURCES, SPRINT),
    },
    {
      state: 'the checklist fails to load',
      respond: () =>
        getActionsForNTHSGroup.mockRejectedValue(new Error('load failed')),
    },
    {
      state: 'the checklist is loading',
      respond: () =>
        getActionsForNTHSGroup.mockReturnValue(new Promise(() => {})),
    },
  ])('stays hidden when $state', async ({ respond }) => {
    respond()
    const wrapper = await getWrapper({ schoolAffiliationStatus: 'AFFILIATED' })

    expect(wrapper.find(CARD).exists()).toBe(false)
    expect(wrapper.emitted('finished')).toBeUndefined()
  })
})
