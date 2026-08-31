import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import router from '@/router'
import store from '@/store'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import NTHSApplicationFormView from '@/views/NTHS/NTHSApplicationFormView.vue'
import { NTHS_APPLICATION_QUESTIONS } from '@/services/NTHSApplicationService'

vi.mock('@/services/LoggerService', () => ({
  default: { noticeError: vi.fn() },
}))

// Mounts the view and fills step two, since submit refuses to run while any
// required answer is missing.
async function mountAtQuestions() {
  const wrapper = mount(NTHSApplicationFormView, {
    global: { plugins: [store, router] },
  })
  await wrapper.vm.$nextTick()
  const vm = wrapper.vm as any
  for (const question of NTHS_APPLICATION_QUESTIONS) {
    vm.responses[question.key] =
      question.type === 'longText' || question.type === 'shortText'
        ? 'An answer'
        : true
  }
  vm.gradeLevel = '10th grade'
  vm.step = 'questions'
  await flushPromises()
  return vm
}

describe('NTHSApplicationFormView submit', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.mocked(LoggerService.noticeError).mockClear()
    store.commit('nths/setNTHSCandidateApplicationStatus', undefined)
  })

  it('keeps the applicant on the form when the API refuses the application', async () => {
    vi.spyOn(NetworkService, 'submitNTHSApplication').mockRejectedValue({
      response: { data: { err: 'You are not currently eligible' } },
    })
    const replace = vi.spyOn(router, 'replace').mockResolvedValue()

    const vm = await mountAtQuestions()
    await vm.submit()
    await flushPromises()

    expect(vm.error).toEqual('You are not currently eligible')
    expect(replace).not.toHaveBeenCalled()
    expect(vm.isSubmitting).toBe(false)
  })

  // The axios interceptor turns a dropped connection into a TypeError, so
  // err.message here is a JS internal rather than anything an applicant can act
  // on.
  it('does not show a raw error message when the failure carries no API copy', async () => {
    vi.spyOn(NetworkService, 'submitNTHSApplication').mockRejectedValue(
      new TypeError("Cannot read properties of undefined (reading 'data')")
    )
    vi.spyOn(router, 'replace').mockResolvedValue()

    const vm = await mountAtQuestions()
    await vm.submit()
    await flushPromises()

    expect(vm.error).toEqual(
      'We could not submit your application. Please try again.'
    )
  })

  // The application is already saved at this point. Reporting the refresh
  // failure as a submit failure would leave the applicant retrying a form the
  // API now answers with a 403, and a store still reading 'eligible to apply'
  // would have the pending page's guard send them straight back to /groups/apply.
  it('still moves to the pending page when the refresh after submitting fails', async () => {
    vi.spyOn(NetworkService, 'submitNTHSApplication').mockResolvedValue({
      data: { application: { formVersion: 1 } },
    } as never)
    const boom = new Error('network down')
    vi.spyOn(store, 'dispatch').mockRejectedValue(boom)
    const replace = vi.spyOn(router, 'replace').mockResolvedValue()

    const vm = await mountAtQuestions()
    await vm.submit()
    await flushPromises()

    expect(vm.error).toEqual('')
    expect(store.state.nths.NTHSCandidateApplicationStatus).toEqual('applied')
    expect(replace).toHaveBeenCalledWith('/groups/application-pending')
    expect(LoggerService.noticeError).toHaveBeenCalledWith(
      boom,
      'Could not refresh NTHS data after applying'
    )
  })

  it('moves to the pending page on a clean submit', async () => {
    vi.spyOn(NetworkService, 'submitNTHSApplication').mockResolvedValue({
      data: { application: { formVersion: 1 } },
    } as never)
    vi.spyOn(store, 'dispatch').mockResolvedValue([] as never)
    const replace = vi.spyOn(router, 'replace').mockResolvedValue()

    const vm = await mountAtQuestions()
    await vm.submit()
    await flushPromises()

    expect(vm.error).toEqual('')
    expect(replace).toHaveBeenCalledWith('/groups/application-pending')
    // Left set so the form stays locked until the redirect unmounts it.
    expect(vm.isSubmitting).toBe(true)
  })
})
