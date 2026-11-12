import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DirectMessageReport from '@/components/DirectMessageReport.vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import NetworkService from '@/services/NetworkService'

vi.mock('@/services/NetworkService', () => ({
  default: { reportDirectMessage: vi.fn() },
}))
vi.mock('@/services/LoggerService', () => ({
  default: { noticeError: vi.fn() },
}))
const mockedNetworkService = vi.mocked(NetworkService)

function mountReport(partnerType: 'student' | 'coach' = 'coach') {
  return mount(DirectMessageReport, {
    props: { conversationId: 'conversation-1', partnerType },
    global: { stubs: { FormSelect: true } },
  })
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('DirectMessageReport', () => {
  it('renders report reasons in the dropdown', async () => {
    const wrapper = mount(DirectMessageReport, {
      props: { conversationId: 'conversation-1', partnerType: 'coach' },
    })
    await flushPromises()
    const options = wrapper.find('ion-select').findAll('ion-select-option')
    expect(options).toHaveLength(4)
    expect(options[0].text()).toBe('Coach asked me to connect off of UPchieve')
    wrapper.unmount()
  })

  it('shows the reasons for the reported participant', () => {
    const coachReport = mountReport('coach')
    expect(coachReport.findComponent(FormSelect).props('options')).toEqual([
      'Coach asked me to connect off of UPchieve',
      'Coach made me feel uncomfortable or unsafe',
      'Coach used inappropriate language',
      'Coach talked about inappropriate and offensive topics',
    ])
    const studentReport = mountReport('student')
    expect(studentReport.findComponent(FormSelect).props('options')).toEqual([
      '[Immediate ban] Student extremely rude/inappropriate',
      'I am worried for the immediate safety of this student',
    ])
    expect(studentReport.text()).toContain('without banning them')
  })

  it('enables the blue Report button with a reason and no optional text', async () => {
    const wrapper = mountReport()
    wrapper
      .findComponent(FormSelect)
      .vm.$emit('update:modelValue', 'Coach used inappropriate language')
    await flushPromises()
    const button = wrapper.find('[data-testid="dm-submit-report"]')
    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.classes()).toContain('LargeButton-primary-blue')
    mockedNetworkService.reportDirectMessage.mockResolvedValue({
      reportId: 'report-1',
    })
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(mockedNetworkService.reportDirectMessage).toHaveBeenCalledWith(
      'conversation-1',
      {
        reportReason: 'Coach used inappropriate language',
        reportMessage: undefined,
      }
    )
  })

  it('requires a reason before reporting', async () => {
    const wrapper = mountReport()
    await wrapper.find('form').trigger('submit')
    expect(mockedNetworkService.reportDirectMessage).not.toHaveBeenCalled()
    expect(
      wrapper.find('[data-testid="dm-submit-report"]').attributes('disabled')
    ).toBeDefined()
  })

  it('submits the conversation and details once while a request is pending', async () => {
    let resolveReport!: (result: { reportId: string }) => void
    mockedNetworkService.reportDirectMessage.mockReturnValue(
      new Promise((resolve) => {
        resolveReport = resolve
      })
    )
    const wrapper = mountReport()
    const reason = 'Coach used inappropriate language'
    wrapper.findComponent(FormSelect).vm.$emit('update:modelValue', reason)
    await wrapper.find('textarea').setValue('  Details  ')
    await wrapper.find('form').trigger('submit')
    await wrapper.find('form').trigger('submit')
    expect(mockedNetworkService.reportDirectMessage).toHaveBeenCalledTimes(1)
    expect(mockedNetworkService.reportDirectMessage).toHaveBeenCalledWith(
      'conversation-1',
      { reportReason: reason, reportMessage: 'Details' }
    )
    resolveReport({ reportId: 'report-1' })
    await flushPromises()
    expect(wrapper.emitted('submitted')).toHaveLength(1)
  })

  it('keeps details and allows retry after a failed request', async () => {
    mockedNetworkService.reportDirectMessage.mockRejectedValueOnce(
      new Error('network')
    )
    const wrapper = mountReport()
    wrapper
      .findComponent(FormSelect)
      .vm.$emit('update:modelValue', 'Coach used inappropriate language')
    await wrapper.find('textarea').setValue('Details')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[data-testid="dm-report-error"]').text()).toContain(
      'Failed to submit report'
    )
    expect(
      (wrapper.find('textarea').element as HTMLTextAreaElement).value
    ).toBe('Details')
    expect(wrapper.emitted('submitted')).toBeUndefined()
    mockedNetworkService.reportDirectMessage.mockResolvedValueOnce({
      reportId: 'report-1',
    })
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[data-testid="dm-report-error"]').exists()).toBe(false)
    expect(wrapper.emitted('submitted')).toHaveLength(1)
  })
})
