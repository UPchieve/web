import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import NetworkService from '@/services/NetworkService'
import ModalService from '@/services/ModalService'
import RenewalBanner from '@/components/NTHS/Renewal/RenewalBanner.vue'
import { NTHS_COMMITMENTS } from '@/services/NTHSApplicationService'
import type {
  NTHSRenewalCommitments,
  NTHSRenewalPrompt,
  NTHSRenewalPublic,
} from '@/services/NTHSGroupService'

vi.mock('@/services/NetworkService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/NetworkService')>()),
  default: {
    acceptNTHSRenewalPresidency: vi.fn(),
  },
}))
vi.mock('@ionic/vue', () => ({
  toastController: { create: vi.fn(async () => ({ present: vi.fn() })) },
}))

const COMMITMENTS = Object.fromEntries(
  NTHS_COMMITMENTS.map(({ key }) => [key, true])
) as NTHSRenewalCommitments
const nthsModule = (storeOptions.modules as any).nths
const BASE_RENEWAL: NTHSRenewalPublic = {
  prompt: 'none',
  closesOn: '2027-09-30',
  successorConfirmationOn: '2027-08-01',
}

const refreshNTHSGroups = vi.fn()

async function mountBanner(
  prompt: NTHSRenewalPrompt,
  groupId = 'group-1',
  closesOn = '2027-09-30',
  userId = 'user-1'
) {
  const store = createStore<any>({
    modules: {
      ...storeOptions.modules,
      user: {
        ...(storeOptions.modules as any).user,
        state: {
          ...(storeOptions.modules as any).user.state,
          user: { id: userId },
        },
      },
      nths: {
        ...nthsModule,
        state: {
          ...nthsModule.state,
          NTHSGroups: [
            {
              groupInfo: { id: groupId, name: 'Lincoln High NTHS' },
              memberInfo: { roleName: 'admin' },
              renewal: { ...BASE_RENEWAL, prompt, closesOn },
            },
          ],
        },
        actions: {
          ...nthsModule.actions,
          fetchNthsData: vi.fn(),
          refreshNTHSGroups,
        },
      },
    },
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['/groups/home', '/groups/members'].map((path) => ({
      path,
      component: { render: () => h('div') },
    })),
  })
  await router.push('/groups/home')
  const wrapper = mount(RenewalBanner, {
    props: { groupId },
    global: { plugins: [store, router] },
  })
  await flushPromises()
  return { wrapper, router }
}

type Wrapper = Awaited<ReturnType<typeof mountBanner>>['wrapper']
const has = (wrapper: Wrapper, id: string) =>
  wrapper.find(`[data-testid="${id}"]`).exists()
async function click(wrapper: Wrapper, id: string) {
  await wrapper.get(`[data-testid="${id}"]`).trigger('click')
  await flushPromises()
}

