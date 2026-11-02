import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { h } from 'vue'
import { createStore } from 'vuex'
import { toastController } from '@ionic/vue'
import { storeOptions } from '@/store'
import NTHSGroupsView from '@/views/NTHS/NTHSGroupsView.vue'
import AcceptPresidency from '@/components/NTHS/Renewal/AcceptPresidency.vue'
import NetworkService, { NetworkError } from '@/services/NetworkService'
import ModalService from '@/services/ModalService'
import { NTHS_COMMITMENTS } from '@/services/NTHSApplicationService'
import { memberDisplayName } from '@/services/NTHSRosterService'
import {
  acceptedPresidentsTitle,
  renewalAcceptedToast,
  renewalCountdownLabel,
  renewalCountdownTitle,
  renewalDate,
  renewalDaysLeft,
  renewalDeclinedToast,
  renewalErrorMessage,
  renewalWarningLine,
} from '@/services/NTHSRenewalService'
import { VolunteerOccupations } from '@/services/VolunteerService'
import type {
  NTHSRenewalCommitments,
  NTHSRenewalPublic,
} from '@/services/NTHSGroupService'

vi.mock('@/services/NetworkService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/NetworkService')>()),
  default: {
    getNTHSGroupsForUser: vi.fn(),
    getNTHSRenewalSuccessors: vi.fn(),
    acceptNTHSRenewalPresidency: vi.fn(),
    declineNTHSRenewalPresidency: vi.fn(),
  },
}))
vi.mock('@ionic/vue', () => ({
  toastController: {
    create: vi.fn(async () => ({ present: vi.fn() })),
  },
}))

const GROUP_ID = 'group-1'
const CHAPTER = 'Lincoln High NTHS'
const YEAR = '2027–28'
const CLOSES_ON = '2027-09-30'
const GENERIC_ERROR = renewalErrorMessage(new Error('boom'))

const COMMITMENTS = Object.fromEntries(
  NTHS_COMMITMENTS.map(({ key }) => [key, true])
) as NTHSRenewalCommitments

const nthsModule = (storeOptions.modules as any).nths
const volunteerModule = (storeOptions.modules as any).volunteer
const fetchNthsData = vi.fn()

let serverRenewal: NTHSRenewalPublic
let serverRole: string

type Viewer = {
  role: 'admin' | 'member'
  occupation?: string[]
  isReadyToTutor?: boolean
}

const CLEARED_MEMBER: Viewer = { role: 'member' }
const CLEARED_ADMIN: Viewer = { role: 'admin' }
const NOT_ONBOARDED_MEMBER: Viewer = { role: 'member', isReadyToTutor: false }
const ADMIN_WITHOUT_OCCUPATION: Viewer = { role: 'admin', occupation: [] }

function renewalPayload(
  overrides: Partial<NTHSRenewalPublic> = {}
): NTHSRenewalPublic {
  return {
    prompt: 'none',
    closesOn: CLOSES_ON,
    successorConfirmationOn: '2027-08-01',
    namingClosesOn: '2027-09-14',
    commitmentsRequired: true,
    canNameSelf: false,
    namingSelfAccepts: false,
    namedSelf: false,
    memberStageOpen: false,
    acceptedPresidents: [],
    ...overrides,
  }
}

function groupFor(renewal: NTHSRenewalPublic, role: string) {
  return {
    groupInfo: { id: GROUP_ID, name: CHAPTER },
    memberInfo: { roleName: role },
    renewal,
  }
}

function setDate(month: number, day: number, hour = 12, minute = 0) {
  vi.setSystemTime(new Date(2027, month - 1, day, hour, minute))
}

async function mountHq(
  renewal: Partial<NTHSRenewalPublic>,
  viewer: Viewer = CLEARED_MEMBER
) {
  serverRenewal = renewalPayload(renewal)
  serverRole = viewer.role
  const store = createStore<any>({
    modules: {
      ...storeOptions.modules,
      user: {
        ...(storeOptions.modules as any).user,
        state: {
          user: {
            id: 'viewer',
            occupation: viewer.occupation ?? [
              VolunteerOccupations.HIGH_SCHOOL_STUDENT,
            ],
          },
        },
      },
      volunteer: {
        ...volunteerModule,
        getters: {
          ...volunteerModule.getters,
          isReadyToTutor: () => viewer.isReadyToTutor ?? true,
        },
      },
      nths: {
        ...nthsModule,
        state: {
          ...nthsModule.state,
          NTHSGroups: [groupFor(serverRenewal, viewer.role)],
          NTHSRenewalSuccessors: {},
        },
        actions: { ...nthsModule.actions, fetchNthsData },
      },
    },
  })
  const routed = (testid: string) => ({
    render: () => h('div', { 'data-testid': testid }),
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/groups/home', component: routed('routed-home') },
      { path: '/groups/members', component: routed('routed-members') },
    ],
  })
  router.push('/groups/home')
  await router.isReady()

  const wrapper = mount(NTHSGroupsView, {
    global: { plugins: [store, router] },
  })
  await flushPromises()
  return wrapper
}

