import SchoolAffiliation from '@/components/NTHS/SchoolAffiliation.vue'
import Spinner from '@/components/Spinner.vue'
import type { AffiliationStatus } from '@/services/NTHSGroupService'
import NetworkService from '@/services/NetworkService'
import store from '@/store'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/store', () => ({
  default: { dispatch: vi.fn(), commit: vi.fn() },
}))

const GROUP_ID = 'group-123'

const SCHOOL_APPROVED_PATH = '[data-testid="school-approved-path"]'
const COMMUNITY_PATH = '[data-testid="community-path"]'
const SCHOOL_APPROVED_BADGE = '[data-testid="school-approved-current-badge"]'
const COMMUNITY_BADGE = '[data-testid="community-current-badge"]'
const CHOOSE_SCHOOL_BUTTON = '[data-testid="choose-school-approved-button"]'
const STAY_COMMUNITY_BUTTON = '[data-testid="stay-community-button"]'
const ADD_ADVISOR_BUTTON = '[data-testid="add-advisor-button"]'
const SWITCH_TO_COMMUNITY_BUTTON = '[data-testid="switch-to-community-button"]'
const STATUS_ERROR = '[data-testid="status-error"]'
const CANCEL_ADVISOR_BUTTON = '[data-testid="cancel-advisor-button"]'
const AWAITING_VERIFICATION_PANEL =
  '[data-testid="awaiting-verification-panel"]'
const APPROVED_PANEL = '[data-testid="approved-panel"]'
const DENIED_PANEL = '[data-testid="denied-panel"]'
const CARD_TITLE = '[data-testid="card-title"]'
const CURRENT_PATH_CLASS = 'path-current'

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
  expect(store.commit).toHaveBeenCalledWith(
    'nths/setNTHSGroupSchoolAffiliationStatus',
    { groupId: GROUP_ID, schoolAffiliationStatus }
  )
  expect(store.dispatch).not.toHaveBeenCalled()
}

