import DoThisNextCard from '@/components/NTHS/HQ/DoThisNextCard.vue'
import nths from '@/store/modules/nths'
import NetworkService from '@/services/NetworkService'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createStore } from 'vuex'
import type { NTHSChecklistPublic } from '@upchieve/api-contracts/nths-checklist'

vi.mock('@/store', () => ({ default: { dispatch: vi.fn() } }))
vi.mock('@/services/NetworkService')

const GROUP_ID = 'group-123'
const CHECKLIST: NTHSChecklistPublic = {
  sections: [
    {
      id: 1,
      title: 'Get started',
      order: 1,
      items: [
        {
          key: 'already-skipped',
          order: 1,
          title: 'Already skipped',
          resources: [],
          checkable: true,
          skippable: true,
          status: 'skipped',
        },
        {
          key: 'invite-members',
          order: 2,
          title: 'Invite members',
          description: 'Invite at least three members.',
          resources: [],
          checkable: true,
          skippable: true,
          status: 'incomplete',
        },
      ],
    },
  ],
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/groups/to-do', component: { template: '<div />' } },
  ],
})

async function getWrapper(
  existingChecklist: NTHSChecklistPublic | null = null
) {
  const store = createStore({
    modules: {
      nths: {
        ...nths,
        state: {
          ...nths.state,
          NTHSChecklistData: existingChecklist,
        },
      },
    },
  })
  await router.push('/')
  await router.isReady()
  const wrapper = mount(DoThisNextCard, {
    props: { groupId: GROUP_ID },
    global: { plugins: [store, router] },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.mocked(NetworkService.getNTHSChecklist).mockResolvedValue({
    checklist: structuredClone(CHECKLIST),
  })
  vi.mocked(NetworkService.updateNTHSChecklistItemProgress).mockImplementation(
    async (_groupId, itemKey, { status }) => ({ itemKey, status })
  )
})

afterEach(() => vi.clearAllMocks())

describe('DoThisNextCard', () => {
  it('shows the first incomplete item and ignores skipped items', async () => {
    const wrapper = await getWrapper()

    expect(NetworkService.getNTHSChecklist).toHaveBeenCalledWith(GROUP_ID)
    expect(wrapper.get('[data-testid="do-this-next-title"]').text()).toBe(
      'Invite members'
    )
  })

  it('reuses a checklist that is already in Vuex', async () => {
    const wrapper = await getWrapper(structuredClone(CHECKLIST))

    expect(NetworkService.getNTHSChecklist).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="do-this-next-title"]').text()).toBe(
      'Invite members'
    )
  })

  it('renders multiple resources as secondary links', async () => {
    const checklist = structuredClone(CHECKLIST)
    checklist.sections[0].items[1].resources = [
      { label: 'Chapter Setup', url: 'https://example.com/setup' },
      { label: 'Orientation guide', url: 'https://example.com/orientation' },
    ]

    const wrapper = await getWrapper(checklist)
    const resources = wrapper.findAll('[data-testid="do-this-next-resource"]')

    expect(resources).toHaveLength(2)
    expect(resources.map((resource) => resource.text())).toEqual([
      'Chapter Setup ↗',
      'Orientation guide ↗',
    ])
    expect(resources.map((resource) => resource.attributes('href'))).toEqual([
      'https://example.com/setup',
      'https://example.com/orientation',
    ])
  })

  it('ignores informational items that cannot be completed or skipped', async () => {
    const checklist = structuredClone(CHECKLIST)
    checklist.sections[0].items = [
      {
        key: 'informational-item',
        order: 1,
        title: 'Keep tutoring',
        resources: [],
        checkable: false,
        skippable: false,
        status: 'incomplete',
      },
    ]

    const wrapper = await getWrapper(checklist)

    expect(wrapper.find('[data-testid="do-this-next"]').exists()).toBe(false)
  })

  it('keeps the current item visible and reports an update failure', async () => {
    vi.mocked(
      NetworkService.updateNTHSChecklistItemProgress
    ).mockRejectedValueOnce(new Error('save failed'))
    const wrapper = await getWrapper(structuredClone(CHECKLIST))

    await wrapper.get('[data-testid="do-this-next-mark-done"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="do-this-next-title"]').text()).toBe(
      'Invite members'
    )
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Something went wrong while saving'
    )
  })

  it.each([
    { control: 'do-this-next-mark-done', status: 'complete' },
    { control: 'do-this-next-skip', status: 'skipped' },
  ] as const)(
    'saves $status and finishes the checklist',
    async ({ control, status }) => {
      const wrapper = await getWrapper()

      await wrapper.get(`[data-testid="${control}"]`).trigger('click')
      await flushPromises()

      expect(
        NetworkService.updateNTHSChecklistItemProgress
      ).toHaveBeenCalledWith(GROUP_ID, 'invite-members', { status })
      expect(wrapper.emitted('finished')).toHaveLength(1)
    }
  )
})
