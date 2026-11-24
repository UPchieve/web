import type { AffiliationStatus } from '@/services/NTHSGroupService'
import vuetify from '@/plugins/vuetify'
import { useNthsStore } from '@/stores/nths'
import NTHSHomeView from '@/views/NTHS/Tabs/NTHSHomeView.vue'
import {
  enableAutoUnmount,
  flushPromises,
  mount,
  RouterLinkStub,
} from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import { impact, member, rosterResponse } from '../../fixtures/nths'

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push: vi.fn() }),
}))

const getNTHSChapterImpact = vi.fn()
const getNTHSChapterRoster = vi.fn()
const getNTHSHomeContent = vi.fn()
vi.mock('@/services/NetworkService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/NetworkService')>()),
  getNTHSHomeContent: (groupId: string) => getNTHSHomeContent(groupId),
  default: {
    getNTHSChapterImpact: (groupId: string) => getNTHSChapterImpact(groupId),
    getNTHSChapterRoster: (groupId: string) => getNTHSChapterRoster(groupId),
  },
}))

const NOW = new Date('2026-10-15T00:00:00.000Z')

const IMPACT = impact({
  schoolYearToDate: {
    studentsHelped: 2,
    sessionsCompleted: 4,
    hoursTutored: 3,
    membersTutoring: 2,
  },
  allTime: { studentsHelped: 2, sessionsCompleted: 6, hoursTutored: 4.5 },
})

function storeFor(
  roleName: string,
  userId: string,
  schoolAffiliationStatus: AffiliationStatus | null
) {
  const nths = useNthsStore()
  nths.NTHSGroups = [
    {
      groupInfo: {
        id: 'group-123',
        name: 'Test Chapter',
        inviteCode: 'ABC123',
      },
      memberInfo: { roleName },
      schoolAffiliationStatus,
    },
  ]
  return createStore({
    state: {
      user: { user: { id: userId, referralCode: 'PERSON123' } },
    },
  })
}
let store: ReturnType<typeof storeFor>

enableAutoUnmount(afterEach)

async function getWrapper(
  roleName = 'admin',
  userId = 'user-1',
  schoolAffiliationStatus: AffiliationStatus | null = null
) {
  store = storeFor(roleName, userId, schoolAffiliationStatus)
  const wrapper = mount(NTHSHomeView, {
    global: {
      plugins: [store, vuetify],
      stubs: { RouterLink: RouterLinkStub, transition: false },
    },
    attachTo: 'body',
  })
  await flushPromises()
  return wrapper
}

const RIGHT_NOW = '[data-testid="right-now"]'

const EVERYONE = {
  title: 'Everyone',
  body: '',
  link: 'https://x.org',
  forMembers: true,
}
const HOME_CONTENT = {
  tips: ['Tip of the day'],
  links: [
    { title: 'Staff', body: '', link: '/groups/resources', forMembers: false },
    EVERYONE,
  ],
}
const TIP = '[data-testid="tip"]'
const LINKS = '[data-testid="resource-links"]'

beforeEach(() => {
  vi.setSystemTime(NOW)
  getNTHSHomeContent.mockReset()
  getNTHSHomeContent.mockResolvedValue(HOME_CONTENT)
  getNTHSChapterImpact.mockReset()
  getNTHSChapterImpact.mockResolvedValue({ data: { impact: IMPACT } })
  getNTHSChapterRoster.mockReset()
  getNTHSChapterRoster.mockResolvedValue(
    rosterResponse([member({ userId: 'user-1' })])
  )
})

afterEach(() => {
  vi.useRealTimers()
})

describe('NTHSHomeView', () => {
  it.each(['admin', 'member'])(
    'shows a chapter %s the impact numbers the endpoint returned',
    async (roleName) => {
      const wrapper = await getWrapper(roleName)

      expect(getNTHSChapterImpact).toHaveBeenCalledWith('group-123')
      expect(wrapper.find('[data-testid="impact-students"]').text()).toBe('2')
      expect(wrapper.find('[data-testid="impact-sessions"]').text()).toBe('4')
    }
  )

  it.each(['admin', 'member'])(
    'shows a chapter %s the top members board built from the roster',
    async (roleName) => {
      const wrapper = await getWrapper(roleName)

      expect(wrapper.findAll('[data-testid="top-members-row"]')).toHaveLength(1)
    }
  )

  it.each([
    { roleName: 'admin', goals: true, contribution: false },
    { roleName: 'member', goals: false, contribution: true },
  ])(
    'shows a $roleName the goals card: $goals and contribution card: $contribution',
    async ({ roleName, goals, contribution }) => {
      const wrapper = await getWrapper(roleName)

      expect(wrapper.find('[data-testid="good-standing"]').exists()).toBe(goals)
      expect(wrapper.find('[data-testid="contribution"]').exists()).toBe(
        contribution
      )
    }
  )

  it('keeps the rest of the page when the numbers fail to load', async () => {
    getNTHSChapterImpact.mockRejectedValue(new Error('boom'))
    const wrapper = await getWrapper()

    expect(wrapper.find('[data-testid="impact-error"]').exists()).toBe(true)
  })

  it.each([
    { roleName: 'admin', shown: true },
    { roleName: 'member', shown: false },
  ])(
    'shows the Right now card to $roleName: $shown',
    async ({ roleName, shown }) => {
      const wrapper = await getWrapper(roleName)

      expect(wrapper.find(RIGHT_NOW).exists()).toBe(shown)
    }
  )

  it('shows an admin no Right now card while the roster loads', async () => {
    getNTHSChapterRoster.mockReturnValue(new Promise(() => {}))
    const wrapper = await getWrapper()

    expect(wrapper.find(RIGHT_NOW).exists()).toBe(false)
  })

  it.each([
    { failing: getNTHSChapterImpact },
    { failing: getNTHSChapterRoster },
  ])(
    'shows an admin no Right now card when a request fails',
    async ({ failing }) => {
      failing.mockRejectedValue(new Error('boom'))
      const wrapper = await getWrapper()

      expect(wrapper.find(RIGHT_NOW).exists()).toBe(false)
    }
  )

  it.each(['admin', 'member'])(
    'shows a chapter %s the current members table',
    async (roleName) => {
      getNTHSChapterRoster.mockResolvedValue(
        rosterResponse([
          member({ userId: 'user-1' }),
          member({ userId: 'user-2' }),
          member({ userId: 'user-3', accountClosed: true }),
        ])
      )
      const wrapper = await getWrapper(roleName)

      expect(wrapper.findAll('[data-testid="members-table-row"]')).toHaveLength(
        2
      )
    }
  )

  it('shows an admin the tip', async () => {
    const wrapper = await getWrapper('admin')

    expect(wrapper.find(TIP).exists()).toBe(true)
  })

  it.each(['admin', 'member'])(
    'keeps Home and hides both cards when the content fails for a %s',
    async (roleName) => {
      getNTHSHomeContent.mockRejectedValue(new Error('boom'))
      const wrapper = await getWrapper(roleName)

      expect(wrapper.find('[data-testid="members-table"]').exists()).toBe(true)
      expect(wrapper.find(TIP).exists()).toBe(false)
      expect(wrapper.find(LINKS).exists()).toBe(false)
    }
  )
})