function isHighlighted(wrapper: VueWrapper, selector: string) {
  return wrapper.find(selector).classes().includes(CURRENT_PATH_CLASS)
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

// Lets a test look at the card while updateStatus is still in flight.
function holdCreateAction() {
  let release: (schoolAffiliationStatus: AffiliationStatus) => void
  const pending = new Promise((resolve) => {
    release = (schoolAffiliationStatus) =>
      resolve({ data: { schoolAffiliationStatus } })
  })
  vi.mocked(NetworkService.createActionForNTHSGroup).mockReturnValue(
    pending as ReturnType<typeof NetworkService.createActionForNTHSGroup>
  )
  return (schoolAffiliationStatus: AffiliationStatus) =>
    release(schoolAffiliationStatus)
}

describe('SchoolAffiliation', () => {
  beforeEach(() => {
    vi.mocked(store.dispatch).mockClear()
    vi.mocked(store.commit).mockClear()
    NetworkService.createActionForNTHSGroup = vi
      .fn()
      .mockResolvedValue({ data: { schoolAffiliationStatus: 'OPTED_OUT' } })
    NetworkService.submitSchoolAffiliation = vi.fn().mockResolvedValue({
      data: { schoolAffiliationStatus: 'PENDING_UPCHIEVE_VERIFICATION' },
    })
  })

  it.each([null, 'UNAFFILIATED' as const])(
    'offers both paths with community marked current when the status is %s',
    async (initialStatus) => {
      const wrapper = await getWrapper(initialStatus)

      expect(wrapper.find(SCHOOL_APPROVED_PATH).exists()).toBe(true)
      expect(wrapper.find(COMMUNITY_PATH).exists()).toBe(true)
      expect(wrapper.find(COMMUNITY_BADGE).text()).toBe('CURRENT')
      expect(wrapper.find(SCHOOL_APPROVED_BADGE).exists()).toBe(false)
      expect(isHighlighted(wrapper, COMMUNITY_PATH)).toBe(true)
      expect(isHighlighted(wrapper, SCHOOL_APPROVED_PATH)).toBe(false)
      expect(accessibleName(wrapper, COMMUNITY_PATH)).toBe(
        'Community chapter CURRENT'
      )
      expect(accessibleName(wrapper, SCHOOL_APPROVED_PATH)).toBe(
        'School-approved'
      )
      expect(wrapper.find(CHOOSE_SCHOOL_BUTTON).exists()).toBe(true)
      expect(wrapper.find(STAY_COMMUNITY_BUTTON).exists()).toBe(true)
      // The badge id only exists on the current panel, so the other panel must
      // not name it.
      expect(unresolvedLabelIds(wrapper, SCHOOL_APPROVED_PATH)).toEqual([])
      expect(unresolvedLabelIds(wrapper, COMMUNITY_PATH)).toEqual([])

      wrapper.unmount()
    }
  )

  it('drops the stay-community button once the chapter has opted out', async () => {
    const wrapper = await getWrapper('OPTED_OUT')

    expect(wrapper.find(COMMUNITY_PATH).exists()).toBe(true)
    expect(wrapper.find(COMMUNITY_BADGE).text()).toBe('CURRENT')
    expect(wrapper.find(STAY_COMMUNITY_BUTTON).exists()).toBe(false)
    expect(wrapper.find(SWITCH_TO_COMMUNITY_BUTTON).exists()).toBe(false)
    expect(wrapper.find(CHOOSE_SCHOOL_BUTTON).exists()).toBe(true)

    wrapper.unmount()
  })

  it.each([null, 'OPTED_OUT' as const])(
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
    expect(wrapper.text()).toContain('Chapter Advisor')

    await cancelForm(wrapper)
    await flushPromises()

    expect(NetworkService.createActionForNTHSGroup).not.toHaveBeenCalledWith(
      GROUP_ID,
      'OPTED OUT'
    )
    expect(NetworkService.createActionForNTHSGroup).toHaveBeenCalledTimes(1)
    expect(NetworkService.createActionForNTHSGroup).toHaveBeenCalledWith(
      GROUP_ID,
      'MARKED SCHOOL AFFILIATION IN PROGRESS'
    )

    expect(wrapper.text()).not.toContain('Chapter Advisor')
    expect(wrapper.find(SCHOOL_APPROVED_PATH).exists()).toBe(true)
    expect(wrapper.find(SCHOOL_APPROVED_BADGE).text()).toBe('CURRENT')
    expect(wrapper.find(COMMUNITY_BADGE).exists()).toBe(false)
    expect(wrapper.find(ADD_ADVISOR_BUTTON).exists()).toBe(true)

    wrapper.unmount()
  })

  it('records the community choice and keeps the chooser without its button', async () => {
    const wrapper = await getWrapper(null)

    await wrapper.find(STAY_COMMUNITY_BUTTON).trigger('click')
    await flushPromises()

    expect(NetworkService.createActionForNTHSGroup).toHaveBeenCalledWith(
      GROUP_ID,
      'OPTED OUT'
    )
    expect(wrapper.find(COMMUNITY_PATH).exists()).toBe(true)
    expect(wrapper.find(COMMUNITY_BADGE).exists()).toBe(true)
    expect(wrapper.find(STAY_COMMUNITY_BUTTON).exists()).toBe(false)
    expect(wrapper.find(CHOOSE_SCHOOL_BUTTON).exists()).toBe(true)
    expectRecordedStatus('OPTED_OUT')

    wrapper.unmount()
  })

  it.each([
    ['PENDING_UPCHIEVE_VERIFICATION' as const, AWAITING_VERIFICATION_PANEL],
    ['AFFILIATED' as const, APPROVED_PANEL],
    ['DENIED' as const, DENIED_PANEL],
  ])('shows the %s panel instead of the chooser', async (status, panel) => {
    const wrapper = await getWrapper(status)

    expect(wrapper.find(panel).exists()).toBe(true)
    expect(wrapper.find(SCHOOL_APPROVED_PATH).exists()).toBe(false)
    expect(wrapper.find(COMMUNITY_PATH).exists()).toBe(false)
    expect(wrapper.find(COMMUNITY_BADGE).exists()).toBe(false)
    expect(wrapper.find(SCHOOL_APPROVED_BADGE).exists()).toBe(false)

    wrapper.unmount()
  })

  it('switches to the affiliation header while the school-approved choice is saving', async () => {
    const release = holdCreateAction()
    const wrapper = await getWrapper(null)

    await wrapper.find(CHOOSE_SCHOOL_BUTTON).trigger('click')
    await flushPromises()
    expect(wrapper.find(CARD_TITLE).text()).toBe('School Affiliation: Optional')
    expect(wrapper.findComponent(Spinner).exists()).toBe(true)
    expect(wrapper.find(SCHOOL_APPROVED_PATH).exists()).toBe(false)

    release('PENDING_SCHOOL_AFFILIATION')
    await flushPromises()
    expect(wrapper.find(CARD_TITLE).text()).toBe('School Affiliation: Optional')
    expect(wrapper.findComponent(Spinner).exists()).toBe(false)
    expect(wrapper.text()).toContain('Chapter Advisor')

    wrapper.unmount()
  })

  it('marks school-approved current for a chapter that already opted in', async () => {
    const wrapper = await getWrapper('PENDING_SCHOOL_AFFILIATION')

    expect(wrapper.find(CARD_TITLE).text()).toBe('Choose Your Chapter Type')
    expect(wrapper.find(SCHOOL_APPROVED_PATH).exists()).toBe(true)
    expect(wrapper.find(SCHOOL_APPROVED_BADGE).text()).toBe('CURRENT')
    expect(wrapper.find(COMMUNITY_BADGE).exists()).toBe(false)
    expect(isHighlighted(wrapper, SCHOOL_APPROVED_PATH)).toBe(true)
    expect(isHighlighted(wrapper, COMMUNITY_PATH)).toBe(false)
    expect(accessibleName(wrapper, SCHOOL_APPROVED_PATH)).toBe(
      'School-approved CURRENT'
    )
    expect(accessibleName(wrapper, COMMUNITY_PATH)).toBe('Community chapter')
    expect(wrapper.find(ADD_ADVISOR_BUTTON).exists()).toBe(true)
    expect(wrapper.find(SWITCH_TO_COMMUNITY_BUTTON).exists()).toBe(true)
    expect(wrapper.find(CHOOSE_SCHOOL_BUTTON).exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Chapter Advisor')

    wrapper.unmount()
  })

  it('opens the advisor form without recording anything', async () => {
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
    expect(wrapper.find(COMMUNITY_BADGE).text()).toBe('CURRENT')
    expect(wrapper.find(SCHOOL_APPROVED_BADGE).exists()).toBe(false)
    expect(wrapper.find(CHOOSE_SCHOOL_BUTTON).exists()).toBe(true)
    expect(wrapper.find(STAY_COMMUNITY_BUTTON).exists()).toBe(false)
    expectRecordedStatus('OPTED_OUT')

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

  it('returns an undecided chapter to the chooser when the community choice fails to save', async () => {
    const wrapper = await getWrapper(null)
    failCreateAction('Chapter action could not be recorded')

    await wrapper.find(STAY_COMMUNITY_BUTTON).trigger('click')
    await flushPromises()

    expect(wrapper.find(STATUS_ERROR).text()).toBe(
      'Chapter action could not be recorded'
    )
    expect(wrapper.findComponent(Spinner).exists()).toBe(false)
    expect(wrapper.find(COMMUNITY_BADGE).text()).toBe('CURRENT')
    expect(wrapper.find(STAY_COMMUNITY_BUTTON).exists()).toBe(true)
    expect(store.commit).not.toHaveBeenCalled()

    vi.mocked(NetworkService.createActionForNTHSGroup).mockResolvedValue({
      data: { schoolAffiliationStatus: 'OPTED_OUT' },
    })
    await wrapper.find(STAY_COMMUNITY_BUTTON).trigger('click')
    await flushPromises()

    expect(wrapper.find(STATUS_ERROR).exists()).toBe(false)
    expect(wrapper.find(STAY_COMMUNITY_BUTTON).exists()).toBe(false)
    expectRecordedStatus('OPTED_OUT')

    wrapper.unmount()
  })

  it('returns an undecided chapter to the chooser when the school-approved choice fails to save', async () => {
    const wrapper = await getWrapper(null)
    failCreateAction('Chapter action could not be recorded')

    await wrapper.find(CHOOSE_SCHOOL_BUTTON).trigger('click')
    await flushPromises()

    expect(wrapper.find(STATUS_ERROR).text()).toBe(
      'Chapter action could not be recorded'
    )
    expect(wrapper.findComponent(Spinner).exists()).toBe(false)
    expect(wrapper.find(CHOOSE_SCHOOL_BUTTON).exists()).toBe(true)
    expect(wrapper.find(STAY_COMMUNITY_BUTTON).exists()).toBe(true)
    expect(store.commit).not.toHaveBeenCalled()

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

  it('keeps a pending chapter on the school-approved path when the switch to community fails', async () => {
    const wrapper = await getWrapper('PENDING_SCHOOL_AFFILIATION')
    failCreateAction()

    await wrapper.find(SWITCH_TO_COMMUNITY_BUTTON).trigger('click')
    await flushPromises()

    expect(wrapper.find(STATUS_ERROR).text()).toBe(
      'We could not save your choice. Please try again.'
    )
    expect(wrapper.findComponent(Spinner).exists()).toBe(false)
    expect(wrapper.find(SCHOOL_APPROVED_BADGE).text()).toBe('CURRENT')
    expect(wrapper.find(COMMUNITY_BADGE).exists()).toBe(false)
    expect(isHighlighted(wrapper, SCHOOL_APPROVED_PATH)).toBe(true)
    expect(wrapper.find(SWITCH_TO_COMMUNITY_BUTTON).exists()).toBe(true)

    wrapper.unmount()
  })
})
