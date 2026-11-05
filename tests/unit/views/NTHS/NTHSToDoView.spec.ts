import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import { useNthsStore } from '@/stores/nths'
import NTHSToDoView from '@/views/NTHS/Tabs/NTHSToDoView.vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const GROUP_ID = 'group-123'

function getWrapper() {
  const nths = useNthsStore()
  nths.NTHSGroups = [
    {
      groupInfo: { id: GROUP_ID },
      memberInfo: { roleName: 'admin' },
      schoolAffiliationStatus: null,
    },
  ]
  return mount(NTHSToDoView)
}

enableAutoUnmount(afterEach)

describe('NTHSToDoView', () => {
  it.each([
    [
      'is still loading',
      () =>
        vi
          .spyOn(NetworkService, 'getNTHSChecklist')
          .mockReturnValue(new Promise(() => {})),
      'checklist-loading',
    ],
    [
      'fails to load',
      () => {
        vi.spyOn(LoggerService, 'noticeError').mockImplementation(() => {})
        vi.spyOn(NetworkService, 'getNTHSChecklist').mockRejectedValue(
          new Error('boom')
        )
      },
      'checklist-error',
    ],
    [
      'has nothing on it',
      () =>
        vi.spyOn(NetworkService, 'getNTHSChecklist').mockResolvedValue({
          checklist: { sections: [] },
        }),
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
