import {
  NTHS_RECRUITMENT_TEMPLATES_URL,
  type AffiliationStatus,
} from '@/services/NTHSGroupService'
import { useNthsStore } from '@/stores/nths'
import DoThisNextCard from '@/components/NTHS/HQ/DoThisNextCard.vue'
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
const getNTHSChecklist = vi.fn()
vi.mock('@/services/NetworkService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/NetworkService')>()),
  default: {
    getNTHSChapterImpact: (groupId: string) => getNTHSChapterImpact(groupId),
    getNTHSChapterRoster: (groupId: string) => getNTHSChapterRoster(groupId),
    getNTHSChecklist: (groupId: string) => getNTHSChecklist(groupId),
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
      plugins: [store],
      stubs: { RouterLink: RouterLinkStub, transition: false },
    },
    attachTo: 'body',
  })
  await flushPromises()
  return wrapper
}

const DO_THIS_NEXT = '[data-testid="do-this-next"]'

beforeEach(() => {
  vi.setSystemTime(NOW)
  getNTHSChapterImpact.mockReset()
  getNTHSChapterImpact.mockResolvedValue({ data: { impact: IMPACT } })
  getNTHSChapterRoster.mockReset()
  getNTHSChapterRoster.mockResolvedValue(
    rosterResponse([member({ userId: 'user-1' })])
  )
  getNTHSChecklist.mockReset()
  getNTHSChecklist.mockResolvedValue({
    checklist: {
      sections: [
        {
          id: 1,
          title: 'Get started',
          order: 1,
          items: [
            {
              key: 'invite-members',
              order: 1,
              title: 'Invite members',
              resources: [],
              checkable: true,
              skippable: true,
              status: 'incomplete',
            },
          ],
        },
      ],
    },
  })
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

  it('gives a member the invite link and scripts', async () => {
    const wrapper = await getWrapper('member')

    expect(wrapper.findComponent({ name: 'InviteLink' }).props()).toMatchObject(
      {
        code: 'ABC123',
        referralCode: 'PERSON123',
      }
    )
    const link = wrapper.find('[data-testid="invite-scripts"]')
    expect(link.attributes('href')).toBe(NTHS_RECRUITMENT_TEMPLATES_URL)
  })

  it('keeps the rest of the page when the numbers fail to load', async () => {
    getNTHSChapterImpact.mockRejectedValue(new Error('boom'))
    const wrapper = await getWrapper()

    expect(wrapper.find('[data-testid="impact-error"]').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'InviteLink' }).exists()).toBe(true)
  })

  it.each([
    { roleName: 'admin', shown: true },
    { roleName: 'member', shown: false },
  ])(
    'shows the admin-only sections to $roleName: $shown',
    async ({ roleName, shown }) => {
      const wrapper = await getWrapper(roleName)

      expect(wrapper.find(DO_THIS_NEXT).exists()).toBe(shown)
      expect(wrapper.find('[data-testid="home-members"]').exists()).toBe(shown)
    }
  )

  it('loads the rest of Home without waiting for the checklist', async () => {
    getNTHSChecklist.mockReturnValue(new Promise(() => {}))
    const wrapper = await getWrapper('admin')

    expect(wrapper.find(DO_THIS_NEXT).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'InviteLink' }).exists()).toBe(true)
    expect(wrapper.find('[data-testid="impact-students"]').text()).toBe('2')
    expect(wrapper.find('[data-testid="home-members"]').exists()).toBe(true)
  })

  it('moves focus to Invite members once DoThisNextCard finishes', async () => {
    const wrapper = await getWrapper('admin', 'user-1', 'AFFILIATED')

    wrapper.findComponent(DoThisNextCard).vm.$emit('finished')

    const invite = wrapper.find('[data-testid="invite"]').element
    await vi.waitFor(() => expect(document.activeElement).toBe(invite))
  })
})
