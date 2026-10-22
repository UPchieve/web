import NTHSCreateGroupView from '@/views/NTHS/NTHSCreateGroupView.vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'
import NetworkService from '@/services/NetworkService'

const replace = vi.fn()
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ replace }),
}))
vi.mock('@/services/NetworkService', () => ({
  default: { createNTHSGroup: vi.fn() },
}))

function mountView(approvalExpiresAt: string | null) {
  const store = createStore({
    state: {
      nths: {
        NTHSGroups: [],
        NTHSCandidateApplicationStatus: 'approved',
        approvalExpiresAt,
      },
    },
  })
  return mount(NTHSCreateGroupView, { global: { plugins: [store] } })
}

function textFor(approvalExpiresAt: string | null) {
  return mountView(approvalExpiresAt).text()
}

enableAutoUnmount(afterEach)

describe('NTHSCreateGroupView', () => {
  it.each(['2026-11-20T12:45:00.000Z', '2026-11-20T12:00:00.000Z'])(
    'tells the coach when their approval runs out (%s)',
    (iso) => {
      const minutes = String(new Date(iso).getMinutes()).padStart(2, '0')
      expect(textFor(iso)).toMatch(
        new RegExp(
          `Deadline to create chapter: November \\d+(st|nd|rd|th) at \\d+:${minutes}(AM|PM) \\S+`
        )
      )
    }
  )

  it('leaves the date line out when no expiry is known', () => {
    expect(textFor(null)).not.toContain('Deadline to create chapter')
  })

  describe('create fails with a 422', () => {
    const past = '2020-01-01T00:00:00.000Z'
    const future = '2999-01-01T00:00:00.000Z'

    it.each([
      ['the approval has expired', past, true],
      ['the approval is still open', future, false],
      ['no deadline is on file', null, false],
    ])('when %s', async (_, approvalExpiresAt, redirects) => {
      replace.mockClear()
      vi.mocked(NetworkService.createNTHSGroup).mockRejectedValue({
        isAxiosError: true,
        response: { status: 422, data: { err: 'School already claimed' } },
      })
      const wrapper = mountView(approvalExpiresAt)

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      if (redirects) {
        expect(replace).toHaveBeenCalledWith('/groups/application-expired')
        expect(wrapper.text()).not.toContain('School already claimed')
      } else {
        expect(replace).not.toHaveBeenCalled()
        expect(wrapper.text()).toContain('School already claimed')
      }
    })
  })
})
