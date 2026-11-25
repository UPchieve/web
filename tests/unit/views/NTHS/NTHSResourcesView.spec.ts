import type { NTHSResources } from '@upchieve/api-contracts/nths-groups'
import { useNthsStore } from '@/stores/nths'
import NTHSResourcesView from '@/views/NTHS/Tabs/NTHSResourcesView.vue'
import {
  enableAutoUnmount,
  flushPromises,
  mount,
  RouterLinkStub,
} from '@vue/test-utils'
import { createStore } from 'vuex'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getNTHSResources = vi.fn()
vi.mock('@/services/NetworkService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/NetworkService')>()),
  getNTHSResources: (groupId: string) => getNTHSResources(groupId),
}))

const RESPONSE: NTHSResources = {
  groups: [
    {
      title: 'Recruit',
      subtitle: 'Grow the chapter',
      icon: 'megaphone',
      cards: [
        { title: 'Invite', body: '', link: '/dashboard', icon: 'user-plus' },
        {
          title: 'Templates',
          body: 'Emails',
          link: 'https://nationaltutor.org/t',
          icon: 'document',
        },
      ],
    },
    {
      title: 'Plan',
      subtitle: '',
      icon: 'calendar',
      cards: [{ title: 'Agenda', body: '', link: '/plan', icon: 'calendar' }],
    },
  ],
}

async function render({ mobileMode = false } = {}) {
  const wrapper = mount(NTHSResourcesView, {
    global: {
      stubs: { RouterLink: RouterLinkStub },
      plugins: [
        createStore({
          modules: {
            app: {
              namespaced: true,
              getters: { mobileMode: () => mobileMode },
            },
          },
        }),
      ],
    },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  useNthsStore().NTHSGroups = [{ groupInfo: { id: 'group-123' } }]
})
enableAutoUnmount(afterEach)

describe('NTHSResourcesView', () => {
  it('opens an app path in the same tab and any other link in a new tab', async () => {
    getNTHSResources.mockResolvedValue(RESPONSE)
    const [appTile, externalTile] = (await render()).findAll(
      '[data-testid="resource-tile"]'
    )
    expect(appTile.findComponent(RouterLinkStub).props('to')).toBe('/dashboard')
    expect(appTile.text()).not.toContain('(opens in a new tab)')
    expect(externalTile.attributes('target')).toBe('_blank')
    expect(externalTile.text()).toContain('(opens in a new tab)')
  })

  it.each([
    ['desktop', false, [true, true]],
    ['mobile', true, [true, false]],
  ])(
    'shows tiles for the expected groups on %s',
    async (_name, mobileMode, expectedOpen) => {
      getNTHSResources.mockResolvedValue(RESPONSE)
      const groups = (await render({ mobileMode })).findAll(
        '[data-testid="resource-group"]'
      )
      expect(
        groups.map((g) => g.find('[data-testid="resource-tile"]').exists())
      ).toEqual(expectedOpen)
    }
  )

  it('toggles a band on mobile', async () => {
    getNTHSResources.mockResolvedValue(RESPONSE)
    const wrapper = await render({ mobileMode: true })
    const [first, second] = wrapper.findAll('button.band')
    expect(second.attributes('aria-expanded')).toBe('false')

    await second.trigger('click')
    expect(second.attributes('aria-expanded')).toBe('true')
    expect(wrapper.findAll('[data-testid="resource-tile"]')).toHaveLength(3)

    await first.trigger('click')
    expect(first.attributes('aria-expanded')).toBe('false')
  })

  it('shows no fallback link before the request settles', async () => {
    getNTHSResources.mockReturnValue(new Promise(() => {}))
    const wrapper = await render()
    expect(wrapper.find('[data-testid="resources-fallback"]').exists()).toBe(
      false
    )
  })

  it.each([
    [
      'an empty groups response',
      () => getNTHSResources.mockResolvedValue({ groups: [] }),
    ],
    [
      'a rejected request',
      () => getNTHSResources.mockRejectedValue(new Error('x')),
    ],
  ])('links to the resource library on %s', async (_name, arrange) => {
    arrange()
    const wrapper = await render()
    const link = wrapper.find('[data-testid="resources-fallback-link"]')
    expect(link.attributes('href')).toBe('https://nationaltutor.org/resources')
    expect(link.attributes('target')).toBe('_blank')
  })
})