describe('RenewalBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    refreshNTHSGroups.mockReset()
    localStorage.clear()
    vi.mocked(NetworkService.acceptNTHSRenewalPresidency).mockResolvedValue({
      renewal: { ...BASE_RENEWAL, prompt: 'none' },
      outcome: 'accepted',
    })
  })

  it.each<{
    prompt: NTHSRenewalPrompt
    primary: 'members' | 'accept' | null
    secondary: 'members' | 'dismiss' | null
  }>([
    { prompt: 'none', primary: null, secondary: null },
    { prompt: 'handoff-banner', primary: 'members', secondary: 'dismiss' },
    { prompt: 'confirm-return', primary: 'accept', secondary: 'members' },
    { prompt: 'confirm-reminder', primary: 'members', secondary: null },
    { prompt: 'president-not-cleared', primary: null, secondary: null },
    { prompt: 'member-not-cleared', primary: null, secondary: null },
    { prompt: 'member-countdown', primary: 'accept', secondary: null },
    { prompt: 'step-up', primary: 'accept', secondary: null },
  ])(
    'on $prompt offers primary $primary and secondary $secondary',
    async ({ prompt, primary, secondary }) => {
      vi.spyOn(ModalService, 'showNthsAcceptPresidency').mockResolvedValue(
        undefined
      )
      const { wrapper } = await mountBanner(prompt)

      expect(has(wrapper, 'renewal-banner')).toBe(!!primary)
      expect(has(wrapper, 'renewal-banner-primary')).toBe(!!primary)
      expect(has(wrapper, 'renewal-banner-secondary')).toBe(!!secondary)
    }
  )

  it.each([
    { prompt: 'handoff-banner', shown: false },
    { prompt: 'confirm-return', shown: false },
    { prompt: 'confirm-reminder', shown: false },
    { prompt: 'step-up', shown: true },
    { prompt: 'member-countdown', shown: true },
  ] as const)(
    'on the Members tab, $prompt shows: $shown',
    async ({ prompt, shown }) => {
      const { wrapper, router } = await mountBanner(prompt)

      await router.push('/groups/members')
      await flushPromises()

      expect(has(wrapper, 'renewal-banner')).toBe(shown)
    }
  )

  it.each([
    { prompt: 'handoff-banner', button: 'renewal-banner-primary' },
    { prompt: 'confirm-return', button: 'renewal-banner-secondary' },
    { prompt: 'confirm-reminder', button: 'renewal-banner-primary' },
  ] as const)(
    'goes to the Members tab from $prompt',
    async ({ prompt, button }) => {
      const { wrapper, router } = await mountBanner(prompt)

      await click(wrapper, button)

      expect(router.currentRoute.value.path).toBe('/groups/members')
    }
  )

  it.each([
    {
      prompt: 'confirm-return',
      modal: { schoolYear: '2027–⁠28', confirmReturn: true },
      body: { commitments: COMMITMENTS, reason: undefined },
    },
    {
      prompt: 'member-countdown',
      modal: { schoolYear: '2027–⁠28', confirmReturn: false },
      body: { commitments: COMMITMENTS, reason: undefined },
    },
    {
      prompt: 'step-up',
      modal: { schoolYear: undefined, confirmReturn: false },
      body: { commitments: COMMITMENTS, reason: 'step-up' },
    },
  ] as const)(
    'accepts $prompt with the commitments',
    async ({ prompt, modal, body }) => {
      const askCommitments = vi
        .spyOn(ModalService, 'showNthsAcceptPresidency')
        .mockResolvedValue(COMMITMENTS)
      const { wrapper } = await mountBanner(prompt)

      await click(wrapper, 'renewal-banner-primary')

      expect(askCommitments).toHaveBeenCalledWith(
        expect.objectContaining(modal)
      )
      expect(NetworkService.acceptNTHSRenewalPresidency).toHaveBeenCalledWith(
        'group-1',
        body
      )
    }
  )

  it('posts nothing when the commitments step is cancelled', async () => {
    vi.spyOn(ModalService, 'showNthsAcceptPresidency').mockResolvedValue(
      undefined
    )
    const { wrapper } = await mountBanner('confirm-return')

    await click(wrapper, 'renewal-banner-primary')

    expect(NetworkService.acceptNTHSRenewalPresidency).not.toHaveBeenCalled()
  })

  it('shows a failed confirm in the banner and lets the president retry', async () => {
    vi.spyOn(ModalService, 'showNthsAcceptPresidency').mockResolvedValue(
      COMMITMENTS
    )
    vi.mocked(NetworkService.acceptNTHSRenewalPresidency).mockRejectedValue(
      new Error('boom')
    )
    const { wrapper } = await mountBanner('confirm-return')

    await click(wrapper, 'renewal-banner-primary')

    expect(has(wrapper, 'renewal-banner-error')).toBe(true)
    expect(
      wrapper.get('[data-testid="renewal-banner-primary"]').attributes()
    ).not.toHaveProperty('disabled')
  })

  it('shows a failed accept even when the refreshed prompt has no banner', async () => {
    vi.spyOn(ModalService, 'showNthsAcceptPresidency').mockResolvedValue(
      COMMITMENTS
    )
    vi.mocked(NetworkService.acceptNTHSRenewalPresidency).mockRejectedValue(
      new Error('boom')
    )
    refreshNTHSGroups.mockImplementation(({ commit }) =>
      commit('setNTHSGroupRenewal', {
        groupId: 'group-1',
        renewal: { ...BASE_RENEWAL, prompt: 'president-not-cleared' },
      })
    )
    const { wrapper } = await mountBanner('step-up')

    await click(wrapper, 'renewal-banner-primary')

    expect(has(wrapper, 'renewal-banner')).toBe(false)
    expect(has(wrapper, 'renewal-banner-error')).toBe(true)
  })

  describe('dismissing the handoff banner', () => {
    it('keeps it hidden for that user, chapter and school year after a remount', async () => {
      const { wrapper } = await mountBanner('handoff-banner')
      await click(wrapper, 'renewal-banner-secondary')
      expect(has(wrapper, 'renewal-banner')).toBe(false)

      const again = await mountBanner('handoff-banner')
      const otherChapter = await mountBanner('handoff-banner', 'group-2')
      const nextYear = await mountBanner(
        'handoff-banner',
        'group-1',
        '2028-09-30'
      )
      const otherUser = await mountBanner(
        'handoff-banner',
        'group-1',
        '2027-09-30',
        'user-2'
      )

      expect(has(again.wrapper, 'renewal-banner')).toBe(false)
      expect(has(otherChapter.wrapper, 'renewal-banner')).toBe(true)
      expect(has(nextYear.wrapper, 'renewal-banner')).toBe(true)
      expect(has(otherUser.wrapper, 'renewal-banner')).toBe(true)
    })

    it('still shows the confirm-return banner after the handoff banner was dismissed', async () => {
      const { wrapper } = await mountBanner('handoff-banner')
      await click(wrapper, 'renewal-banner-secondary')

      const confirm = await mountBanner('confirm-return')

      expect(has(confirm.wrapper, 'renewal-banner')).toBe(true)
      expect(has(confirm.wrapper, 'renewal-banner-primary')).toBe(true)
    })

    it('still shows and dismisses the banner when localStorage throws', async () => {
      const blocked = () => {
        throw new DOMException('blocked', 'SecurityError')
      }
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
      const { wrapper } = await mountBanner('handoff-banner')
      expect(has(wrapper, 'renewal-banner')).toBe(true)

      await click(wrapper, 'renewal-banner-secondary')

      expect(has(wrapper, 'renewal-banner')).toBe(false)
    })
  })
})
