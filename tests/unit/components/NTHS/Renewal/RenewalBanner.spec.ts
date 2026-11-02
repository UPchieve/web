import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import NetworkService, { NetworkError } from '@/services/NetworkService'
import ModalService from '@/services/ModalService'
import RenewalBanner from '@/components/NTHS/Renewal/RenewalBanner.vue'
import LoggerService from '@/services/LoggerService'
import { NTHS_COMMITMENTS } from '@/services/NTHSApplicationService'
import type {
  NTHSRenewalCommitments,
  NTHSRenewalPublic,
  NTHSRenewalSuccessorPublic,
} from '@/services/NTHSGroupService'

vi.mock('@/services/NetworkService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/NetworkService')>()),
  default: {
    getNTHSRenewalSuccessors: vi.fn(),
    nameSelfAsNTHSRenewalSuccessor: vi.fn(),
  },
}))
const present = vi.fn()
vi.mock('@ionic/vue', () => ({
  toastController: { create: vi.fn(async () => ({ present })) },
}))

const refreshNTHSGroups = vi.fn()
const nthsModule = (storeOptions.modules as any).nths
const VIEWER = { id: 'viewer', firstname: 'Ana', lastName: 'Rivera' }
const BASE_RENEWAL: NTHSRenewalPublic = {
  prompt: 'name-successor-banner',
  closesOn: '2027-09-30',
  successorConfirmationOn: '2027-08-01',
  namingClosesOn: '2027-09-14',
  commitmentsRequired: true,
  canNameSelf: true,
  namingSelfAccepts: false,
  namedSelf: false,
  memberStageOpen: false,
  acceptedPresidents: [],
}

function successor(
  userId: string,
  firstName: string,
  namedBy: NTHSRenewalSuccessorPublic['namedBy']
): NTHSRenewalSuccessorPublic {
  return {
    userId,
    firstName,
    lastInitial: firstName[0],
    accepted: null,
    namedBy,
  }
}

async function mountBanner(
  renewal: Partial<NTHSRenewalPublic>,
  successors: NTHSRenewalSuccessorPublic[] = []
) {
  vi.mocked(NetworkService.getNTHSRenewalSuccessors).mockResolvedValue({
    successors,
    canEditSuccessors: true,
  })
  const store = createStore<any>({
    modules: {
      ...storeOptions.modules,
      user: {
        ...(storeOptions.modules as any).user,
        state: { user: VIEWER },
      },
      nths: {
        ...nthsModule,
        state: {
          ...nthsModule.state,
          NTHSGroups: [
            {
              groupInfo: { id: 'group-1', name: 'Lincoln High NTHS' },
              memberInfo: { roleName: 'admin' },
              renewal: { ...BASE_RENEWAL, ...renewal },
            },
          ],
          NTHSRenewalSuccessors: {},
        },
        actions: {
          ...nthsModule.actions,
          fetchNthsData: vi.fn(),
          refreshNTHSGroups,
        },
      },
    },
  })
  const wrapper = mount(RenewalBanner, {
    props: { groupId: 'group-1' },
    global: { plugins: [store] },
  })
  await flushPromises()
  return wrapper
}

const buttonLabels = (wrapper: Awaited<ReturnType<typeof mountBanner>>) =>
  wrapper.findAll('button').map((b) => b.text())

