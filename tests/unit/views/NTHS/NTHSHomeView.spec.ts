import {
  NTHS_RECRUITMENT_TEMPLATES_URL,
  type AffiliationStatus,
} from '@/services/NTHSGroupService'
import { STANDING_LABELS, standingFor } from '@/services/NTHSImpactService'
import { rosterPeriodStarts } from '@/services/NTHSRosterService'
import nths from '@/store/modules/nths'
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
import { impact } from '../../fixtures/nths'

vi.mock('@/store', () => ({ default: { dispatch: vi.fn() } }))
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push: vi.fn() }),
}))

const getNTHSChapterImpact = vi.fn()
const getActionsForNTHSGroup = vi.fn()
vi.mock('@/services/NetworkService', () => ({
  default: {
    getNTHSChapterImpact: (groupId: string, monthStartsAt: Date) =>
      getNTHSChapterImpact(groupId, monthStartsAt),
    getActionsForNTHSGroup: (groupId: string) =>
      getActionsForNTHSGroup(groupId),
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
  return createStore({
    state: { user: { user: { id: userId } } },
    modules: {
      nths: {
        ...nths,
        state: () => ({
          ...nths.state,
          NTHSGroups: [
            {
              groupInfo: {
                id: 'group-123',
                name: 'Test Chapter',
                inviteCode: 'ABC123',
              },
              memberInfo: { roleName },
              schoolAffiliationStatus,
            },
          ],
        }),
      },
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
  getActionsForNTHSGroup.mockReset()
  getActionsForNTHSGroup.mockResolvedValue({
    data: {
      groupId: 'group-123',
      actions: [{ id: 1, name: 'NAMED YOUR TEAM' }],
      groupActions: [],
    },
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('NTHSHomeView', () => {
  it('shows the impact numbers the endpoint returned', async () => {
    const wrapper = await getWrapper()

    expect(getNTHSChapterImpact).toHaveBeenCalledWith(
      'group-123',
      rosterPeriodStarts(NOW).thisMonth
    )
    expect(wrapper.find('[data-testid="students-helped"]').text()).toBe('2')
    expect(wrapper.find('[data-testid="sessions-completed"]').text()).toBe('4')
    expect(wrapper.find('[data-testid="impact-all-time"]').text()).toContain(
      '4.5'
    )
    expect(wrapper.find('[data-testid="standing-chip"]').text()).toBe(
      STANDING_LABELS[standingFor(IMPACT)]
    )
  })

  it('gives a member the invite link and scripts', async () => {
    const wrapper = await getWrapper('member')

    expect(wrapper.findComponent({ name: 'InviteLink' }).exists()).toBe(true)
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
    getActionsForNTHSGroup.mockReturnValue(new Promise(() => {}))
    const wrapper = await getWrapper('admin')

    expect(wrapper.find(DO_THIS_NEXT).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'InviteLink' }).exists()).toBe(true)
    expect(wrapper.find('[data-testid="students-helped"]').text()).toBe('2')
    expect(wrapper.find('[data-testid="home-members"]').exists()).toBe(true)
  })

  it('moves focus to Invite members once DoThisNextCard finishes', async () => {
    const wrapper = await getWrapper('admin', 'user-1', 'AFFILIATED')

    wrapper.findComponent(DoThisNextCard).vm.$emit('finished')

    const invite = wrapper.find('[data-testid="invite"]').element
    await vi.waitFor(() => expect(document.activeElement).toBe(invite))
  })
})
