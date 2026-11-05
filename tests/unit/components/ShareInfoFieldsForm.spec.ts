import ShareInfoFieldsForm from '@/components/ShareInfoFieldsForm.vue'
import UserService from '@/services/UserService'
import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import { VolunteerOccupations } from '@/services/VolunteerService'
import { EVENTS, SHARE_INFO_FIELDS } from '@/consts'
import { it, describe, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createStore } from 'vuex'

const ALL_FIELDS = SHARE_INFO_FIELDS.map((field) => field.key)

function getWrapper(
  { occupations = [] as string[], publicProfileKeys = undefined as any } = {},
  props = {}
) {
  const store = createStore({
    modules: {
      user: {
        namespaced: true,
        state: { user: { publicProfileKeys } },
        mutations: {
          updateUser(state, updates) {
            state.user = { ...state.user, ...updates }
          },
        },
        actions: {
          addToUser({ commit }, updates) {
            commit('updateUser', updates)
          },
        },
      },
    },
  })
  return mount(ShareInfoFieldsForm, {
    props: {
      info: {
        occupations,
        numSessionsTutored: 0,
        numStudentsTutored: 0,
        totalHoursTutored: 0,
      },
      ...props,
    },
    global: { plugins: [store] },
  })
}

async function clickSave(wrapper: ReturnType<typeof getWrapper>) {
  await wrapper.find('.uc-form-button').trigger('click')
  await flushPromises()
}

