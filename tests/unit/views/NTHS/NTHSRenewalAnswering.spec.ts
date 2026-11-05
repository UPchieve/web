import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { h } from 'vue'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import NTHSGroupsView from '@/views/NTHS/NTHSGroupsView.vue'
import NetworkService from '@/services/NetworkService'
import { VolunteerOccupations } from '@/services/VolunteerService'
import type { NTHSRenewalPublic } from '@/services/NTHSGroupService'

vi.mock('@/services/NetworkService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/NetworkService')>()),
  default: {
    getNTHSGroupsForUser: vi.fn(),
  },
}))
vi.mock('@ionic/vue', () => ({
  toastController: {
    create: vi.fn(async () => ({ present: vi.fn() })),
  },
}))

const GROUP_ID = 'group-1'
const CHAPTER = 'Lincoln High NTHS'
const CLOSES_ON = '2027-09-30'
const nthsModule = (storeOptions.modules as any).nths
const volunteerModule = (storeOptions.modules as any).volunteer

let serverRenewal: NTHSRenewalPublic
let serverRole: string

type Viewer = {
  role: 'admin' | 'member'
  occupation?: string[]
  isOnboardedAndApproved?: boolean
}

const CLEARED_MEMBER: Viewer = { role: 'member' }
const NOT_ONBOARDED_MEMBER: Viewer = {
  role: 'member',
  isOnboardedAndApproved: false,
}
const ADMIN_WITHOUT_OCCUPATION: Viewer = { role: 'admin', occupation: [] }

function renewalPayload(
  overrides: Partial<NTHSRenewalPublic> = {}
): NTHSRenewalPublic {
  return {
    prompt: 'none',
    closesOn: CLOSES_ON,
    successorConfirmationOn: '2027-08-01',
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
          isOnboardedAndApproved: () => viewer.isOnboardedAndApproved ?? true,
        },
      },
      nths: {
        ...nthsModule,
        state: {
          ...nthsModule.state,
          NTHSGroups: [groupFor(serverRenewal, viewer.role)],
        },
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

function expectHqAsUsual(wrapper: VueWrapper<any>) {
  expect(wrapper.find('nav.tabs').exists()).toBe(true)
  expect(has(wrapper, 'routed-home')).toBe(true)
}

function expectNothingNew(wrapper: VueWrapper<any>) {
  expect(has(wrapper, 'renewal-warning-line')).toBe(false)
  expect(has(wrapper, 'renewal-banner')).toBe(false)
}

beforeEach(() => {
  vi.clearAllMocks()
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

describe('banners and the warning line', () => {
  it.each([
    { prompt: 'none', viewer: NOT_ONBOARDED_MEMBER },
    { prompt: 'none', viewer: ADMIN_WITHOUT_OCCUPATION },
    { prompt: 'president-not-cleared', viewer: ADMIN_WITHOUT_OCCUPATION },
    { prompt: 'member-countdown', viewer: NOT_ONBOARDED_MEMBER },
  ] as const)(
    'gives an uncleared $viewer.role on $prompt the warning and nothing new',
    async ({ prompt, viewer }) => {
      const wrapper = await mountHq({ prompt }, viewer)

      expect(has(wrapper, 'hide-page-content')).toBe(true)
      expectNothingNew(wrapper)
    }
  )

  it('leaves HQ as usual for a cleared member on prompt none', async () => {
    const wrapper = await mountHq({ prompt: 'none' })

    expectHqAsUsual(wrapper)
    expectNothingNew(wrapper)
  })

  it.each([
    {
      viewer: NOT_ONBOARDED_MEMBER,
      buttons: 1,
      date: 'Sept 16',
      month: 9,
      day: 16,
      closes: 'will close in 14 days',
    },
    {
      viewer: NOT_ONBOARDED_MEMBER,
      buttons: 1,
      date: 'Sept 29',
      month: 9,
      day: 29,
      closes: 'will close in 1 day',
    },
    {
      viewer: NOT_ONBOARDED_MEMBER,
      buttons: 1,
      date: 'Sept 30',
      month: 9,
      day: 30,
      closes: 'will close after today',
    },
    {
      viewer: NOT_ONBOARDED_MEMBER,
      buttons: 1,
      date: 'Oct 1',
      month: 10,
      day: 1,
      closes: 'will close today',
    },
    {
      viewer: ADMIN_WITHOUT_OCCUPATION,
      buttons: 2,
      date: 'Sept 16',
      month: 9,
      day: 16,
      closes: 'will close in 14 days',
    },
  ] as const)(
    'adds the line to the warning for an uncleared $viewer.role on $date',
    async ({ viewer, buttons, month, day, closes }) => {
      setDate(month, day)
      const wrapper = await mountHq({ prompt: 'member-not-cleared' }, viewer)

      const callout = wrapper.get(byId('hide-page-content'))
      expect(callout.get(byId('renewal-warning-line')).text()).toContain(closes)
      expect(callout.findAll('button')).toHaveLength(buttons)
      expect(has(wrapper, 'renewal-banner')).toBe(false)
    }
  )

  it.each([
    {
      month: 9,
      day: 16,
      hour: 12,
      minute: 0,
      title: 'Your chapter closes in 14 days',
    },
    {
      month: 9,
      day: 29,
      hour: 0,
      minute: 5,
      title: 'Your chapter closes in 1 day',
    },
    {
      month: 9,
      day: 29,
      hour: 23,
      minute: 55,
      title: 'Your chapter closes in 1 day',
    },
    {
      month: 9,
      day: 30,
      hour: 0,
      minute: 5,
      title: 'Last day to keep your chapter open',
    },
    {
      month: 10,
      day: 1,
      hour: 12,
      minute: 0,
      title: 'Last day to keep your chapter open',
    },
  ])(
    'titles the countdown banner "$title" at $hour:$minute on $month/$day',
    async ({ month, day, hour, minute, title }) => {
      setDate(month, day, hour, minute)
      const wrapper = await mountHq({ prompt: 'member-countdown' })

      expect(textOf(wrapper, 'renewal-banner')).toContain(title)
      expectHqAsUsual(wrapper)
    }
  )
})