const byId = (id: string) => `[data-testid="${id}"]`
const has = (wrapper: VueWrapper<any>, id: string) =>
  wrapper.find(byId(id)).exists()
const textOf = (wrapper: VueWrapper<any>, id: string) =>
  wrapper.get(byId(id)).text()

async function click(wrapper: VueWrapper<any>, id: string) {
  await wrapper.get(byId(id)).trigger('click')
  await flushPromises()
}

async function checkCommitments(wrapper: VueWrapper<any>, count: number) {
  const boxes = wrapper.findAll('input[type="checkbox"]')
  for (const box of boxes.slice(0, count)) {
    await box.setValue(true)
  }
}

function acceptAnswers(
  outcome: 'accepted' | 'has_president',
  after: Partial<NTHSRenewalPublic> = {}
) {
  vi.mocked(NetworkService.acceptNTHSRenewalPresidency).mockImplementation(
    async () => {
      serverRenewal = renewalPayload(after)
      return { renewal: serverRenewal, outcome }
    }
  )
}

function declineAnswers(after: Partial<NTHSRenewalPublic> = {}) {
  vi.mocked(NetworkService.declineNTHSRenewalPresidency).mockImplementation(
    async () => {
      serverRenewal = renewalPayload(after)
      return { renewal: serverRenewal }
    }
  )
}

function expectToast(message: string) {
  expect(toastController.create).toHaveBeenCalledTimes(1)
  expect(toastController.create).toHaveBeenCalledWith(
    expect.objectContaining({ message })
  )
}

function expectAcceptedToast(
  options: { asCoPresident?: boolean; gainedAdmin?: boolean } = {}
) {
  expectToast(
    renewalAcceptedToast({
      chapterName: CHAPTER,
      closesOn: CLOSES_ON,
      ...options,
    })
  )
}

const titleOf = (wrapper: VueWrapper<any>) => wrapper.get('h2.title').text()

function expectHqAsUsual(wrapper: VueWrapper<any>) {
  expect(wrapper.find('nav.tabs').exists()).toBe(true)
  expect(has(wrapper, 'routed-home')).toBe(true)
  expect(has(wrapper, 'renewal-answer-panel')).toBe(false)
}

