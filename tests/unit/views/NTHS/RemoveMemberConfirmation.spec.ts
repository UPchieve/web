import RemoveMemberConfirmation from '@/views/NTHS/RemoveMemberConfirmation.vue'
import LoggerService from '@/services/LoggerService'
import type { GroupMember } from '@/services/NTHSGroupService'
import { NetworkError } from '@/services/NetworkService'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  title: null,
  roleName: 'member' as const,
  firstName: 'Sam',
  lastInitial: 'Q',
}

const SOLE_ADMIN_ERROR = new NetworkError(
  'Cannot remove the only existing admin of a group',
  { status: 422 }
)

function getWrapper(
  isRemovingSelf = false,
  cachedMembers?: (typeof MEMBER)[],
  member: GroupMember = MEMBER,
  freshMembers?: (typeof MEMBER)[] | Error
) {
  const setNTHSGroupMembers = vi.fn()
  const state = {
    nths: {
      NTHSGroupMembers: cachedMembers
        ? { [MEMBER.nthsGroupId]: cachedMembers }
        : {},
    },
  }
  const fetchNTHSGroupMembers = vi.fn(async () => {
    if (freshMembers instanceof Error) throw freshMembers
    if (freshMembers) {
      state.nths.NTHSGroupMembers[MEMBER.nthsGroupId] = freshMembers
    }
  })
  const store = createStore({
    state,
    mutations: { 'nths/setNTHSGroupMembers': setNTHSGroupMembers },
    actions: {
      'nths/fetchNthsData': vi.fn(),
      'app/modal/hide': vi.fn(),
      'nths/fetchNTHSGroupMembers': fetchNTHSGroupMembers,
    },
  })
  const wrapper = mount(RemoveMemberConfirmation, {
    props: { memberToRemove: member, isRemovingSelf },
    global: { plugins: [store] },
  })
  return { wrapper, setNTHSGroupMembers, fetchNTHSGroupMembers }
}

let noticeError: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  updateNTHSGroupMember.mockReset()
  leaveNthsChapter.mockReset()
  noticeError = vi
    .spyOn(LoggerService, 'noticeError')
    .mockImplementation(() => {})
})

afterEach(() => noticeError.mockRestore())

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

  const OTHER_JORDAN = { ...MEMBER, userId: 'jordan' }

  it.each([
    [
      'a sole admin leaving with another current member on the roster',
      SOLE_ADMIN_ERROR,
      [MEMBER, OTHER_JORDAN],
      "You're the only admin. Make another member an admin before you leave.",
      0,
      true,
    ],
    [
      'a sole admin who is also the only current member',
      SOLE_ADMIN_ERROR,
      [MEMBER],
      "You're the only member, so there's no one to hand the chapter to. Contact us to close it.",
      0,
      true,
    ],
    [
      'a sole admin whose only other roster row is a closed account',
      SOLE_ADMIN_ERROR,
      [MEMBER, { ...OTHER_JORDAN, accountClosed: true }],
      "You're the only member, so there's no one to hand the chapter to. Contact us to close it.",
      0,
      true,
    ],
    [
      'a 422 that is not the sole-admin refusal',
      new NetworkError('Some other rejection', { status: 422 }),
      undefined,
      'Something went wrong while leaving the chapter. Please refresh the page and try again.',
      1,
      false,
    ],
    [
      'the member refetch failing after a sole-admin refusal',
      SOLE_ADMIN_ERROR,
      new Error('network down'),
      "You're the only admin. Make another member an admin before you leave.",
      0,
      true,
    ],
  ] as const)(
    'when leaving fails with %s',
    async (
      _label,
      rejection,
      freshMembers,
      expectedMessage,
      expectedNoticeErrorCalls,
      expectRefetch
    ) => {
      leaveNthsChapter.mockRejectedValue(rejection)
      const { wrapper, fetchNTHSGroupMembers } = getWrapper(
        true,
        undefined,
        MEMBER,
        freshMembers as (typeof MEMBER)[] | Error | undefined
      )

      await wrapper.find('[data-testid="confirm-remove-self"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-testid="remove-error"]').text()).toBe(
        expectedMessage
      )
      expect(noticeError).toHaveBeenCalledTimes(expectedNoticeErrorCalls)
      expect(fetchNTHSGroupMembers).toHaveBeenCalledTimes(expectRefetch ? 1 : 0)
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
