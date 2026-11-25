import SchoolAffiliation from '@/components/NTHS/SchoolAffiliation.vue'
import Spinner from '@/components/Spinner.vue'
import type { AffiliationStatus } from '@/services/NTHSGroupService'
import NetworkService from '@/services/NetworkService'
import { useNthsStore } from '@/stores/nths'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const GROUP_ID = 'group-123'

const SCHOOL_APPROVED_PATH = '[data-testid="school-approved-path"]'
const COMMUNITY_PATH = '[data-testid="community-path"]'
const SCHOOL_APPROVED_BADGE = '[data-testid="school-approved-current-badge"]'
const COMMUNITY_BADGE = '[data-testid="community-current-badge"]'
const CHOOSE_SCHOOL_BUTTON = '[data-testid="choose-school-approved-button"]'
const ADD_ADVISOR_BUTTON = '[data-testid="add-advisor-button"]'
const SWITCH_TO_COMMUNITY_BUTTON = '[data-testid="switch-to-community-button"]'
const STATUS_ERROR = '[data-testid="status-error"]'
const CANCEL_ADVISOR_BUTTON = '[data-testid="cancel-advisor-button"]'
const AWAITING_VERIFICATION_PANEL =
  '[data-testid="awaiting-verification-panel"]'
const APPROVED_PANEL = '[data-testid="approved-panel"]'

async function getWrapper(initialStatus: AffiliationStatus | null) {
  const wrapper = mount(SchoolAffiliation, {
    // accessibleName resolves ids through the document, so the card has to live
    // in it
    attachTo: 'body',
    props: {
      groupId: GROUP_ID,
      initialStatus,
      hasSchoolOnRecord: true,
    },
  })
  // the machine leaves Initial only once setInitialState has sent its event
  await flushPromises()
  return wrapper
}

function cancelForm(wrapper: VueWrapper) {
  return wrapper.find(CANCEL_ADVISOR_BUTTON).trigger('click')
}

// Resolves aria-labelledby the way a screen reader does, so assertions read the
// name a president hears rather than the raw attribute.
function accessibleName(wrapper: VueWrapper, selector: string) {
  const { panel, ids } = labelledBy(wrapper, selector)
  return ids
    .map((id) => panel.ownerDocument.getElementById(id)?.textContent?.trim())
    .filter(Boolean)
    .join(' ')
}

function unresolvedLabelIds(wrapper: VueWrapper, selector: string) {
  const { panel, ids } = labelledBy(wrapper, selector)
  return ids.filter((id) => !panel.ownerDocument.getElementById(id))
}

function labelledBy(wrapper: VueWrapper, selector: string) {
  const panel = wrapper.find(selector).element
  const ids: string[] = (panel.getAttribute('aria-labelledby') ?? '')
    .split(' ')
    .filter(Boolean)
  return { panel, ids }
}

// The POST answers with the new status, so the card writes that one field back
// rather than refetching the group.
function expectRecordedStatus(schoolAffiliationStatus: AffiliationStatus) {
  expect(nthsActions).toEqual([
    {
      name: 'setNTHSGroupSchoolAffiliationStatus',
      args: [{ groupId: GROUP_ID, schoolAffiliationStatus }],
    },
  ])
}

function failCreateAction(serverMessage?: string) {
  const failure = new AxiosError('Request failed')
  if (serverMessage) {
    failure.response = {
      data: { err: serverMessage },
    } as AxiosError['response']
  }
  vi.mocked(NetworkService.createActionForNTHSGroup).mockRejectedValue(failure)
}

let nthsActions: { name: string; args: unknown[] }[]