function expectNothingNew(wrapper: VueWrapper<any>) {
  expect(has(wrapper, 'renewal-warning-line')).toBe(false)
  expect(has(wrapper, 'renewal-answer-panel')).toBe(false)
  expect(has(wrapper, 'renewal-banner')).toBe(false)
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchNthsData.mockReset()
  vi.mocked(NetworkService.acceptNTHSRenewalPresidency).mockReset()
  vi.mocked(NetworkService.declineNTHSRenewalPresidency).mockReset()
  vi.mocked(NetworkService.getNTHSGroupsForUser).mockImplementation(
    async () =>
      ({
        data: {
          groups: [groupFor(structuredClone(serverRenewal), serverRole)],
        },
      }) as never
  )
  setDate(9, 16)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('must-answer block', () => {
  describe('the question', () => {
    it.each([
      {
        name: 'a successor the admins named, who holds the President title',
        renewal: {
          prompt: 'successor-must-answer',
          commitmentsRequired: false,
        },
      },
      {
        name: 'a plain member the admins named',
        renewal: { prompt: 'successor-must-answer', commitmentsRequired: true },
      },
      {
        name: 'a successor who named themselves and holds the President title',
        renewal: {
          prompt: 'successor-must-answer',
          namedSelf: true,
          commitmentsRequired: false,
        },
      },
      {
        name: 'a plain member who named themselves',
        renewal: {
          prompt: 'successor-must-answer',
          namedSelf: true,
          commitmentsRequired: true,
        },
      },
      {
        name: 'a member asked to step up',
        renewal: { prompt: 'member-must-answer', memberStageOpen: true },
      },
    ] as const)(
      'asks $name, in place of the tabs and routed view',
      async ({ renewal }) => {
        const wrapper = await mountHq(renewal)

        expect(has(wrapper, 'renewal-answer-panel')).toBe(true)
        expect(has(wrapper, 'renewal-answer-primary')).toBe(true)
        expect(has(wrapper, 'renewal-answer-secondary')).toBe(true)
        expect(wrapper.find('nav.tabs').exists()).toBe(false)
        expect(has(wrapper, 'routed-home')).toBe(false)
        expect(has(wrapper, 'renewal-banner')).toBe(false)
      }
    )

    it('keeps a named successor on the named question once the member stage opens', async () => {
      const wrapper = await mountHq({
        prompt: 'successor-must-answer',
        memberStageOpen: true,
      })

      const namedBeforeMemberStage = await mountHq({
        prompt: 'successor-must-answer',
        memberStageOpen: false,
      })
      const memberAsked = await mountHq({
        prompt: 'member-must-answer',
        memberStageOpen: true,
      })
      expect(titleOf(wrapper)).toBe(titleOf(namedBeforeMemberStage))
      expect(titleOf(wrapper)).not.toBe(titleOf(memberAsked))
    })

    it('words the question apart for a successor who named themselves', async () => {
      const selfNamed = await mountHq({
        prompt: 'successor-must-answer',
        namedSelf: true,
      })
      const adminNamed = await mountHq({ prompt: 'successor-must-answer' })
      expect(titleOf(selfNamed)).not.toBe(titleOf(adminNamed))
    })

    it('appears without a remount when a refresh brings the prompt', async () => {
      const wrapper = await mountHq({ prompt: 'none' })
      expectHqAsUsual(wrapper)

      serverRenewal = renewalPayload({
        prompt: 'member-must-answer',
        memberStageOpen: true,
      })
      await wrapper.vm.$router.push('/groups/members')
      await flushPromises()

      expect(has(wrapper, 'renewal-answer-panel')).toBe(true)
      expect(has(wrapper, 'routed-members')).toBe(false)
    })

    it.each([
      { prompt: 'successor-must-answer', viewer: NOT_ONBOARDED_MEMBER },
      { prompt: 'successor-must-answer', viewer: ADMIN_WITHOUT_OCCUPATION },
      { prompt: 'member-must-answer', viewer: NOT_ONBOARDED_MEMBER },
      { prompt: 'member-must-answer', viewer: ADMIN_WITHOUT_OCCUPATION },
    ] as const)(
      'lets the warning win over $prompt for this viewer: $viewer.role',
      async ({ prompt, viewer }) => {
        const wrapper = await mountHq({ prompt }, viewer)

        expect(has(wrapper, 'hide-page-content')).toBe(true)
        expect(has(wrapper, 'renewal-answer-panel')).toBe(false)
        expect(has(wrapper, 'renewal-warning-line')).toBe(false)
        expect(wrapper.find('nav.tabs').exists()).toBe(false)
      }
    )
  })

  describe('the countdown chip', () => {
    it.each([
      { prompt: 'member-must-answer', memberStageOpen: true, shown: true },
      { prompt: 'successor-must-answer', memberStageOpen: true, shown: true },
      { prompt: 'successor-must-answer', memberStageOpen: false, shown: false },
    ] as const)(
      'on $prompt with memberStageOpen $memberStageOpen shows: $shown',
      async ({ prompt, memberStageOpen, shown }) => {
        const wrapper = await mountHq({ prompt, memberStageOpen })
        expect(has(wrapper, 'renewal-countdown-chip')).toBe(shown)
      }
    )

    it.each([
      { month: 9, day: 16, hour: 12, minute: 0, daysLeft: 14 },
      { month: 9, day: 29, hour: 0, minute: 5, daysLeft: 1 },
      { month: 9, day: 29, hour: 23, minute: 55, daysLeft: 1 },
      { month: 9, day: 30, hour: 0, minute: 5, daysLeft: 0 },
      { month: 10, day: 1, hour: 12, minute: 0, daysLeft: 0 },
    ])(
      'reads $daysLeft as days left at $hour:$minute on $month/$day',
      async ({ month, day, hour, minute, daysLeft }) => {
        setDate(month, day, hour, minute)
        const wrapper = await mountHq({
          prompt: 'member-must-answer',
          memberStageOpen: true,
        })
        expect(renewalDaysLeft(CLOSES_ON)).toBe(daysLeft)
        expect(textOf(wrapper, 'renewal-countdown-chip')).toBe(
          renewalCountdownLabel(daysLeft)
        )
      }
    )
  })

  describe('accepting', () => {
    it.each([
      {
        name: 'a named plain member, who gains admin access',
        prompt: 'successor-must-answer',
        viewer: CLEARED_MEMBER,
        gainedAdmin: true,
      },
      {
        name: 'a self-named admin, who already has admin access',
        prompt: 'successor-must-answer',
        namedSelf: true,
        viewer: CLEARED_ADMIN,
        gainedAdmin: false,
      },
      {
        name: 'a member asked to step up, who already has admin access',
        prompt: 'member-must-answer',
        viewer: CLEARED_ADMIN,
        gainedAdmin: false,
      },
    ] as const)(
      'accepts $name in one click when no commitments are needed',
      async ({ prompt, viewer, gainedAdmin, ...rest }) => {
        acceptAnswers('accepted')
        const wrapper = await mountHq(
          {
            prompt,
            namedSelf: 'namedSelf' in rest,
            commitmentsRequired: false,
          },
          viewer
        )

        await click(wrapper, 'renewal-answer-primary')

        expect(NetworkService.acceptNTHSRenewalPresidency).toHaveBeenCalledWith(
          GROUP_ID,
          { commitments: undefined }
        )
        expectAcceptedToast({ gainedAdmin })
        expect(fetchNthsData).toHaveBeenCalledTimes(1)
        expectHqAsUsual(wrapper)
      }
    )

    it.each([
      { prompt: 'successor-must-answer', namedSelf: true },
      { prompt: 'member-must-answer', namedSelf: false },
    ] as const)(
      'needs all five commitments on $prompt with namedSelf $namedSelf before it posts them',
      async ({ prompt, namedSelf }) => {
        acceptAnswers('accepted')
        const wrapper = await mountHq({
          prompt,
          namedSelf,
          commitmentsRequired: true,
          memberStageOpen: true,
        })

        await click(wrapper, 'renewal-answer-primary')

        expect(
          NetworkService.acceptNTHSRenewalPresidency
        ).not.toHaveBeenCalled()
        expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(5)
        expect(has(wrapper, 'renewal-countdown-chip')).toBe(true)

        await checkCommitments(wrapper, 4)
        expect(
          wrapper.get(byId('accept-presidency-accept')).attributes('disabled')
        ).toBeDefined()

        await checkCommitments(wrapper, 5)
        await click(wrapper, 'accept-presidency-accept')

        expect(
          NetworkService.acceptNTHSRenewalPresidency
        ).toHaveBeenCalledTimes(1)
        expect(NetworkService.acceptNTHSRenewalPresidency).toHaveBeenCalledWith(
          GROUP_ID,
          { commitments: COMMITMENTS }
        )
        expectAcceptedToast({ gainedAdmin: true })
        expect(fetchNthsData).toHaveBeenCalledTimes(1)
        expectHqAsUsual(wrapper)
      }
    )

    it('goes back to the question from the accept step without posting', async () => {
      const wrapper = await mountHq({ prompt: 'member-must-answer' })
      await click(wrapper, 'renewal-answer-primary')

      await click(wrapper, 'accept-presidency-cancel')

      expect(has(wrapper, 'renewal-answer-primary')).toBe(true)
      expect(has(wrapper, 'accept-presidency-accept')).toBe(false)
      expect(NetworkService.acceptNTHSRenewalPresidency).not.toHaveBeenCalled()
    })

    it('reloads HQ with no toast or message when someone else got there first', async () => {
      acceptAnswers('has_president')
      const wrapper = await mountHq({
        prompt: 'member-must-answer',
        commitmentsRequired: false,
      })

      await click(wrapper, 'renewal-answer-primary')

      expect(toastController.create).not.toHaveBeenCalled()
      expect(fetchNthsData).toHaveBeenCalledTimes(1)
    })

    it('refreshes and opens the accept step when a one-click accept is refused for commitments', async () => {
      acceptAnswers('accepted')
      vi.mocked(
        NetworkService.acceptNTHSRenewalPresidency
      ).mockImplementationOnce(async () => {
        serverRenewal = renewalPayload({
          prompt: 'successor-must-answer',
          commitmentsRequired: true,
        })
        throw new NetworkError('refused', {
          status: 422,
          code: 'commitments_required',
        })
      })
      const wrapper = await mountHq({
        prompt: 'successor-must-answer',
        commitmentsRequired: false,
      })
      vi.mocked(NetworkService.getNTHSGroupsForUser).mockClear()

      await click(wrapper, 'renewal-answer-primary')

      expect(NetworkService.getNTHSGroupsForUser).toHaveBeenCalled()
      expect(has(wrapper, 'renewal-answer-error')).toBe(false)
      expect(wrapper.findComponent(AcceptPresidency).exists()).toBe(true)
      expect(toastController.create).not.toHaveBeenCalled()

      await checkCommitments(wrapper, 5)
      await click(wrapper, 'accept-presidency-accept')

      expect(NetworkService.acceptNTHSRenewalPresidency).toHaveBeenCalledTimes(
        2
      )
      expect(
        NetworkService.acceptNTHSRenewalPresidency
      ).toHaveBeenLastCalledWith(GROUP_ID, { commitments: COMMITMENTS })
      expectAcceptedToast({ gainedAdmin: true })
      expect(fetchNthsData).toHaveBeenCalledTimes(1)
    })
  })

  describe('stepping down', () => {
    it.each([
      {
        name: 'a named admin before the member stage',
        renewal: { prompt: 'successor-must-answer', memberStageOpen: false },
        viewer: CLEARED_ADMIN,
      },
      {
        name: 'a named plain member before the member stage',
        renewal: { prompt: 'successor-must-answer', memberStageOpen: false },
        viewer: CLEARED_MEMBER,
      },
      {
        name: 'a named admin in the member stage',
        renewal: { prompt: 'successor-must-answer', memberStageOpen: true },
        viewer: CLEARED_ADMIN,
      },
    ] as const)(
      'posts the decline and tells $name what happens next',
      async ({ renewal, viewer }) => {
        declineAnswers({ prompt: 'none' })
        const wrapper = await mountHq(renewal, viewer)

        await click(wrapper, 'renewal-answer-secondary')

        expect(
          NetworkService.declineNTHSRenewalPresidency
        ).toHaveBeenCalledWith(GROUP_ID)
        expectToast(
          renewalDeclinedToast({
            before: renewalPayload(renewal),
            isAdmin: viewer.role === 'admin',
          })!
        )
        expect(fetchNthsData).toHaveBeenCalledTimes(1)
        expectHqAsUsual(wrapper)
      }
    )

    it('turns the member-stage decline into the countdown banner with no toast', async () => {
      declineAnswers({ prompt: 'decliner-countdown', memberStageOpen: true })
      const wrapper = await mountHq({
        prompt: 'member-must-answer',
        memberStageOpen: true,
      })
      await click(wrapper, 'renewal-answer-secondary')

      expect(NetworkService.declineNTHSRenewalPresidency).toHaveBeenCalledWith(
        GROUP_ID
      )
      expect(toastController.create).not.toHaveBeenCalled()
      expect(fetchNthsData).toHaveBeenCalledTimes(1)
      expectHqAsUsual(wrapper)
      expect(textOf(wrapper, 'renewal-banner')).toContain(
        renewalCountdownTitle(CHAPTER, 14)
      )
      expect(has(wrapper, 'renewal-banner-primary')).toBe(true)
    })
  })

  describe('failures', () => {
    const TAKEN = 'Someone has already accepted the presidency.'
    const closed = new NetworkError('closed', {
      status: 409,
      code: 'renewal_not_open',
      clientMessage: TAKEN,
    })

    it.each([
      {
        name: 'the accept fails with a server message',
        button: 'renewal-answer-primary',
        failure: closed,
        message: TAKEN,
      },
      {
        name: 'the accept fails unexpectedly',
        button: 'renewal-answer-primary',
        failure: new Error('boom'),
        message: GENERIC_ERROR,
      },
      {
        name: 'the step-down fails with a server message',
        button: 'renewal-answer-secondary',
        failure: closed,
        message: TAKEN,
      },
      {
        name: 'the step-down fails unexpectedly',
        button: 'renewal-answer-secondary',
        failure: new Error('boom'),
        message: GENERIC_ERROR,
      },
    ])(
      'keeps the panel up with an alert when $name',
      async ({ button, failure, message }) => {
        vi.mocked(NetworkService.acceptNTHSRenewalPresidency).mockRejectedValue(
          failure
        )
        vi.mocked(
          NetworkService.declineNTHSRenewalPresidency
        ).mockRejectedValue(failure)
        const wrapper = await mountHq({
          prompt: 'successor-must-answer',
          commitmentsRequired: false,
        })

        await click(wrapper, button)

        const error = wrapper.get(byId('renewal-answer-error'))
        expect(error.text()).toBe(message)
        expect(error.attributes('role')).toBe('alert')
        expect(toastController.create).not.toHaveBeenCalled()
        expect(fetchNthsData).not.toHaveBeenCalled()
      }
    )

    it.each([
      { name: 'accepting', button: 'renewal-answer-primary' },
      { name: 'stepping down', button: 'renewal-answer-secondary' },
    ])('disables both buttons while $name', async ({ button }) => {
      const pending = new Promise<never>(() => undefined)
      vi.mocked(NetworkService.acceptNTHSRenewalPresidency).mockReturnValue(
        pending
      )
      vi.mocked(NetworkService.declineNTHSRenewalPresidency).mockReturnValue(
        pending
      )
      const wrapper = await mountHq({
        prompt: 'successor-must-answer',
        commitmentsRequired: false,
      })

      await click(wrapper, button)

      for (const id of ['renewal-answer-primary', 'renewal-answer-secondary']) {
        expect(wrapper.get(byId(id)).attributes('disabled')).toBeDefined()
      }
    })
  })

  describe('AcceptPresidency', () => {
    it('offers a checkbox per commitment with accept and cancel', () => {
      const wrapper = mount(AcceptPresidency, {
        props: { chapterName: CHAPTER, schoolYear: YEAR },
      })

      expect(has(wrapper, 'accept-presidency-accept')).toBe(true)
      expect(has(wrapper, 'accept-presidency-cancel')).toBe(true)
      expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(5)
    })
  })

  it.each([
    { prompt: 'successor-must-answer', dot: true },
    { prompt: 'member-must-answer', dot: true },
    { prompt: 'none', dot: false },
    { prompt: 'co-president-offer', dot: false },
    { prompt: 'decliner-countdown', dot: false },
    { prompt: 'successor-not-cleared', dot: false },
    { prompt: 'member-not-cleared', dot: false },
  ] as const)('red dot for $prompt: $dot', ({ prompt, dot }) => {
    expect(
      nthsModule.getters.renewalNeedsAttention({
        NTHSGroups: [{ renewal: renewalPayload({ prompt }) }],
      })
    ).toBe(dot)
  })
})

describe('banners and the warning line', () => {
  describe('prompt none', () => {
    it.each([
      {
        name: 'a member who has not finished onboarding',
        viewer: NOT_ONBOARDED_MEMBER,
        renewal: {},
      },
      {
        name: 'an admin with no occupation on file',
        viewer: ADMIN_WITHOUT_OCCUPATION,
        renewal: {},
      },
    ])(
      'gives $name the warning and nothing new',
      async ({ viewer, renewal }) => {
        const wrapper = await mountHq({ prompt: 'none', ...renewal }, viewer)

        expect(has(wrapper, 'hide-page-content')).toBe(true)
        expectNothingNew(wrapper)
      }
    )

    it('leaves HQ as usual for a cleared member', async () => {
      const wrapper = await mountHq({ prompt: 'none' })

      expectHqAsUsual(wrapper)
      expectNothingNew(wrapper)
    })
  })

  describe('the warning line', () => {
    it.each([
      {
        name: 'a named uncleared successor before the member stage',
        renewal: {
          prompt: 'successor-not-cleared',
          memberStageOpen: false,
        },
        viewer: NOT_ONBOARDED_MEMBER,
        buttons: 1,
        month: 8,
        day: 5,
        daysLeft: 56,
      },
      {
        name: 'a named uncleared successor in the member stage',
        renewal: { prompt: 'successor-not-cleared', memberStageOpen: true },
        viewer: NOT_ONBOARDED_MEMBER,
        buttons: 1,
        month: 9,
        day: 16,
        daysLeft: 14,
      },
      {
        name: 'a named uncleared successor with one day left',
        renewal: { prompt: 'successor-not-cleared', memberStageOpen: true },
        viewer: NOT_ONBOARDED_MEMBER,
        buttons: 1,
        month: 9,
        day: 29,
        daysLeft: 1,
      },
      {
        name: 'a named uncleared successor on the last day',
        renewal: { prompt: 'successor-not-cleared', memberStageOpen: true },
        viewer: NOT_ONBOARDED_MEMBER,
        buttons: 1,
        month: 9,
        day: 30,
        daysLeft: 0,
      },
      {
        name: 'an uncleared plain member',
        renewal: { prompt: 'member-not-cleared', memberStageOpen: true },
        viewer: NOT_ONBOARDED_MEMBER,
        buttons: 1,
        month: 9,
        day: 16,
        daysLeft: 14,
      },
      {
        name: 'an uncleared admin',
        renewal: { prompt: 'member-not-cleared', memberStageOpen: true },
        viewer: ADMIN_WITHOUT_OCCUPATION,
        buttons: 2,
        month: 9,
        day: 16,
        daysLeft: 14,
      },
    ] as const)(
      'adds the line to the warning for $name',
      async ({ renewal, viewer, buttons, month, day, daysLeft }) => {
        setDate(month, day)
        const wrapper = await mountHq(renewal, viewer)

        const callout = wrapper.get(byId('hide-page-content'))
        expect(renewalDaysLeft(CLOSES_ON)).toBe(daysLeft)
        expect(callout.get(byId('renewal-warning-line')).text()).toBe(
          renewalWarningLine(renewalPayload(renewal), CHAPTER)
        )
        expect(callout.findAll('button')).toHaveLength(buttons)
        expect(has(wrapper, 'renewal-answer-panel')).toBe(false)
        expect(has(wrapper, 'renewal-banner')).toBe(false)
      }
    )
  })

  it.each(['co-president-offer', 'decliner-countdown'] as const)(
    'hides the %s banner behind the warning',
    async (prompt) => {
      const wrapper = await mountHq({ prompt }, NOT_ONBOARDED_MEMBER)

      expect(has(wrapper, 'hide-page-content')).toBe(true)
      expect(has(wrapper, 'renewal-banner')).toBe(false)
    }
  )

  describe('the co-president banner', () => {
    const ACCEPTED = [
      { firstName: 'Ana', lastInitial: 'R' },
      { firstName: 'Ben', lastInitial: 'T' },
      { firstName: 'Cam', lastInitial: 'S' },
    ]

    it.each([{ count: 1 }, { count: 2 }, { count: 3 }])(
      'names $count accepted presidents with no panel and no successors fetch',
      async ({ count }) => {
        const wrapper = await mountHq({
          prompt: 'co-president-offer',
          acceptedPresidents: ACCEPTED.slice(0, count),
        })

        const accepted = ACCEPTED.slice(0, count)
        const banner = textOf(wrapper, 'renewal-banner')
        expect(banner).toContain(acceptedPresidentsTitle(accepted, YEAR))
        const positions = accepted.map((person) =>
          banner.indexOf(memberDisplayName(person))
        )
        expect(positions).toEqual([...positions].sort((a, b) => a - b))
        expect(positions).not.toContain(-1)
        expect(banner).toContain(renewalDate(CLOSES_ON))
        expect(has(wrapper, 'renewal-banner-primary')).toBe(true)
        expect(has(wrapper, 'renewal-banner-secondary')).toBe(true)
        expectHqAsUsual(wrapper)
        expect(NetworkService.getNTHSRenewalSuccessors).not.toHaveBeenCalled()
      }
    )

    const ACCEPT_CASES = [
      {
        name: 'co-president, plain member',
        prompt: 'co-president-offer',
        viewer: CLEARED_MEMBER,
        toast: { asCoPresident: true, gainedAdmin: true },
      },
      {
        name: 'co-president, admin',
        prompt: 'co-president-offer',
        viewer: CLEARED_ADMIN,
        toast: { asCoPresident: true, gainedAdmin: false },
      },
      {
        name: 'countdown, plain member',
        prompt: 'decliner-countdown',
        viewer: CLEARED_MEMBER,
        toast: { asCoPresident: false, gainedAdmin: true },
      },
    ] as const

    it.each(ACCEPT_CASES)(
      'accepts in one click from the $name banner when no commitments are needed',
      async ({ prompt, viewer, toast }) => {
        const askCommitments = vi.spyOn(
          ModalService,
          'showNthsAcceptPresidency'
        )
        acceptAnswers('accepted')
        const wrapper = await mountHq(
          {
            prompt,
            memberStageOpen: true,
            acceptedPresidents: ACCEPTED.slice(0, 1),
            commitmentsRequired: false,
          },
          viewer
        )

        await click(wrapper, 'renewal-banner-primary')

        expect(askCommitments).not.toHaveBeenCalled()
        expect(NetworkService.acceptNTHSRenewalPresidency).toHaveBeenCalledWith(
          GROUP_ID,
          { commitments: undefined }
        )
        expectAcceptedToast(toast)
        expect(fetchNthsData).toHaveBeenCalledTimes(1)
      }
    )

    it.each(ACCEPT_CASES.slice(1))(
      'collects commitments in the modal before accepting from the $name banner',
      async ({ prompt, viewer, toast }) => {
        const askCommitments = vi
          .spyOn(ModalService, 'showNthsAcceptPresidency')
          .mockResolvedValue(COMMITMENTS)
        acceptAnswers('accepted')
        const wrapper = await mountHq(
          {
            prompt,
            memberStageOpen: true,
            acceptedPresidents: ACCEPTED.slice(0, 1),
            commitmentsRequired: true,
          },
          viewer
        )

        await click(wrapper, 'renewal-banner-primary')

        expect(askCommitments).toHaveBeenCalledWith(
          expect.objectContaining({
            chapterName: CHAPTER,
            schoolYear: YEAR,
          })
        )
        expect(NetworkService.acceptNTHSRenewalPresidency).toHaveBeenCalledWith(
          GROUP_ID,
          { commitments: COMMITMENTS }
        )
        expectAcceptedToast(toast)
        expect(fetchNthsData).toHaveBeenCalledTimes(1)
      }
    )

    it('posts nothing when the commitments modal is cancelled', async () => {
      vi.spyOn(ModalService, 'showNthsAcceptPresidency').mockResolvedValue(
        undefined
      )
      const wrapper = await mountHq({
        prompt: 'co-president-offer',
        acceptedPresidents: ACCEPTED.slice(0, 1),
        commitmentsRequired: true,
      })

      await click(wrapper, 'renewal-banner-primary')

      expect(NetworkService.acceptNTHSRenewalPresidency).not.toHaveBeenCalled()
      expect(toastController.create).not.toHaveBeenCalled()
    })

    it('steps down with the plain toast', async () => {
      declineAnswers({ prompt: 'none' })
      const wrapper = await mountHq({
        prompt: 'co-president-offer',
        acceptedPresidents: ACCEPTED.slice(0, 1),
      })

      await click(wrapper, 'renewal-banner-secondary')

      expect(NetworkService.declineNTHSRenewalPresidency).toHaveBeenCalledWith(
        GROUP_ID
      )
      expectToast(
        renewalDeclinedToast({
          before: renewalPayload({ prompt: 'co-president-offer' }),
          isAdmin: false,
        })!
      )
      expect(fetchNthsData).toHaveBeenCalledTimes(1)
      expect(has(wrapper, 'renewal-banner')).toBe(false)
    })

    it('shows a failed accept in the banner', async () => {
      vi.mocked(NetworkService.acceptNTHSRenewalPresidency).mockRejectedValue(
        new Error('boom')
      )
      const wrapper = await mountHq({
        prompt: 'co-president-offer',
        acceptedPresidents: ACCEPTED.slice(0, 1),
        commitmentsRequired: false,
      })

      await click(wrapper, 'renewal-banner-primary')

      expect(textOf(wrapper, 'renewal-banner-error')).toBe(GENERIC_ERROR)
      expect(toastController.create).not.toHaveBeenCalled()
    })
  })

  describe('the countdown banner', () => {
    it.each([
      { month: 9, day: 16, daysLeft: 14 },
      { month: 9, day: 28, daysLeft: 2 },
      { month: 9, day: 29, daysLeft: 1 },
      { month: 9, day: 30, daysLeft: 0 },
      { month: 10, day: 1, daysLeft: 0 },
    ])(
      'reads $daysLeft as days left on $month/$day with no panel and no successors fetch',
      async ({ month, day, daysLeft }) => {
        setDate(month, day)
        const wrapper = await mountHq({
          prompt: 'decliner-countdown',
          memberStageOpen: true,
        })

        const banner = textOf(wrapper, 'renewal-banner')
        expect(renewalDaysLeft(CLOSES_ON)).toBe(daysLeft)
        expect(banner).toContain(renewalCountdownTitle(CHAPTER, daysLeft))
        expect(has(wrapper, 'renewal-banner-primary')).toBe(true)
        expect(has(wrapper, 'renewal-banner-secondary')).toBe(false)
        expectHqAsUsual(wrapper)
        expect(NetworkService.getNTHSRenewalSuccessors).not.toHaveBeenCalled()
      }
    )
  })
})
