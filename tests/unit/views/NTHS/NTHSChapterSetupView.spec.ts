import HQSection from '@/components/NTHS/HQ/HQSection.vue'
import SchoolAffiliation from '@/components/NTHS/SchoolAffiliation.vue'
import NTHSChapterSetupView from '@/views/NTHS/Tabs/NTHSChapterSetupView.vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'

vi.mock('@/store', () => ({ default: { dispatch: vi.fn() } }))

const LEAVE_TEAM_BUTTON = '[data-testid="leave-team-button"]'
const SETUP_SUBTITLE = '[data-testid="setup-subtitle"]'

const GROUP = {
  groupId: 'group-123',
  schoolAffiliationStatus: null,
  hasSchoolOnRecord: true,
  groupInfo: { id: 'group-123', name: 'Test Chapter' },
}

function storeFor(roleName: string) {
  return createStore({
    state: {
      nths: {
        NTHSGroups: [{ ...GROUP, memberInfo: { roleName } }],
        NTHSGroupMembers: {},
      },
      user: { user: { id: 'user-1' } },
    },
    getters: {
      'nths/hasAdminRole': () => roleName === 'admin',
    },
  })
}

enableAutoUnmount(afterEach)

async function getWrapper(roleName = 'admin') {
  const wrapper = mount(NTHSChapterSetupView, {
    global: { plugins: [storeFor(roleName)] },
  })
  // the machine leaves Initial only once setInitialState has sent its event, and
  // the picker is blank until then
  await flushPromises()
  return wrapper
}

describe('NTHSChapterSetupView', () => {
  it('keeps the name card, the path picker and the subtitle away from a member, but not Leave Team', async () => {
    const admin = await getWrapper('admin')
    const member = await getWrapper('member')

    expect(admin.findComponent(HQSection).exists()).toBe(true)
    expect(admin.findComponent(SchoolAffiliation).exists()).toBe(true)
    expect(admin.find(SETUP_SUBTITLE).exists()).toBe(true)

    expect(member.findComponent(HQSection).exists()).toBe(false)
    expect(member.findComponent(SchoolAffiliation).exists()).toBe(false)
    expect(member.find(SETUP_SUBTITLE).exists()).toBe(false)
    expect(member.find(LEAVE_TEAM_BUTTON).exists()).toBe(true)
  })
})
