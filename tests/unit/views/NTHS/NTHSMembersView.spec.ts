import NTHSMembersView from '@/views/NTHS/Tabs/NTHSMembersView.vue'
import vuetify from '@/plugins/vuetify'
import LoggerService from '@/services/LoggerService'
import { titleChoices } from '@/services/NTHSRosterService'
import { member, rosterResponse } from '../../fixtures/nths'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import { useNthsStore } from '@/stores/nths'

const getNTHSChapterRoster = vi.fn()
const updateNTHSGroupMember = vi.fn()
const refreshNTHSGroups = vi.fn()
vi.mock('@/services/NetworkService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/NetworkService')>()),
  default: {
    getNTHSChapterRoster: (...args: unknown[]) => getNTHSChapterRoster(...args),
    updateNTHSGroupMember: (...args: unknown[]) =>
      updateNTHSGroupMember(...args),
  },
}))

const showNthsUserManagementModal = vi.fn()
const showNthsMemberTitleModal = vi.fn()
const showConfirm = vi.fn()
vi.mock('@/services/ModalService', () => ({
  default: {
    showNthsUserManagementModal: (props: unknown) =>
      showNthsUserManagementModal(props),
    showNthsMemberTitleModal: (props: unknown) =>
      showNthsMemberTitleModal(props),
    showConfirm: (...args: unknown[]) => showConfirm(...args),
  },
}))

// Thursday October 15th, local time.
const NOW = new Date(2026, 9, 15, 12)

const MEMBERS = [
  member({ userId: 'president', firstName: 'Pat', roleName: 'admin' }),
  member({ userId: 'taylor', firstName: 'Taylor', trainingComplete: false }),
  member({ userId: 'sam', firstName: 'Sam', safetyApproved: false }),
  member({ userId: 'jordan', firstName: 'Jordan' }),
  member({ userId: 'riley', firstName: 'Riley' }),
]

function storeFor(viewerId = 'president') {
  const nths = useNthsStore()
  nths.NTHSGroups = [
    {
      groupInfo: {
        id: 'group-123',
        name: 'Test Chapter',
        createdAt: new Date(2025, 8, 2, 15).toISOString(),
      },
      memberInfo: { roleName: 'admin' },
    },
  ]
  nths.NTHSGroupMembers = {}
  vi.spyOn(nths, 'refreshNTHSGroups').mockImplementation(() =>
    refreshNTHSGroups()
  )
  return createStore({
    state: {
      user: { user: { id: viewerId } },
    },
  })
}

enableAutoUnmount(afterEach)

