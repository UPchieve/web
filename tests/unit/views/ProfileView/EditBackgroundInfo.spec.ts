import EditBackgroundInfo from '@/views/ProfileView/EditBackgroundInfo.vue'
import BackgroundInfoField from '@/components/BackgroundInfoField.vue'
import NetworkService from '@/services/NetworkService'
import UserService from '@/services/UserService'
import { VolunteerOccupations } from '@/services/VolunteerService'
import { it, describe, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createStore } from 'vuex'

function getWrapper(user = {}) {
  const store = createStore({
    modules: {
      user: {
        namespaced: true,
        state: { user },
        mutations: {
          updateUser(state, updates) {
            state.user = { ...state.user, ...updates }
          },
        },
        actions: {
          addToUser({ commit }, updates) {
            commit('updateUser', updates)
          },
          fetchUser: vi.fn(),
        },
      },
    },
  })
  return mount(EditBackgroundInfo, {
    global: { plugins: [store] },
    attachTo: document.body,
  })
}

function editButton(wrapper: VueWrapper) {
  return wrapper.find('[data-testid="edit-background-info-btn"]')
}

describe('EditBackgroundInfo', () => {
  beforeEach(() => {
    vi.spyOn(NetworkService, 'setProfile').mockResolvedValue({})
    vi.spyOn(UserService, 'setProfile').mockImplementation((data, store) =>
      NetworkService.setProfile(data).then(() =>
        store.dispatch('user/addToUser', data)
      )
    )
  })

  it('starts in read mode showing a fallback message when there is no occupation data', () => {
    const wrapper = getWrapper({})

    expect(wrapper.text()).toContain('No background information provided')
    expect(wrapper.findComponent(BackgroundInfoField).isVisible()).toBe(false)
    expect(editButton(wrapper).text()).toBe('Edit')
  })

  it('shows existing occupation info in read mode, gated by occupation type', () => {
    const wrapper = getWrapper({
      occupation: [VolunteerOccupations.WORKING_FULL_TIME],
      company: 'Acme',
      college: 'Umass',
      gradeLevel: '10th grade',
    })

    expect(wrapper.text()).toContain(VolunteerOccupations.WORKING_FULL_TIME)
    expect(wrapper.text()).toContain('Company: Acme')
    // college/gradeLevel are stale for a full-time worker, so they're hidden
    expect(wrapper.text()).not.toContain('College/university')
    expect(wrapper.text()).not.toContain('Grade level')
  })

  it('switches to edit mode on Edit click, revealing the BackgroundInfoField form', async () => {
    const wrapper = getWrapper({})

    await editButton(wrapper).trigger('click')

    expect(editButton(wrapper).text()).toBe('Save')
    expect(wrapper.findComponent(BackgroundInfoField).isVisible()).toBe(true)
  })

  it('blocks saving and shows a validation error when no occupation is selected', async () => {
    const wrapper = getWrapper({})

    await editButton(wrapper).trigger('click')
    await editButton(wrapper).trigger('click')

    expect(NetworkService.setProfile).not.toHaveBeenCalled()
    expect(
      wrapper.find('[data-testid="occupation-required-error"]').exists()
    ).toBe(true)
    // stays in edit mode
    expect(editButton(wrapper).text()).toBe('Save')
  })

  it('saves the selected occupation info and returns to read mode', async () => {
    const wrapper = getWrapper({ country: 'Canada', city: 'Toronto' })

    await editButton(wrapper).trigger('click')
    await wrapper
      .find(`[data-testid="${VolunteerOccupations.WORKING_PART_TIME}"]`)
      .setValue(true)
    await wrapper.find('input[name="company"]').setValue('Acme')

    await editButton(wrapper).trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(NetworkService.setProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        occupation: [VolunteerOccupations.WORKING_PART_TIME],
        company: 'Acme',
      })
    )
    expect(editButton(wrapper).text()).toBe('Edit')
    expect(wrapper.emitted('success')).toBeTruthy()
    expect(wrapper.text()).toContain('Company: Acme')
  })

  it('sends schoolId when saving a US high school student', async () => {
    const wrapper = getWrapper({
      occupation: [VolunteerOccupations.HIGH_SCHOOL_STUDENT],
      country: 'United States of America',
      state: 'New York',
      city: 'New York',
      schoolId: 'school-123',
    })

    await editButton(wrapper).trigger('click')
    await editButton(wrapper).trigger('click')

    expect(NetworkService.setProfile).toHaveBeenCalledWith(
      expect.objectContaining({ schoolId: 'school-123' })
    )
  })

  it('clears schoolId when saving an international high school student', async () => {
    const wrapper = getWrapper({
      occupation: [VolunteerOccupations.HIGH_SCHOOL_STUDENT],
      country: 'Canada',
      city: 'Toronto',
      schoolId: 'school-123',
      schoolName: 'Central High',
    })

    await editButton(wrapper).trigger('click')
    await editButton(wrapper).trigger('click')

    expect(NetworkService.setProfile).toHaveBeenCalledWith(
      expect.objectContaining({ schoolId: null })
    )
    expect(wrapper.text()).not.toContain('School: Central High')
  })

  it('reverts to the previous values and stays in edit mode when saving fails', async () => {
    vi.spyOn(NetworkService, 'setProfile').mockRejectedValue(
      new Error('network error')
    )
    const wrapper = getWrapper({
      occupation: [VolunteerOccupations.CAREGIVER],
      country: 'Canada',
      city: 'Toronto',
    })

    await editButton(wrapper).trigger('click')
    await wrapper
      .find(`[data-testid="${VolunteerOccupations.RETIRED}"]`)
      .setValue(true)

    await editButton(wrapper).trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('error')).toBeTruthy()
    // stays in edit mode with the in-progress selection intact, so the user
    // can retry without re-entering everything
    expect(editButton(wrapper).text()).toBe('Save')
    expect(
      wrapper.find(`[data-testid="${VolunteerOccupations.RETIRED}"]`).element
        .checked
    ).toBe(true)
    expect(
      wrapper.find(`[data-testid="${VolunteerOccupations.CAREGIVER}"]`).element
        .checked
    ).toBe(true)
  })
})