describe('SchoolAffiliation', () => {
  beforeEach(() => {
    const nths = useNthsStore()
    nthsActions = []
    nths.$onAction(({ name, args }) => {
      nthsActions.push({ name, args })
    })
    NetworkService.createActionForNTHSGroup = vi
      .fn()
      .mockResolvedValue({ data: { schoolAffiliationStatus: 'OPTED_OUT' } })
    NetworkService.submitSchoolAffiliation = vi.fn().mockResolvedValue({
      data: { schoolAffiliationStatus: 'PENDING_UPCHIEVE_VERIFICATION' },
    })
  })

  const ALL_BUTTONS = [
    CHOOSE_SCHOOL_BUTTON,
    ADD_ADVISOR_BUTTON,
    SWITCH_TO_COMMUNITY_BUTTON,
  ]

  it.each([
    { status: null, current: 'community', buttons: [CHOOSE_SCHOOL_BUTTON] },
    {
      status: 'UNAFFILIATED' as const,
      current: 'community',
      buttons: [CHOOSE_SCHOOL_BUTTON],
    },
    {
      status: 'OPTED_OUT' as const,
      current: 'community',
      buttons: [CHOOSE_SCHOOL_BUTTON],
    },
    {
      status: 'DENIED' as const,
      current: 'community',
      buttons: [CHOOSE_SCHOOL_BUTTON],
    },
    {
      status: 'PENDING_SCHOOL_AFFILIATION' as const,
      current: 'school',
      buttons: [ADD_ADVISOR_BUTTON, SWITCH_TO_COMMUNITY_BUTTON],
    },
    {
      status: 'PENDING_UPCHIEVE_VERIFICATION' as const,
      current: 'school',
      buttons: [],
      panel: AWAITING_VERIFICATION_PANEL,
    },
    {
      status: 'AFFILIATED' as const,
      current: 'school',
      buttons: [],
      panel: APPROVED_PANEL,
    },
  ])(
    'marks $current current with buttons $buttons for $status',
    async ({ status, current, buttons, panel }) => {
      const wrapper = await getWrapper(status)
      const school = current === 'school'

      expect(wrapper.find(SCHOOL_APPROVED_BADGE).exists()).toBe(school)
      expect(wrapper.find(COMMUNITY_BADGE).exists()).toBe(!school)
      expect(accessibleName(wrapper, SCHOOL_APPROVED_PATH)).toBe(
        school ? 'School-approved Current' : 'School-approved'
      )
      expect(accessibleName(wrapper, COMMUNITY_PATH)).toBe(
        school ? 'Community chapter' : 'Community chapter Current'
      )
      expect(unresolvedLabelIds(wrapper, SCHOOL_APPROVED_PATH)).toEqual([])
      expect(unresolvedLabelIds(wrapper, COMMUNITY_PATH)).toEqual([])
      for (const button of ALL_BUTTONS) {
        expect(wrapper.find(button).exists()).toBe(
          (buttons as string[]).includes(button)
        )
      }
      for (const statusPanel of [AWAITING_VERIFICATION_PANEL, APPROVED_PANEL]) {
        expect(wrapper.find(statusPanel).exists()).toBe(statusPanel === panel)
      }
      expect(wrapper.text()).not.toContain('Chapter Advisor')

      wrapper.unmount()
    }
  )

  it.each([null, 'OPTED_OUT' as const, 'DENIED' as const])(
    'records the school-approved choice from %s and opens the advisor form',
    async (initialStatus) => {
      vi.mocked(NetworkService.createActionForNTHSGroup).mockResolvedValue({
        data: { schoolAffiliationStatus: 'PENDING_SCHOOL_AFFILIATION' },
      })
      const wrapper = await getWrapper(initialStatus)

      await wrapper.find(CHOOSE_SCHOOL_BUTTON).trigger('click')
      await flushPromises()

      expect(NetworkService.createActionForNTHSGroup).toHaveBeenCalledWith(
        GROUP_ID,
        'MARKED SCHOOL AFFILIATION IN PROGRESS'
      )
      expect(wrapper.find(SCHOOL_APPROVED_PATH).exists()).toBe(false)
      expect(wrapper.find(COMMUNITY_PATH).exists()).toBe(false)
      expect(wrapper.text()).toContain('Chapter Advisor')
      expectRecordedStatus('PENDING_SCHOOL_AFFILIATION')

      wrapper.unmount()
    }
  )

  it('keeps the chapter pending when the president cancels the advisor form', async () => {
    vi.mocked(NetworkService.createActionForNTHSGroup).mockResolvedValue({
      data: { schoolAffiliationStatus: 'PENDING_SCHOOL_AFFILIATION' },
    })
    const wrapper = await getWrapper(null)

    await wrapper.find(CHOOSE_SCHOOL_BUTTON).trigger('click')
    await flushPromises()
    await cancelForm(wrapper)
    await flushPromises()

    expect(NetworkService.createActionForNTHSGroup).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).not.toContain('Chapter Advisor')
    expect(wrapper.find(SCHOOL_APPROVED_BADGE).text()).toBe('Current')
    expect(wrapper.find(COMMUNITY_BADGE).exists()).toBe(false)
    expect(wrapper.find(ADD_ADVISOR_BUTTON).exists()).toBe(true)

    wrapper.unmount()
  })

  it('shows the advisor form without recording anything when Add advisor is pressed', async () => {
    const wrapper = await getWrapper('PENDING_SCHOOL_AFFILIATION')

    await wrapper.find(ADD_ADVISOR_BUTTON).trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Chapter Advisor')
    expect(wrapper.find(SCHOOL_APPROVED_PATH).exists()).toBe(false)
    expect(NetworkService.createActionForNTHSGroup).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('opts a pending chapter out when it switches to community', async () => {
    const wrapper = await getWrapper('PENDING_SCHOOL_AFFILIATION')

    await wrapper.find(SWITCH_TO_COMMUNITY_BUTTON).trigger('click')
    await flushPromises()

    expect(NetworkService.createActionForNTHSGroup).toHaveBeenCalledWith(
      GROUP_ID,
      'OPTED OUT'
    )
    expect(wrapper.find(COMMUNITY_BADGE).text()).toBe('Current')
    expect(wrapper.find(SWITCH_TO_COMMUNITY_BUTTON).exists()).toBe(false)
    expectRecordedStatus('OPTED_OUT')

    wrapper.unmount()
  })

  it('keeps a pending chapter on the school-approved path when the switch to community fails', async () => {
    const wrapper = await getWrapper('PENDING_SCHOOL_AFFILIATION')
    failCreateAction()

    await wrapper.find(SWITCH_TO_COMMUNITY_BUTTON).trigger('click')
    await flushPromises()

    expect(wrapper.find(STATUS_ERROR).text()).toBe(
      'We could not save your choice. Please try again.'
    )
    expect(wrapper.findComponent(Spinner).exists()).toBe(false)
    expect(wrapper.find(SCHOOL_APPROVED_BADGE).text()).toBe('Current')
    expect(wrapper.find(SWITCH_TO_COMMUNITY_BUTTON).exists()).toBe(true)
    expect(nthsActions).toEqual([])

    wrapper.unmount()
  })

  it('returns an undecided chapter to the cards when the school-approved choice fails to save', async () => {
    const wrapper = await getWrapper(null)
    failCreateAction('Chapter action could not be recorded')

    await wrapper.find(CHOOSE_SCHOOL_BUTTON).trigger('click')
    await flushPromises()

    expect(wrapper.find(STATUS_ERROR).text()).toBe(
      'Chapter action could not be recorded'
    )
    expect(wrapper.findComponent(Spinner).exists()).toBe(false)
    expect(wrapper.find(CHOOSE_SCHOOL_BUTTON).exists()).toBe(true)
    expect(nthsActions).toEqual([])

    vi.mocked(NetworkService.createActionForNTHSGroup).mockResolvedValue({
      data: { schoolAffiliationStatus: 'PENDING_SCHOOL_AFFILIATION' },
    })
    await wrapper.find(CHOOSE_SCHOOL_BUTTON).trigger('click')
    await flushPromises()

    expect(wrapper.find(STATUS_ERROR).exists()).toBe(false)
    expect(wrapper.text()).toContain('Chapter Advisor')
    expectRecordedStatus('PENDING_SCHOOL_AFFILIATION')

    wrapper.unmount()
  })

  it('keeps the advisor form open with the error when the submit fails', async () => {
    const failure = new AxiosError('Request failed')
    failure.response = {
      data: { err: 'That advisor email is already in use' },
    } as AxiosError['response']
    NetworkService.submitSchoolAffiliation = vi.fn().mockRejectedValue(failure)
    const wrapper = await getWrapper('PENDING_SCHOOL_AFFILIATION')

    await wrapper.find(ADD_ADVISOR_BUTTON).trigger('click')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('That advisor email is already in use')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find(SCHOOL_APPROVED_PATH).exists()).toBe(false)

    await cancelForm(wrapper)
    await wrapper.find(ADD_ADVISOR_BUTTON).trigger('click')
    expect(wrapper.text()).not.toContain('That advisor email is already in use')

    wrapper.unmount()
  })
})