async function getWrapper({ viewerId = 'president' } = {}) {
  const wrapper = mount(NTHSMembersView, {
    global: { plugins: [storeFor(viewerId), vuetify] },
    attachTo: 'body',
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  localStorage.clear()
  vi.setSystemTime(NOW)
  getNTHSChapterRoster.mockReset()
  updateNTHSGroupMember.mockReset()
  refreshNTHSGroups.mockReset()
  refreshNTHSGroups.mockResolvedValue(undefined)
  showNthsUserManagementModal.mockReset()
  showNthsMemberTitleModal.mockReset()
  showNthsMemberTitleModal.mockResolvedValue('Member')
  showConfirm.mockReset()
  getNTHSChapterRoster.mockResolvedValue(rosterResponse(MEMBERS))
})

afterEach(() => vi.useRealTimers())

type Wrapper = Awaited<ReturnType<typeof getWrapper>>

function rows(wrapper: Wrapper) {
  return wrapper.findAll('[data-testid="members-table-row"]')
}

function row(wrapper: Wrapper, userId: string) {
  return rows(wrapper).find((candidate) =>
    candidate.find(`[data-testid="member-actions-${userId}"]`).exists()
  )!
}

function chipCount(wrapper: Wrapper, filter: string) {
  const text = wrapper
    .find(`[data-testid="members-table-chip-${filter}"]`)
    .text()
  return Number(text.match(/\((\d+)\)$/)?.[1])
}

function expanded(wrapper: Wrapper, userId: string) {
  return wrapper
    .find(`[data-testid="member-actions-${userId}"]`)
    .attributes('aria-expanded')
}

function lastRange() {
  return getNTHSChapterRoster.mock.calls.at(-1)?.[2]
}

async function clickInMenu(selector: string) {
  document.querySelector<HTMLElement>(selector)!.click()
  await flushPromises()
}

async function openRangePicker(wrapper: Wrapper) {
  await wrapper.find('[data-testid="roster-range-button"]').trigger('click')
  await flushPromises()
}

describe('NTHSMembersView', () => {
  describe('range', () => {
    it('opens on this week, from Monday through today', async () => {
      await getWrapper()

      expect(getNTHSChapterRoster).toHaveBeenCalledTimes(1)
      expect(lastRange()).toEqual({
        startsAt: new Date(2026, 9, 12),
        endsAt: new Date(2026, 9, 16),
      })
    })

    it('refetches a quick pick and keeps it and the sort for the next visit', async () => {
      const first = await getWrapper()
      await openRangePicker(first)
      await clickInMenu('[data-testid="roster-range-thisMonth"]')
      await first
        .find('[data-testid="members-table-sort-sessions"]')
        .trigger('click')
      expect(lastRange()).toEqual({
        startsAt: new Date(2026, 9, 1),
        endsAt: new Date(2026, 9, 16),
      })
      first.unmount()

      const second = await getWrapper()

      expect(lastRange()).toEqual({
        startsAt: new Date(2026, 9, 1),
        endsAt: new Date(2026, 9, 16),
      })
      expect(
        second
          .find('[data-testid="members-table-th-sessions"]')
          .attributes('aria-sort')
      ).toBe('ascending')
    })

    it('refetches days picked on the calendar and starts the next visit on this week', async () => {
      const first = await getWrapper()
      await openRangePicker(first)
      await clickInMenu('[data-v-date="2026-10-06"]')
      await clickInMenu('[data-v-date="2026-10-08"]')
      await clickInMenu('[data-testid="roster-range-done"]')
      expect(lastRange()).toEqual({
        startsAt: new Date(2026, 9, 6),
        endsAt: new Date(2026, 9, 9),
      })
      first.unmount()

      await getWrapper()

      expect(lastRange()).toEqual({
        startsAt: new Date(2026, 9, 12),
        endsAt: new Date(2026, 9, 16),
      })
    })

    it('waits for the school year from the roster before counting this school year', async () => {
      localStorage.setItem(
        'president-nths-roster-view',
        JSON.stringify({ period: 'thisSchoolYear' })
      )

      await getWrapper()

      expect(getNTHSChapterRoster).toHaveBeenCalledTimes(2)
      expect(getNTHSChapterRoster.mock.calls[0][2]).toBeUndefined()
      expect(lastRange()).toEqual({
        startsAt: new Date('2026-07-01T00:00:00.000Z'),
        endsAt: new Date(2026, 9, 16),
      })
    })

    it('shows no rows until the range load for the school year lands', async () => {
      localStorage.setItem(
        'president-nths-roster-view',
        JSON.stringify({ period: 'thisSchoolYear' })
      )
      let finishSecondLoad!: (response: unknown) => void
      getNTHSChapterRoster
        .mockResolvedValueOnce(rosterResponse(MEMBERS))
        .mockReturnValueOnce(
          new Promise((resolve) => (finishSecondLoad = resolve))
        )

      const wrapper = await getWrapper()
      expect(wrapper.find('[data-testid="members-table-row"]').exists()).toBe(
        false
      )

      finishSecondLoad(rosterResponse(MEMBERS))
      await flushPromises()

      expect(wrapper.find('[data-testid="members-table-row"]').exists()).toBe(
        true
      )
    })

    it('sends no range and shows the error when the first school-year load fails', async () => {
      localStorage.setItem(
        'president-nths-roster-view',
        JSON.stringify({ period: 'thisSchoolYear' })
      )
      getNTHSChapterRoster.mockRejectedValueOnce(new Error('network down'))

      const wrapper = await getWrapper()

      expect(getNTHSChapterRoster).toHaveBeenCalledTimes(1)
      expect(wrapper.find('[data-testid="members-table-error"]').exists()).toBe(
        true
      )
    })

    it('shows the error rather than the old range when the refetch fails', async () => {
      const wrapper = await getWrapper()
      getNTHSChapterRoster.mockRejectedValueOnce(new Error('network down'))
      await openRangePicker(wrapper)
      await clickInMenu('[data-testid="roster-range-thisMonth"]')

      expect(wrapper.find('[data-testid="members-table-error"]').exists()).toBe(
        true
      )
      expect(wrapper.find('[data-testid="members-table-row"]').exists()).toBe(
        false
      )
    })

    it('counts all time from the founding day', async () => {
      localStorage.setItem(
        'president-nths-roster-view',
        JSON.stringify({ period: 'allTime' })
      )

      await getWrapper()

      expect(lastRange()).toEqual({
        startsAt: new Date(2025, 8, 2),
        endsAt: new Date(2026, 9, 16),
      })
    })

    it('reloads the roster when the renewal prompt changes', async () => {
      await getWrapper()

      const [group] = useNthsStore().NTHSGroups as {
        renewal?: { prompt: string }
      }[]
      group.renewal = { prompt: 'confirm-return' }
      await flushPromises()

      expect(getNTHSChapterRoster).toHaveBeenCalledTimes(2)
      expect(lastRange()).toEqual({
        startsAt: new Date(2026, 9, 12),
        endsAt: new Date(2026, 9, 16),
      })
    })
  })

  describe('row actions', () => {
    it('makes a member an admin with the title chosen in the same step, patches the row immediately, and refreshes the roster in the background', async () => {
      updateNTHSGroupMember.mockResolvedValue(undefined)
      showNthsMemberTitleModal.mockResolvedValue('Vice President')
      const wrapper = await getWrapper()
      const sam = MEMBERS.find((m) => m.userId === 'sam')!

      // The refresh never resolves, so the row can only change from the patch.
      getNTHSChapterRoster.mockReturnValueOnce(new Promise(() => {}))

      await wrapper.find('[data-testid="member-actions-sam"]').trigger('click')
      await wrapper
        .find('[data-testid="member-make-admin-sam"]')
        .trigger('click')
      await flushPromises()

      expect(showNthsMemberTitleModal.mock.calls[0][0].choices).toEqual(
        titleChoices(sam, MEMBERS, true)
      )
      expect(updateNTHSGroupMember).toHaveBeenCalledWith('group-123', 'sam', {
        role: 'admin',
        title: 'Vice President',
      })
      expect(row(wrapper, 'sam').text()).toContain('Vice President')
      expect(chipCount(wrapper, 'everyone')).toBe(5)
      expect(getNTHSChapterRoster).toHaveBeenCalledTimes(2)
    })

    it.each([
      { viewerId: 'sam', refreshes: true },
      { viewerId: 'president', refreshes: false },
    ])(
      'refreshes the viewer renewal state only for their own row, viewer $viewerId',
      async ({ viewerId, refreshes }) => {
        updateNTHSGroupMember.mockResolvedValue(undefined)
        showNthsMemberTitleModal.mockResolvedValue('Executive Board Member')
        const wrapper = await getWrapper({ viewerId })

        await wrapper
          .find('[data-testid="member-actions-sam"]')
          .trigger('click')
        await wrapper
          .find('[data-testid="member-change-title-sam"]')
          .trigger('click')
        await flushPromises()

        expect(refreshNTHSGroups).toHaveBeenCalledTimes(refreshes ? 1 : 0)
      }
    )

    it('sends nothing when the title choice is cancelled', async () => {
      showNthsMemberTitleModal.mockResolvedValue(undefined)
      const wrapper = await getWrapper()

      await wrapper.find('[data-testid="member-actions-sam"]').trigger('click')
      await wrapper
        .find('[data-testid="member-make-admin-sam"]')
        .trigger('click')
      await flushPromises()

      expect(updateNTHSGroupMember).not.toHaveBeenCalled()
    })

    it("changes a plain member's title from the choices a plain member can hold", async () => {
      updateNTHSGroupMember.mockResolvedValue(undefined)
      showNthsMemberTitleModal.mockResolvedValue('Executive Board Member')
      const wrapper = await getWrapper()
      const sam = MEMBERS.find((m) => m.userId === 'sam')!

      await wrapper.find('[data-testid="member-actions-sam"]').trigger('click')
      await wrapper
        .find('[data-testid="member-change-title-sam"]')
        .trigger('click')
      await flushPromises()

      expect(showNthsMemberTitleModal.mock.calls[0][0].choices).toEqual(
        titleChoices(sam, MEMBERS, false)
      )
      expect(updateNTHSGroupMember).toHaveBeenCalledWith('group-123', 'sam', {
        title: 'Executive Board Member',
      })
    })

    describe('removing admin', () => {
      it.each([
        ['President', true, 'Member'],
        ['Executive Board Member', false, 'Executive Board Member'],
      ] as const)(
        'from a %s admin asks to confirm the title loss: %s, leaving %s',
        async (title, confirms, titleAfter) => {
          const admin = member({
            userId: 'casey',
            firstName: 'Casey',
            roleName: 'admin',
            title,
          })
          const roster = [...MEMBERS, admin]
          getNTHSChapterRoster.mockResolvedValue(rosterResponse(roster))
          updateNTHSGroupMember.mockResolvedValue(undefined)
          showConfirm.mockResolvedValue(true)
          const wrapper = await getWrapper()
          getNTHSChapterRoster.mockReturnValueOnce(new Promise(() => {}))

          await wrapper
            .find('[data-testid="member-actions-casey"]')
            .trigger('click')
          await wrapper
            .find('[data-testid="member-remove-admin-casey"]')
            .trigger('click')
          await flushPromises()

          expect(showConfirm).toHaveBeenCalledTimes(confirms ? 1 : 0)
          expect(updateNTHSGroupMember).toHaveBeenCalledWith(
            'group-123',
            'casey',
            { role: 'member' }
          )
          expect(
            row(wrapper, 'casey').find('[data-testid="member-role"]').text()
          ).toBe(titleAfter)
        }
      )

      it('changes nothing when the confirmation is cancelled', async () => {
        const president = member({
          userId: 'casey',
          roleName: 'admin',
          title: 'President',
        })
        getNTHSChapterRoster.mockResolvedValue(
          rosterResponse([...MEMBERS, president])
        )
        showConfirm.mockResolvedValue(false)
        const wrapper = await getWrapper()

        await wrapper
          .find('[data-testid="member-actions-casey"]')
          .trigger('click')
        await wrapper
          .find('[data-testid="member-remove-admin-casey"]')
          .trigger('click')
        await flushPromises()

        expect(updateNTHSGroupMember).not.toHaveBeenCalled()
      })
    })

    it('drops the row immediately and refreshes the roster in the background once the remove modal reports the member gone', async () => {
      const wrapper = await getWrapper()

      getNTHSChapterRoster.mockReturnValueOnce(new Promise(() => {}))

      await wrapper.find('[data-testid="member-actions-sam"]').trigger('click')
      await wrapper.find('[data-testid="member-remove-sam"]').trigger('click')

      const props = showNthsUserManagementModal.mock.calls[0][0]
      expect(props.memberToRemove.nthsGroupId).toBe('group-123')
      props.onRemoved()
      await flushPromises()

      expect(rows(wrapper)).toHaveLength(4)
      expect(chipCount(wrapper, 'everyone')).toBe(4)
      expect(getNTHSChapterRoster).toHaveBeenCalledTimes(2)
    })

    it('shows a friendly role-change error in an alert and logs the raw error once', async () => {
      const raw = new Error('Database update error: null value in column')
      updateNTHSGroupMember.mockRejectedValue(raw)
      const noticeError = vi
        .spyOn(LoggerService, 'noticeError')
        .mockImplementation(() => {})
      const wrapper = await getWrapper()

      await wrapper.find('[data-testid="member-actions-sam"]').trigger('click')
      await wrapper
        .find('[data-testid="member-make-admin-sam"]')
        .trigger('click')
      await flushPromises()

      const error = wrapper.find('[data-testid="roster-error"]')
      expect(error.attributes('role')).toBe('alert')
      expect(error.text()).not.toContain(raw.message)
      expect(noticeError).toHaveBeenCalledTimes(1)
      expect(noticeError.mock.calls[0][0]).toBe(raw)
    })

    it('keeps each pending role change busy until its own request settles', async () => {
      const pending: Record<string, () => void> = {}
      updateNTHSGroupMember.mockImplementation(
        (_groupId: string, userId: string) =>
          new Promise<void>((resolve) => {
            pending[userId] = resolve
          })
      )
      const wrapper = await getWrapper()
      const trigger = (userId: string) =>
        wrapper.find(`[data-testid="member-actions-${userId}"]`)

      await trigger('sam').trigger('click')
      await wrapper
        .find('[data-testid="member-make-admin-sam"]')
        .trigger('click')
      await trigger('taylor').trigger('click')
      await wrapper
        .find('[data-testid="member-make-admin-taylor"]')
        .trigger('click')

      expect(trigger('sam').attributes('aria-disabled')).toBe('true')
      expect(trigger('taylor').attributes('aria-disabled')).toBe('true')

      pending.sam()
      await flushPromises()
      expect(trigger('sam').attributes('aria-disabled')).toBe('false')
      expect(trigger('taylor').attributes('aria-disabled')).toBe('true')
    })

    it('opens the second row menu instead of closing both when its trigger is clicked while another is open', async () => {
      const wrapper = await getWrapper()

      await wrapper.find('[data-testid="member-actions-sam"]').trigger('click')
      expect(expanded(wrapper, 'sam')).toBe('true')

      await wrapper
        .find('[data-testid="member-actions-taylor"]')
        .trigger('click')

      expect(expanded(wrapper, 'taylor')).toBe('true')
      expect(expanded(wrapper, 'sam')).toBe('false')
    })
  })

  describe('permissions', () => {
    it('offers an admin only a title change on their own row', async () => {
      const wrapper = await getWrapper()
      await wrapper
        .find('[data-testid="member-actions-president"]')
        .trigger('click')
      expect(
        wrapper
          .findAll('[role="menuitem"]')
          .map((item) => item.attributes('data-testid'))
      ).toEqual(['member-change-title-president'])
    })
  })
})
