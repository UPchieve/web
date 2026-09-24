import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import nths from '@/store/modules/nths'
import NTHSToDoView from '@/views/NTHS/Tabs/NTHSToDoView.vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'

// Importing the real nths module below pulls in a circular reference to
// src/store/index.ts unless that module is mocked first.
vi.mock('@/store', () => ({ default: { dispatch: vi.fn() } }))

const GROUP_ID = 'group-123'

function getWrapper() {
  const store = createStore({
    modules: {
      nths: {
        ...nths,
        state: () => ({
          ...nths.state,
          NTHSGroups: [
            {
              groupInfo: { id: GROUP_ID },
              memberInfo: { roleName: 'admin' },
              schoolAffiliationStatus: null,
            },
          ],
        }),
      },
    },
  })
  return mount(NTHSToDoView, { global: { plugins: [store] } })
}

enableAutoUnmount(afterEach)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('NTHSToDoView', () => {
  it.each([
    [
      'is still loading',
      () =>
        vi
          .spyOn(NetworkService, 'getActionsForNTHSGroup')
          .mockReturnValue(new Promise(() => {})),
      'checklist-loading',
    ],
    [
      'fails to load',
      () => {
        vi.spyOn(LoggerService, 'noticeError').mockImplementation(() => {})
        vi.spyOn(NetworkService, 'getActionsForNTHSGroup').mockRejectedValue(
          new Error('boom')
        )
      },
      'checklist-error',
    ],
    [
      'has nothing on it',
      () =>
        vi.spyOn(NetworkService, 'getActionsForNTHSGroup').mockResolvedValue({
          data: { groupId: GROUP_ID, actions: [], groupActions: [] },
        } as never),
      'checklist-empty',
    ],
  ])(
    'shows the right state when the checklist %s',
    async (_label, setUp, testId) => {
      setUp()
      const wrapper = getWrapper()
      await flushPromises()

      expect(wrapper.find(`[data-testid="${testId}"]`).exists()).toBe(true)
    }
  )
})
