import BackgroundInfoView from '@/views/BackgroundInfoView.vue'
import FormSchoolSearch from '@/components/FormSchoolSearch.vue'
import NetworkService from '@/services/NetworkService'
import { VolunteerOccupations } from '@/services/VolunteerService'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'

const HIGH_SCHOOLER_IN_US = {
  occupations: [VolunteerOccupations.HIGH_SCHOOL_STUDENT],
  gradeLevel: '11th',
  country: 'United States of America',
  state: 'CO',
  city: 'Denver',
}

const refreshAfterProfileChange = vi.fn()

function getStore({ hasExistingStudentSchool = false } = {}) {
  return createStore({
    modules: {
      user: {
        namespaced: true,
        state: { user: {} },
        getters: {
          isStudentVolunteer: () => false,
          hasExistingStudentSchool: () => hasExistingStudentSchool,
        },
        actions: { addToUser: vi.fn() },
      },
      nths: {
        namespaced: true,
        state: { groups: [] },
        mutations: { setNTHSGroups: vi.fn() },
        actions: { refreshAfterProfileChange },
      },
    },
  })
}

async function getWrapper(storeOverrides = {}) {
  const wrapper = mount(BackgroundInfoView, {
    global: { plugins: [getStore(storeOverrides)] },
  })
  await flushPromises()
  return wrapper
}

function submitButton(wrapper: VueWrapper) {
  return wrapper.find('[data-testid="submit-bg-info"]')
}

describe('BackgroundInfoView', () => {
  beforeEach(() => {
    NetworkService.getStudentSignupSources = vi
      .fn()
      .mockResolvedValue({ data: { signupSources: [] } })
    NetworkService.searchSchool = vi
      .fn()
      .mockResolvedValue({ data: { results: [] } })
    NetworkService.addBackgroundInfo = vi.fn().mockResolvedValue({ data: {} })
    refreshAfterProfileChange.mockClear()
  })

  // Occupation decides NTHS eligibility, so the sidebar entry and the route
  // guards stay wrong until the store reloads.
  it('refreshes NTHS data after saving background info', async () => {
    const wrapper = await getWrapper()
    await wrapper.setData(HIGH_SCHOOLER_IN_US)

    await wrapper
      .findComponent(FormSchoolSearch)
      .vm.$emit('update:modelValue', 'school-123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(refreshAfterProfileChange).toHaveBeenCalled()
  })

  it('blocks submitting while a US high schooler has no school', async () => {
    const wrapper = await getWrapper()
    await wrapper.setData(HIGH_SCHOOLER_IN_US)

    expect(submitButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('allows submitting once the high schooler picks a school', async () => {
    const wrapper = await getWrapper()
    await wrapper.setData(HIGH_SCHOOLER_IN_US)

    await wrapper
      .findComponent(FormSchoolSearch)
      .vm.$emit('update:modelValue', 'school-123')

    expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('allows submitting once the high schooler says they cannot find their school', async () => {
    const wrapper = await getWrapper()
    await wrapper.setData(HIGH_SCHOOLER_IN_US)

    await wrapper
      .findComponent(FormSchoolSearch)
      .vm.$emit('update:cannotFindSchool', true)

    expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('submits without a school when the high schooler cannot find theirs', async () => {
    const wrapper = await getWrapper()
    await wrapper.setData(HIGH_SCHOOLER_IN_US)

    await wrapper
      .findComponent(FormSchoolSearch)
      .vm.$emit('update:cannotFindSchool', true)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(NetworkService.addBackgroundInfo).toHaveBeenCalledWith(
      expect.objectContaining({ highSchoolId: null })
    )
  })

  it('resets the cannot-find flag when the school field is hidden and reshown', async () => {
    const wrapper = await getWrapper()
    await wrapper.setData(HIGH_SCHOOLER_IN_US)

    await wrapper
      .findComponent(FormSchoolSearch)
      .vm.$emit('update:cannotFindSchool', true)
    expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()

    // unchecking "A high school student" unmounts FormSchoolSearch, losing
    // its own state - the parent's flag has to follow or a stale "can't
    // find my school" survives re-checking the occupation
    await wrapper.setData({ occupations: [] })
    await wrapper.setData({ occupations: HIGH_SCHOOLER_IN_US.occupations })

    expect(submitButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('offers the cannot-find-school option instead of the form link', async () => {
    const wrapper = await getWrapper()
    await wrapper.setData(HIGH_SCHOOLER_IN_US)

    expect(
      wrapper.findComponent(FormSchoolSearch).props('allowCannotFindSchool')
    ).toBe(true)
  })

  it('hides the school field and does not block submitting when the account already has a student school', async () => {
    const wrapper = await getWrapper({ hasExistingStudentSchool: true })
    await wrapper.setData(HIGH_SCHOOLER_IN_US)

    expect(wrapper.findComponent(FormSchoolSearch).exists()).toBe(false)
    expect(
      wrapper.find('[data-testid="school-set-from-student-account"]').exists()
    ).toBe(true)
    expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('leaves highSchoolId out of the payload when the account already has a student school', async () => {
    const wrapper = await getWrapper({ hasExistingStudentSchool: true })
    await wrapper.setData(HIGH_SCHOOLER_IN_US)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const payload = (NetworkService.addBackgroundInfo as any).mock.calls.at(
      -1
    )[0]
    expect(payload.highSchoolId).toBeUndefined()
  })
})
