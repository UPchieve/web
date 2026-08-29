import Card from '@/components/NTHS/Card.vue'
import SchoolAffiliation from '@/components/NTHS/SchoolAffiliation.vue'
import NTHSSettingsView from '@/views/NTHS/Tabs/NTHSSettingsView.vue'
import { page } from '@vitest/browser/context'
import {
  enableAutoUnmount,
  flushPromises,
  mount,
  type VueWrapper,
} from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'

vi.mock('@/store', () => ({ default: { dispatch: vi.fn() } }))

const TWO_COLUMN_WIDTH = 1400
const LEAVE_TEAM_BUTTON = '[data-testid="leave-team-button"]'

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
  })
}

enableAutoUnmount(afterEach)

async function getWrapper(roleName = 'admin') {
  const wrapper = mount(NTHSSettingsView, {
    // the column assertions measure real boxes, so the view has to live in the
    // document
    attachTo: 'body',
    global: { plugins: [storeFor(roleName)] },
  })
  // the machine leaves Initial only once setInitialState has sent its event, and
  // the picker is blank until then
  await flushPromises()
  return wrapper
}

function boxes(wrapper: VueWrapper) {
  return {
    editCard: wrapper.findComponent(Card).element.getBoundingClientRect(),
    leaveTeam: wrapper.find(LEAVE_TEAM_BUTTON).element.getBoundingClientRect(),
    picker: wrapper
      .findComponent(SchoolAffiliation)
      .element.getBoundingClientRect(),
  }
}

describe('NTHSSettingsView', () => {
  it('keeps Leave Team out of the edit card', async () => {
    const wrapper = await getWrapper()
    const editCard = wrapper.findComponent(Card).element
    const leaveTeam = wrapper.find(LEAVE_TEAM_BUTTON).element
    expect(editCard.contains(leaveTeam)).toBe(false)
  })

  it('puts the path picker beside the edit card and Leave Team when there is room', async () => {
    await page.viewport(TWO_COLUMN_WIDTH, 900)
    const { editCard, leaveTeam, picker } = boxes(await getWrapper())

    expect(leaveTeam.left).toBeCloseTo(editCard.left, 0)
    expect(leaveTeam.top).toBeGreaterThanOrEqual(editCard.bottom)
    expect(picker.left).toBeGreaterThanOrEqual(editCard.right)
    expect(picker.top).toBeCloseTo(editCard.top, 0)
  })

  it('keeps the edit card and the path picker away from a member', async () => {
    const wrapper = await getWrapper('member')

    expect(wrapper.findComponent(Card).exists()).toBe(false)
    expect(wrapper.findComponent(SchoolAffiliation).exists()).toBe(false)
    expect(wrapper.find(LEAVE_TEAM_BUTTON).exists()).toBe(true)
  })
})