describe('RenewalBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it.each([
    {
      prompt: 'name-successor-banner',
      title: 'Who will lead Lincoln High NTHS next year?',
      body: "Name one or more members as next year's president. They'll be notified and can accept starting Aug 1.",
    },
    {
      prompt: 'name-successor-reminder',
      title: "Next year's president hasn't been named yet",
      body: 'Name one or more members by Sept 14. If nobody accepts by Sept 30, the chapter closes.',
    },
  ] as const)('shows the $prompt copy', async ({ prompt, title, body }) => {
    const wrapper = await mountBanner({ prompt })
    expect(wrapper.text()).toContain(title)
    expect(wrapper.text()).toContain(body)
    expect(buttonLabels(wrapper)).toEqual(['Name president', 'Me'])
  })

  it.each(['none', 'successor-must-answer'] as const)(
    'renders nothing for %s',
    async (prompt) => {
      const wrapper = await mountBanner({ prompt })
      expect(wrapper.find('[data-testid="renewal-banner"]').exists()).toBe(
        false
      )
    }
  )

  it('stays hidden when the named list comes back empty', async () => {
    const wrapper = await mountBanner({ prompt: 'successors-named' })
    expect(wrapper.find('[data-testid="renewal-banner"]').exists()).toBe(false)
  })

  it('hides "Me" when the viewer cannot name themselves', async () => {
    const wrapper = await mountBanner({ canNameSelf: false })
    expect(buttonLabels(wrapper)).toEqual(['Name president'])
  })

  it('shows who is named, with the change and Me buttons', async () => {
    const wrapper = await mountBanner({ prompt: 'successors-named' }, [
      successor('leo', 'Leo', {
        userId: 'viewer',
        firstName: 'Ana',
        lastInitial: 'R',
      }),
    ])

    expect(buttonLabels(wrapper)).toEqual(['Change', 'Me'])
  })

  it('keeps the banner with a generic title when the named list fails to load', async () => {
    const wrapper = await mountBanner({ prompt: 'successors-named' })
    vi.mocked(NetworkService.getNTHSRenewalSuccessors).mockRejectedValue(
      new Error('down')
    )
    ;(wrapper.vm as any).$store.commit('nths/setNTHSGroupRenewal', {
      groupId: 'group-1',
      renewal: { ...BASE_RENEWAL, prompt: 'none' },
    })
    await flushPromises()
    ;(wrapper.vm as any).$store.commit('nths/setNTHSGroupRenewal', {
      groupId: 'group-1',
      renewal: { ...BASE_RENEWAL, prompt: 'successors-named' },
    })
    await flushPromises()

    expect(wrapper.get('.banner-title').text()).toBe("Next year's president")
    expect(buttonLabels(wrapper)).toContain('Change')
  })

  it('names the viewer without commitments before the successor date', async () => {
    vi.mocked(NetworkService.nameSelfAsNTHSRenewalSuccessor).mockResolvedValue({
      renewal: {
        ...BASE_RENEWAL,
        prompt: 'successors-named',
        canNameSelf: false,
      },
    })
    const askCommitments = vi.spyOn(ModalService, 'showNthsAcceptPresidency')
    const wrapper = await mountBanner({})
    vi.mocked(NetworkService.getNTHSRenewalSuccessors).mockClear()

    await wrapper.get('[data-testid="renewal-banner-me"]').trigger('click')
    await flushPromises()

    expect(askCommitments).not.toHaveBeenCalled()
    expect(NetworkService.nameSelfAsNTHSRenewalSuccessor).toHaveBeenCalledWith(
      'group-1',
      { commitments: undefined }
    )
    expect(NetworkService.getNTHSRenewalSuccessors).toHaveBeenCalledTimes(1)
    expect(present).not.toHaveBeenCalled()
  })

  it('reloads the named list when the renewal is replaced with the same prompt', async () => {
    vi.mocked(NetworkService.nameSelfAsNTHSRenewalSuccessor).mockResolvedValue({
      renewal: {
        ...BASE_RENEWAL,
        prompt: 'successors-named',
        canNameSelf: false,
      },
    })
    const wrapper = await mountBanner({ prompt: 'successors-named' }, [
      successor('leo', 'Leo', {
        userId: 'x',
        firstName: 'Sam',
        lastInitial: 'T',
      }),
    ])
    vi.mocked(NetworkService.getNTHSRenewalSuccessors).mockClear()
    vi.mocked(NetworkService.getNTHSRenewalSuccessors).mockResolvedValue({
      successors: [
        successor('leo', 'Leo', {
          userId: 'x',
          firstName: 'Sam',
          lastInitial: 'T',
        }),
        successor('viewer', 'Ana', {
          userId: 'viewer',
          firstName: 'Ana',
          lastInitial: 'R',
        }),
      ],
      canEditSuccessors: true,
    })

    await wrapper.get('[data-testid="renewal-banner-me"]').trigger('click')
    await flushPromises()

    expect(NetworkService.getNTHSRenewalSuccessors).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Leo L. (named by Sam T.) and you')
  })

  it('waits for the fresh list before naming anyone after the prompt comes back', async () => {
    const wrapper = await mountBanner({ prompt: 'successors-named' }, [
      successor('leo', 'Leo', null),
    ])
    const store = (wrapper.vm as any).$store
    const setPrompt = (prompt: NTHSRenewalPublic['prompt']) =>
      store.commit('nths/setNTHSGroupRenewal', {
        groupId: 'group-1',
        renewal: { ...BASE_RENEWAL, prompt },
      })

    setPrompt('name-successor-banner')
    await flushPromises()

    let finishLoad: () => void = () => undefined
    vi.mocked(NetworkService.getNTHSRenewalSuccessors).mockReturnValue(
      new Promise((resolve) => {
        finishLoad = () =>
          resolve({
            successors: [successor('sam', 'Sam', null)],
            canEditSuccessors: true,
          })
      })
    )
    setPrompt('successors-named')
    await flushPromises()
    expect(wrapper.text()).not.toContain('Leo')

    finishLoad()
    await flushPromises()
    expect(wrapper.text()).toContain('Sam S.')
  })

  it('does not reload the named list when the commitments step is cancelled', async () => {
    vi.spyOn(ModalService, 'showNthsAcceptPresidency').mockResolvedValue(
      undefined
    )
    const wrapper = await mountBanner(
      { prompt: 'successors-named', namingSelfAccepts: true },
      [successor('leo', 'Leo', null)]
    )
    vi.mocked(NetworkService.getNTHSRenewalSuccessors).mockClear()

    await wrapper.get('[data-testid="renewal-banner-me"]').trigger('click')
    await flushPromises()

    expect(NetworkService.getNTHSRenewalSuccessors).not.toHaveBeenCalled()
  })

  it('accepts with the commitments from the successor date', async () => {
    const commitments = Object.fromEntries(
      NTHS_COMMITMENTS.map(({ key }) => [key, true])
    ) as NTHSRenewalCommitments
    vi.spyOn(ModalService, 'showNthsAcceptPresidency').mockResolvedValue(
      commitments
    )
    vi.mocked(NetworkService.nameSelfAsNTHSRenewalSuccessor).mockResolvedValue({
      renewal: {
        ...BASE_RENEWAL,
        prompt: 'none',
        canNameSelf: false,
        namingSelfAccepts: true,
      },
    })
    const wrapper = await mountBanner({ namingSelfAccepts: true })

    await wrapper.get('[data-testid="renewal-banner-me"]').trigger('click')
    await flushPromises()

    expect(NetworkService.nameSelfAsNTHSRenewalSuccessor).toHaveBeenCalledWith(
      'group-1',
      { commitments }
    )
    const { toastController } = await import('@ionic/vue')
    expect(toastController.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "You're Lincoln High NTHS's president for 2027–28.",
      })
    )
  })

  it('accepts in one click when the viewer is the President', async () => {
    const askCommitments = vi.spyOn(ModalService, 'showNthsAcceptPresidency')
    vi.mocked(NetworkService.nameSelfAsNTHSRenewalSuccessor).mockResolvedValue({
      renewal: {
        ...BASE_RENEWAL,
        prompt: 'none',
        canNameSelf: false,
        namingSelfAccepts: true,
        commitmentsRequired: false,
      },
    })
    const wrapper = await mountBanner({
      namingSelfAccepts: true,
      commitmentsRequired: false,
    })

    await wrapper.get('[data-testid="renewal-banner-me"]').trigger('click')
    await flushPromises()

    expect(askCommitments).not.toHaveBeenCalled()
    expect(NetworkService.nameSelfAsNTHSRenewalSuccessor).toHaveBeenCalledTimes(
      1
    )
    const { toastController } = await import('@ionic/vue')
    expect(toastController.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "You're Lincoln High NTHS's president for 2027–28.",
      })
    )
  })

  it('shows the server message and reloads the groups when naming fails', async () => {
    vi.mocked(NetworkService.nameSelfAsNTHSRenewalSuccessor).mockRejectedValue(
      new NetworkError('closed', {
        status: 409,
        code: 'renewal_not_open',
        clientMessage: 'Someone has already accepted the presidency.',
      })
    )
    refreshNTHSGroups.mockImplementation(({ commit, state }: any) => {
      commit(
        'setNTHSGroups',
        state.NTHSGroups.map((g: any) => ({
          ...g,
          renewal: { ...g.renewal, prompt: 'none' },
        }))
      )
    })
    const noticeError = vi.spyOn(LoggerService, 'noticeError')
    const wrapper = await mountBanner({})

    await wrapper.get('[data-testid="renewal-banner-me"]').trigger('click')
    await flushPromises()

    expect(
      wrapper.find('[data-testid="renewal-banner-primary"]').exists()
    ).toBe(false)
    expect(wrapper.get('[data-testid="renewal-banner-error"]').text()).toBe(
      'Someone has already accepted the presidency.'
    )
    expect(refreshNTHSGroups).toHaveBeenCalledTimes(1)
    expect(noticeError).not.toHaveBeenCalled()
  })

  it('clears an earlier error when the picker opens', async () => {
    refreshNTHSGroups.mockReset()
    vi.mocked(NetworkService.nameSelfAsNTHSRenewalSuccessor).mockRejectedValue(
      new Error('boom')
    )
    vi.spyOn(ModalService, 'showNthsSuccessorPicker').mockImplementation(
      () => undefined
    )
    const wrapper = await mountBanner({})
    await wrapper.get('[data-testid="renewal-banner-me"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="renewal-banner-error"]').exists()).toBe(
      true
    )

    await wrapper.get('[data-testid="renewal-banner-primary"]').trigger('click')

    expect(ModalService.showNthsSuccessorPicker).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: 'group-1' })
    )
    expect(wrapper.find('[data-testid="renewal-banner-error"]').exists()).toBe(
      false
    )
  })

  it('logs an unexpected failure and shows the generic message', async () => {
    const failure = new Error('boom')
    vi.mocked(NetworkService.nameSelfAsNTHSRenewalSuccessor).mockRejectedValue(
      failure
    )
    const noticeError = vi.spyOn(LoggerService, 'noticeError')
    const wrapper = await mountBanner({})

    await wrapper.get('[data-testid="renewal-banner-me"]').trigger('click')
    await flushPromises()

    expect(
      wrapper.get('[data-testid="renewal-banner-error"]').text()
    ).toContain('Something went wrong')
    expect(noticeError).toHaveBeenCalledWith(failure, expect.any(String))
  })
})
