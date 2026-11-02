import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import NetworkService, { NetworkError } from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import { useAppModalStore } from '@/stores/app/modal'
import SuccessorPickerModal from '@/components/NTHS/Renewal/SuccessorPickerModal.vue'
import { NTHS_COMMITMENTS } from '@/services/NTHSApplicationService'
import type {
  NTHSRenewalPublic,
  NTHSRenewalSuccessorPublic,
  NTHSRosterMemberPublic,
} from '@/services/NTHSGroupService'

vi.mock('@/services/NetworkService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/NetworkService')>()),
  default: {
    getNTHSChapterRoster: vi.fn(),
    getNTHSRenewalSuccessors: vi.fn(),
    setNTHSRenewalSuccessors: vi.fn(),
    nameSelfAsNTHSRenewalSuccessor: vi.fn(),
  },
}))
vi.mock('@ionic/vue', () => ({
  toastController: { create: vi.fn(async () => ({ present: vi.fn() })) },
}))

const nthsModule = (storeOptions.modules as any).nths
const VIEWER = { id: 'viewer', firstname: 'Ana', lastName: 'Rivera' }
const RENEWAL: NTHSRenewalPublic = {
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
const ALL_COMMITMENTS = Object.fromEntries(
  NTHS_COMMITMENTS.map(({ key }) => [key, true])
)

function member(
  userId: string,
  firstName: string,
  overrides: Partial<NTHSRosterMemberPublic> & { hours?: number } = {}
): NTHSRosterMemberPublic {
  const { hours = 0, ...rest } = overrides
  const periods = {
    thisWeek: 0,
    lastTwoWeeks: 0,
    thisMonth: 0,
    thisSchoolYear: 0,
    allTime: hours,
  }
  return {
    userId,
    firstName,
    lastInitial: firstName[0],
    roleName: 'member',
    title: 'Member',
    joinedAt: '2026-09-01T00:00:00.000Z',
    trainingComplete: true,
    safetyApproved: true,
    accountClosed: false,
    sessionsThisYear: 0,
    hoursThisYear: hours,
    periodHours: periods,
    periodSessions: periods,
    ...rest,
  }
}

const VIEWER_MEMBER = member('viewer', 'Ana', {
  lastInitial: 'R',
  roleName: 'admin',
  title: 'President',
  hours: 31,
})

function named(
  userId: string,
  firstName: string,
  accepted: boolean | null = null
): NTHSRenewalSuccessorPublic {
  return {
    userId,
    firstName,
    lastInitial: firstName[0],
    accepted,
    namedBy: { userId: VIEWER.id, firstName: 'Ana', lastInitial: 'R' },
  }
}

const fetchNthsData = vi.fn()
const refreshNTHSGroups = vi.fn()

async function mountPicker({
  members = [VIEWER_MEMBER],
  successors = [],
  renewal = {},
  asReminder = false,
  pending = false,
  fail,
  canEditSuccessors = true,
}: {
  members?: NTHSRosterMemberPublic[]
  successors?: NTHSRenewalSuccessorPublic[]
  renewal?: Partial<NTHSRenewalPublic>
  asReminder?: boolean
  pending?: boolean
  fail?: 'roster' | 'successors'
  canEditSuccessors?: boolean
} = {}) {
  vi.mocked(NetworkService.getNTHSChapterRoster).mockImplementation(
    fail === 'roster'
      ? () => Promise.reject(new Error('roster down'))
      : async () =>
          ({ data: { roster: { groupId: 'group-1', members } } }) as never
  )
  vi.mocked(NetworkService.getNTHSRenewalSuccessors).mockReturnValue(
    pending
      ? new Promise(() => {})
      : fail === 'successors'
        ? Promise.reject(new Error('successors down'))
        : Promise.resolve({ successors, canEditSuccessors })
  )
  const store = createStore<any>({
    modules: {
      ...storeOptions.modules,
      user: { ...(storeOptions.modules as any).user, state: { user: VIEWER } },
      nths: {
        ...nthsModule,
        state: {
          ...nthsModule.state,
          NTHSGroups: [
            {
              groupInfo: { id: 'group-1', name: 'Lincoln High NTHS' },
              memberInfo: { roleName: 'admin' },
              renewal: { ...RENEWAL, ...renewal },
            },
          ],
          NTHSRenewalSuccessors: {},
        },
        actions: { ...nthsModule.actions, fetchNthsData, refreshNTHSGroups },
      },
    },
  })
  const wrapper = mount(SuccessorPickerModal, {
    props: { groupId: 'group-1', asReminder },
    global: { plugins: [store] },
  })
  await flushPromises()
  return wrapper
}

type Wrapper = Awaited<ReturnType<typeof mountPicker>>

async function acceptCommitments(wrapper: Wrapper) {
  for (const checkbox of wrapper.findAll('input[type="checkbox"]')) {
    await checkbox.setValue(true)
  }
  await wrapper.get('[data-testid="accept-presidency-accept"]').trigger('click')
  await flushPromises()
}

const rowTexts = (wrapper: Wrapper) =>
  wrapper
    .findAll('[data-testid="successor-picker-row"]')
    .map((row) =>
      [
        row.get('.member-name').text(),
        row.find('.role-tag').exists() ? row.get('.role-tag').text() : '-',
        row.get('.member-role').text(),
        row.get('button').text(),
      ].join(' | ')
    )

function rowButton(wrapper: Wrapper, name: string) {
  return wrapper
    .findAll('[data-testid="successor-picker-row"]')
    .find((row) => row.text().includes(name))!
    .get('button')
}

const saveButton = (wrapper: Wrapper) =>
  wrapper.get('[data-testid="successor-picker-save"]')

let hide: ReturnType<typeof vi.spyOn>

describe('SuccessorPickerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hide = vi.spyOn(useAppModalStore(), 'hide')
  })

  it('lists named, then admins, then by hours, with each row detail', async () => {
    const wrapper = await mountPicker({
      members: [
        member('maya', 'Maya', { hours: 12 }),
        member('uri', 'Uri', { trainingComplete: false }),
        VIEWER_MEMBER,
        member('leo', 'Leo', { roleName: 'admin', hours: 1 }),
        member('sam', 'Sam', { hours: 24 }),
        member('gone', 'Gone', { accountClosed: true, hours: 50 }),
        member('kim', 'Kim', { hours: 40 }),
      ],
      successors: [named('sam', 'Sam'), named('kim', 'Kim', false)],
    })

    expect(rowTexts(wrapper)).toEqual([
      'Sam S. | - | 24 hours total · Named by you | Selected',
      'Ana R. | President | 31 hours total | Select',
      'Leo L. | Admin | 1 hour total | Select',
      'Kim K. | - | 40 hours total | Stepped down',
      'Maya M. | - | 12 hours total | Select',
      "Uri U. | - | 0 hours total · Hasn't finished onboarding | Select",
    ])
    expect(rowButton(wrapper, 'Kim K.').attributes('disabled')).toBeDefined()
  })

  it.each([
    {
      nobodyNamed: true,
      heading: 'Who will lead Lincoln High NTHS next year?',
      body: "Nobody has been named as next year's president yet.",
    },
    { nobodyNamed: false, heading: "Next year's president", body: 'Name one' },
  ])(
    'words the heading when nobody named is $nobodyNamed',
    async ({ nobodyNamed, heading, body }) => {
      const wrapper = await mountPicker({
        members: [VIEWER_MEMBER, member('sam', 'Sam')],
        successors: nobodyNamed ? [] : [named('sam', 'Sam')],
      })

      expect(wrapper.get('h2').text()).toBe(heading)
      expect(wrapper.get('.body').text()).toContain(body)
    }
  )

  it('shows no body text while the successors are loading', async () => {
    const wrapper = await mountPicker({ pending: true })

    expect(wrapper.text()).not.toContain('Nobody has been named')
  })

  it.each([
    { count: 8, searchable: false },
    { count: 9, searchable: true },
  ])(
    'offers a name search with $count current members: $searchable',
    async ({ count, searchable }) => {
      const members = Array.from({ length: count }, (_, i) =>
        member(`m-${i}`, i === 0 ? 'Zed' : `Member${i}`)
      )
      const wrapper = await mountPicker({ members })
      const search = wrapper.find('input[type="search"]')
      expect(search.exists()).toBe(searchable)
      if (!searchable) return

      await search.setValue('zed')
      expect(rowTexts(wrapper)).toEqual(['Zed Z. | - | 0 hours total | Select'])
    }
  )

  it('saves the full selection against the list it loaded', async () => {
    vi.mocked(NetworkService.setNTHSRenewalSuccessors).mockResolvedValue({
      renewal: { ...RENEWAL, prompt: 'successors-named' },
    })
    const wrapper = await mountPicker({
      members: [VIEWER_MEMBER, member('sam', 'Sam'), member('leo', 'Leo')],
      successors: [named('sam', 'Sam')],
    })
    expect(saveButton(wrapper).attributes('disabled')).toBeDefined()

    await rowButton(wrapper, 'Leo L.').trigger('click')
    await saveButton(wrapper).trigger('click')
    await flushPromises()

    expect(NetworkService.setNTHSRenewalSuccessors).toHaveBeenCalledWith(
      'group-1',
      { userIds: ['sam', 'leo'], expectedUserIds: ['sam'] }
    )
    expect(hide).toHaveBeenCalled()
  })

  it('keeps the list it loaded as the baseline when the store list changes under it', async () => {
    vi.mocked(NetworkService.setNTHSRenewalSuccessors).mockResolvedValue({
      renewal: { ...RENEWAL, prompt: 'successors-named' },
    })
    const wrapper = await mountPicker({
      members: [VIEWER_MEMBER, member('sam', 'Sam'), member('maya', 'Maya')],
      successors: [named('sam', 'Sam')],
    })
    ;(wrapper.vm as any).$store.commit('nths/setNTHSRenewalSuccessors', {
      groupId: 'group-1',
      successors: [named('leo', 'Leo')],
    })

    await rowButton(wrapper, 'Maya M.').trigger('click')
    await saveButton(wrapper).trigger('click')
    await flushPromises()

    expect(NetworkService.setNTHSRenewalSuccessors).toHaveBeenCalledWith(
      'group-1',
      expect.objectContaining({ expectedUserIds: ['sam'] })
    )
  })

  it('shows no hint when the prompt has moved to none', async () => {
    const wrapper = await mountPicker({ renewal: { prompt: 'none' } })

    expect(wrapper.find('.body').exists()).toBe(false)
  })

  it('disables both Me buttons while the selection has unsaved changes', async () => {
    const wrapper = await mountPicker({
      members: [VIEWER_MEMBER, member('sam', 'Sam')],
    })
    const me = () => wrapper.get('[data-testid="successor-picker-me"]')
    expect(me().attributes('disabled')).toBeUndefined()

    await rowButton(wrapper, 'Sam S.').trigger('click')
    expect(me().attributes('disabled')).toBeDefined()

    await wrapper.setProps({ asReminder: true })
    expect(me().attributes('disabled')).toBeDefined()
  })

  it.each([
    { fail: 'roster', meDisabled: false },
    { fail: 'successors', meDisabled: true },
  ] as const)(
    'when the $fail load fails, Me disabled: $meDisabled',
    async ({ fail, meDisabled }) => {
      const wrapper = await mountPicker({ fail })

      expect(wrapper.text()).toContain('Something went wrong while loading')
      expect(
        wrapper
          .get('[data-testid="successor-picker-me"]')
          .attributes('disabled')
      ).toBe(meDisabled ? '' : undefined)
    }
  )

  it('disables row selection when the list cannot be edited', async () => {
    const wrapper = await mountPicker({
      members: [VIEWER_MEMBER, member('sam', 'Sam')],
      canEditSuccessors: false,
    })

    expect(rowButton(wrapper, 'Sam S.').attributes('disabled')).toBeDefined()
  })

  it('accepts only with every commitment ticked', async () => {
    const wrapper = await mountPicker({ renewal: { namingSelfAccepts: true } })
    await wrapper.get('[data-testid="successor-picker-me"]').trigger('click')
    await flushPromises()
    const accept = wrapper.get('[data-testid="accept-presidency-accept"]')
    const boxes = wrapper.findAll('input[type="checkbox"]')
    for (const box of boxes.slice(1)) await box.setValue(true)

    expect(accept.attributes('disabled')).toBeDefined()
    await accept.trigger('click')
    await flushPromises()
    expect(NetworkService.nameSelfAsNTHSRenewalSuccessor).not.toHaveBeenCalled()

    await boxes[0].setValue(true)
    await accept.trigger('click')
    await flushPromises()
    expect(NetworkService.nameSelfAsNTHSRenewalSuccessor).toHaveBeenCalledTimes(
      1
    )
  })

  it('reloads the list and shows why when someone else changed it', async () => {
    vi.mocked(NetworkService.setNTHSRenewalSuccessors).mockRejectedValue(
      new NetworkError('changed', {
        status: 409,
        code: 'successors_changed',
        clientMessage:
          'Who is named changed since you opened the list. Check the list and try again.',
      })
    )
    const wrapper = await mountPicker({
      members: [VIEWER_MEMBER, member('sam', 'Sam'), member('leo', 'Leo')],
    })
    vi.mocked(NetworkService.getNTHSRenewalSuccessors).mockResolvedValue({
      successors: [named('leo', 'Leo')],
      canEditSuccessors: true,
    })

    await rowButton(wrapper, 'Sam S.').trigger('click')
    await saveButton(wrapper).trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-testid="successor-picker-error"]').text()).toBe(
      'Who is named changed since you opened the list. Check the list and try again.'
    )
    expect(rowTexts(wrapper)[0]).toContain('Leo L.')
    expect(rowButton(wrapper, 'Sam S.').text()).toBe('Select')
    expect(refreshNTHSGroups).toHaveBeenCalledTimes(1)
  })

  it('logs an unexpected failure and reloads the list', async () => {
    const failure = new Error('boom')
    vi.mocked(NetworkService.setNTHSRenewalSuccessors).mockRejectedValue(
      failure
    )
    const noticeError = vi.spyOn(LoggerService, 'noticeError')
    const wrapper = await mountPicker({
      members: [VIEWER_MEMBER, member('sam', 'Sam')],
    })
    vi.mocked(NetworkService.getNTHSRenewalSuccessors).mockClear()

    await rowButton(wrapper, 'Sam S.').trigger('click')
    await saveButton(wrapper).trigger('click')
    await flushPromises()

    expect(noticeError).toHaveBeenCalledWith(failure, expect.any(String))
    expect(NetworkService.getNTHSRenewalSuccessors).toHaveBeenCalledTimes(1)
    expect(hide).not.toHaveBeenCalled()
  })

  it('asks for the commitments when a save from the successor date names the viewer', async () => {
    vi.mocked(NetworkService.setNTHSRenewalSuccessors).mockResolvedValue({
      renewal: { ...RENEWAL, prompt: 'none', namingSelfAccepts: true },
    })
    const wrapper = await mountPicker({
      members: [VIEWER_MEMBER, member('sam', 'Sam')],
      renewal: { namingSelfAccepts: true },
    })

    await rowButton(wrapper, 'Ana R.').trigger('click')
    await saveButton(wrapper).trigger('click')
    await flushPromises()

    await acceptCommitments(wrapper)

    expect(NetworkService.setNTHSRenewalSuccessors).toHaveBeenCalledWith(
      'group-1',
      { userIds: ['viewer'], expectedUserIds: [], commitments: ALL_COMMITMENTS }
    )
    expect(fetchNthsData).toHaveBeenCalled()
  })

  it('sends nothing when the viewer cancels the commitments', async () => {
    const wrapper = await mountPicker({
      renewal: { namingSelfAccepts: true },
    })

    await wrapper.get('[data-testid="successor-picker-me"]').trigger('click')
    await flushPromises()
    await wrapper
      .get('[data-testid="accept-presidency-cancel"]')
      .trigger('click')
    await flushPromises()

    expect(NetworkService.nameSelfAsNTHSRenewalSuccessor).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="successor-picker-save"]').exists()).toBe(
      true
    )
  })

  it('asks for the commitments, then retries, when the server requires them', async () => {
    vi.mocked(NetworkService.nameSelfAsNTHSRenewalSuccessor)
      .mockRejectedValueOnce(
        new NetworkError('required', {
          status: 400,
          code: 'commitments_required',
        })
      )
      .mockResolvedValueOnce({ renewal: { ...RENEWAL, prompt: 'none' } })
    // The refetch brings the requirement the stale tab didn't know about.
    fetchNthsData.mockImplementationOnce(({ commit }) =>
      commit('setNTHSGroupRenewal', {
        groupId: 'group-1',
        renewal: { ...RENEWAL, namingSelfAccepts: true },
      })
    )
    const wrapper = await mountPicker({
      renewal: { namingSelfAccepts: true, commitmentsRequired: false },
    })

    await wrapper.get('[data-testid="successor-picker-me"]').trigger('click')
    await flushPromises()
    await acceptCommitments(wrapper)

    expect(
      vi.mocked(NetworkService.nameSelfAsNTHSRenewalSuccessor).mock.calls
    ).toEqual([
      ['group-1', { commitments: undefined }],
      ['group-1', { commitments: ALL_COMMITMENTS }],
    ])
  })

  it.each([
    { asReminder: false, label: 'Cancel' },
    { asReminder: true, label: 'Remind me later' },
  ])('dismisses with "$label"', async ({ asReminder, label }) => {
    const wrapper = await mountPicker({ asReminder })
    const dismiss = wrapper.get('[data-testid="successor-picker-dismiss"]')
    expect(dismiss.text()).toBe(label)

    await dismiss.trigger('click')

    expect(hide).toHaveBeenCalled()
  })
})