describe('ShareInfoFieldsForm', () => {
  beforeEach(() => {
    vi.spyOn(UserService, 'setProfile').mockImplementation((data, store) =>
      store.dispatch('user/addToUser', data)
    )
    ;(UserService.setProfile as any).mockClear()
  })

  it('starts an undecided adult coach with everything on with opt-in defaults', async () => {
    const wrapper = getWrapper(
      { occupations: [VolunteerOccupations.WORKING_FULL_TIME] },
      { applyOptInDefaults: true }
    )

    expect(
      wrapper
        .find('[data-testid="share-info-select-all"]')
        .attributes('aria-hidden')
    ).toBe('true')
    await clickSave(wrapper)
    expect(UserService.setProfile).toHaveBeenCalledWith(
      { publicProfileKeys: ALL_FIELDS },
      expect.anything()
    )
  })

  it('starts an undecided high school coach with everything off with opt-in defaults', async () => {
    const wrapper = getWrapper(
      {
        occupations: [
          VolunteerOccupations.HIGH_SCHOOL_STUDENT,
          VolunteerOccupations.WORKING_PART_TIME,
        ],
      },
      { applyOptInDefaults: true }
    )

    expect(wrapper.text()).toContain(
      'Nothing will be shared with your student.'
    )
    await clickSave(wrapper)
    expect(UserService.setProfile).toHaveBeenCalledWith(
      { publicProfileKeys: [] },
      expect.anything()
    )
  })

  it('lets a high school coach turn everything on at once', async () => {
    const wrapper = getWrapper(
      { occupations: [VolunteerOccupations.HIGH_SCHOOL_STUDENT] },
      { applyOptInDefaults: true }
    )

    const selectAll = wrapper.find('[data-testid="share-info-select-all"]')
    expect(selectAll.attributes('aria-hidden')).toBe('false')
    await selectAll.trigger('click')
    expect(selectAll.attributes('aria-hidden')).toBe('true')
    await clickSave(wrapper)
    expect(UserService.setProfile).toHaveBeenCalledWith(
      { publicProfileKeys: ALL_FIELDS },
      expect.anything()
    )
  })

  it('starts an undecided coach with everything off without opt-in defaults', async () => {
    const wrapper = getWrapper({
      occupations: [VolunteerOccupations.WORKING_FULL_TIME],
    })

    expect(wrapper.text()).toContain(
      'Nothing will be shared with your student.'
    )
  })

  it("keeps a coach's saved choice over any default", async () => {
    const wrapper = getWrapper(
      {
        occupations: [VolunteerOccupations.WORKING_FULL_TIME],
        publicProfileKeys: ['occupation'],
      },
      { applyOptInDefaults: true }
    )

    await clickSave(wrapper)
    expect(UserService.setProfile).toHaveBeenCalledWith(
      { publicProfileKeys: ['occupation'] },
      expect.anything()
    )
  })

  it("saves an empty choice once when the coach picks Don't share anything", async () => {
    const captureEvent = vi
      .spyOn(AnalyticsService, 'captureEvent')
      .mockImplementation(() => {})
    const wrapper = getWrapper(
      { occupations: [VolunteerOccupations.WORKING_FULL_TIME] },
      { applyOptInDefaults: true }
    )

    await wrapper.find('.secondary-button').trigger('click')
    await flushPromises()

    expect(UserService.setProfile).toHaveBeenCalledWith(
      { publicProfileKeys: [] },
      expect.anything()
    )
    expect(
      captureEvent.mock.calls.filter(
        ([event]) => event === EVENTS.VOLUNTEER_OPTED_OUT_OF_SHARE_INFO
      )
    ).toHaveLength(1)
    expect(wrapper.emitted('saved')).toHaveLength(1)
  })

  it('tags the share event with where the choice was made', async () => {
    const captureEvent = vi
      .spyOn(AnalyticsService, 'captureEvent')
      .mockImplementation(() => {})
    const wrapper = getWrapper(
      { occupations: [VolunteerOccupations.WORKING_FULL_TIME] },
      { applyOptInDefaults: true, eventSource: 'dashboard_modal' }
    )

    await clickSave(wrapper)

    expect(captureEvent).toHaveBeenCalledWith(
      EVENTS.VOLUNTEER_SELECTED_TO_SHARE_INFO,
      { fields: ALL_FIELDS, source: 'dashboard_modal' }
    )
  })

  it("keeps the coach's toggles when Don't share anything fails to save", async () => {
    ;(UserService.setProfile as any).mockRejectedValueOnce(new Error('offline'))
    vi.spyOn(LoggerService, 'noticeError').mockImplementation(() => {})
    const wrapper = getWrapper(
      { occupations: [VolunteerOccupations.WORKING_FULL_TIME] },
      { applyOptInDefaults: true }
    )

    await wrapper.find('.secondary-button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)

    await clickSave(wrapper)
    expect(UserService.setProfile).toHaveBeenLastCalledWith(
      { publicProfileKeys: ALL_FIELDS },
      expect.anything()
    )
  })

  it('ignores a repeat click while the save is in flight', async () => {
    let resolve: () => void = () => {}
    ;(UserService.setProfile as any).mockReturnValueOnce(
      new Promise<void>((r) => (resolve = r))
    )
    const wrapper = getWrapper(
      { occupations: [VolunteerOccupations.WORKING_FULL_TIME] },
      { applyOptInDefaults: true }
    )

    await wrapper.find('.uc-form-button').trigger('click')
    await wrapper.find('.uc-form-button').trigger('click')
    await wrapper.find('.secondary-button').trigger('click')
    resolve()
    await flushPromises()

    expect(UserService.setProfile).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('saved')).toHaveLength(1)
  })

  it('keeps the form open with an error when saving fails', async () => {
    const error = new Error('network down')
    ;(UserService.setProfile as any).mockRejectedValueOnce(error)
    const noticeError = vi
      .spyOn(LoggerService, 'noticeError')
      .mockImplementation(() => {})
    const wrapper = getWrapper(
      { occupations: [VolunteerOccupations.WORKING_FULL_TIME] },
      { applyOptInDefaults: true }
    )

    await clickSave(wrapper)

    expect(wrapper.find('[role="alert"]').text()).toBe(
      'Something went wrong while saving. Please try again.'
    )
    expect(wrapper.emitted('saved')).toBeUndefined()
    expect(noticeError).toHaveBeenCalledWith(error)

    await clickSave(wrapper)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.emitted('saved')).toHaveLength(1)
  })
})
