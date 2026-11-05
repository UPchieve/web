import RemoveMemberConfirmation from '@/views/NTHS/RemoveMemberConfirmation.vue'
import LoggerService from '@/services/LoggerService'
import { NetworkError } from '@/services/NetworkService'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'

vi.mock('@/store', () => ({ default: { dispatch: vi.fn() } }))
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push: vi.fn() }),
}))

const updateNTHSGroupMember = vi.fn()
const leaveNthsChapter = vi.fn()
vi.mock('@/services/NetworkService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/NetworkService')>()),
  default: {
    updateNTHSGroupMember: (...args: unknown[]) =>
      updateNTHSGroupMember(...args),
    leaveNthsChapter: (...args: unknown[]) => leaveNthsChapter(...args),
  },
}))

const MEMBER = {
  userId: 'sam',
  nthsGroupId: 'group-123',
  title: 'Member' as const,
  roleName: 'member' as const,
  firstName: 'Sam',
  lastInitial: 'Q',
}

const SOLE_ADMIN_ERROR = new NetworkError(
  'Cannot remove the only existing admin of a group',
  { status: 422 }
)

function getWrapper(isRemovingSelf = false, cachedMembers?: (typeof MEMBER)[]) {
  const setNTHSGroupMembers = vi.fn()
  const state = {
    nths: {
      NTHSGroupMembers: cachedMembers
        ? { [MEMBER.nthsGroupId]: cachedMembers }
        : {},
    },
  }
  const store = createStore({
    state,
    mutations: { 'nths/setNTHSGroupMembers': setNTHSGroupMembers },
    actions: {
      'nths/fetchNthsData': vi.fn(),
    },
  })
  const wrapper = mount(RemoveMemberConfirmation, {
    props: { memberToRemove: MEMBER, isRemovingSelf },
    global: { plugins: [store] },
  })
  return { wrapper, setNTHSGroupMembers }
}

let noticeError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  updateNTHSGroupMember.mockReset()
  leaveNthsChapter.mockReset()
  noticeError = vi
    .spyOn(LoggerService, 'noticeError')
    .mockImplementation(() => {})
})

describe('RemoveMemberConfirmation', () => {
  it.each([
    ['another member', false, updateNTHSGroupMember, 'confirm-remove-member'],
    ['yourself', true, leaveNthsChapter, 'confirm-remove-self'],
  ])(
    'shows a friendly error when removing %s fails and logs the raw error once',
    async (_label, isRemovingSelf, request, confirmTestId) => {
      const raw = new Error('Database read error: connection refused')
      request.mockRejectedValue(raw)
      const { wrapper } = getWrapper(isRemovingSelf)

      await wrapper.find(`[data-testid="${confirmTestId}"]`).trigger('click')
      await flushPromises()

      const error = wrapper.find('[data-testid="remove-error"]')
      expect(error.exists()).toBe(true)
      expect(error.attributes('role')).toBe('alert')
      expect(error.text()).not.toContain(raw.message)
      expect(noticeError).toHaveBeenCalledTimes(1)
      expect(noticeError.mock.calls[0][0]).toBe(raw)
      expect(wrapper.emitted('removed')).toBeUndefined()
    }
  )

  it.each([
    [
      'a sole admin leaving the chapter',
      SOLE_ADMIN_ERROR,
      "You're the only member, so there's no one to hand the chapter to. Contact us to close it.",
      0,
    ],
    [
      'a 422 that is not the sole-admin refusal',
      new NetworkError('Some other rejection', { status: 422 }),
      'Something went wrong while leaving the chapter. Please refresh the page and try again.',
      1,
    ],
  ] as const)(
    'when leaving fails with %s',
    async (_label, rejection, expectedMessage, expectedNoticeErrorCalls) => {
      leaveNthsChapter.mockRejectedValue(rejection)
      const { wrapper } = getWrapper(true)

      await wrapper.find('[data-testid="confirm-remove-self"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-testid="remove-error"]').text()).toBe(
        expectedMessage
      )
      expect(noticeError).toHaveBeenCalledTimes(expectedNoticeErrorCalls)
    }
  )

  it('ignores a repeat click while the removal is in flight', async () => {
    let resolveRequest: () => void
    updateNTHSGroupMember.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveRequest = resolve
      })
    )
    const { wrapper } = getWrapper()
    const button = wrapper.find('[data-testid="confirm-remove-member"]')

    await button.trigger('click')
    await button.trigger('click')
    await button.trigger('click')

    expect(updateNTHSGroupMember).toHaveBeenCalledTimes(1)
    expect(button.attributes('disabled')).toBeDefined()

    resolveRequest!()
    await flushPromises()
    expect(wrapper.emitted('removed')).toHaveLength(1)
  })

  it.each([
    ['a cached roster', [MEMBER, { ...MEMBER, userId: 'jordan' }], ['jordan']],
    ['no cached roster', undefined, undefined],
  ])(
    'with %s, commits the roster with the member filtered out only when a cache exists',
    async (_label, cachedMembers, expectedRemainingIds) => {
      updateNTHSGroupMember.mockResolvedValue(undefined)
      const { wrapper, setNTHSGroupMembers } = getWrapper(false, cachedMembers)

      await wrapper
        .find('[data-testid="confirm-remove-member"]')
        .trigger('click')
      await flushPromises()

      if (expectedRemainingIds) {
        expect(setNTHSGroupMembers).toHaveBeenCalledTimes(1)
        const [, payload] = setNTHSGroupMembers.mock.calls[0]
        expect(
          payload.groupMembers.map((m: { userId: string }) => m.userId)
        ).toEqual(expectedRemainingIds)
      } else {
        expect(setNTHSGroupMembers).not.toHaveBeenCalled()
      }
      expect(wrapper.emitted('removed')).toHaveLength(1)
    }
  )
})
