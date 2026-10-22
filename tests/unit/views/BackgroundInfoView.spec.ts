import BackgroundInfoView from '@/views/BackgroundInfoView.vue'
import FormSchoolSearch from '@/components/FormSchoolSearch.vue'
import GradeLevelSelect from '@/components/GradeLevelSelect.vue'
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

function getStore({
  hasExistingStudentSchool = false,
  user = {},
}: { hasExistingStudentSchool?: boolean; user?: object } = {}) {
  return createStore({
    modules: {
      user: {
        namespaced: true,
        state: { user },
        getters: {
          isStudentVolunteer: () => false,
          hasExistingStudentSchool: () => hasExistingStudentSchool,
        },
        actions: { addToUser: vi.fn() },
      },
    },
  })
}

async function getWrapper(storeOverrides: Parameters<typeof getStore>[0] = {}) {
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

  describe('with a profile already on file', () => {
    const user = {
      occupation: [
        VolunteerOccupations.HIGH_SCHOOL_STUDENT,
        VolunteerOccupations.WORKING_PART_TIME,
      ],
      gradeLevel: '11th',
      schoolId: 'school-on-file',
      schoolName: 'Lincoln High School',
    }

    it('starts from the stored occupations, grade and school', async () => {
      const wrapper = await getWrapper({ user })
      await wrapper.setData({ country: 'United States of America' })

      for (const occupation of user.occupation)
        expect(wrapper.find(`[id="${occupation}"]`).element).toHaveProperty(
          'checked',
          true
        )
      expect(wrapper.findComponent(GradeLevelSelect).props('modelValue')).toBe(
        '11th'
      )
      expect(
        wrapper.findComponent(FormSchoolSearch).props('defaultValue')
      ).toBe('Lincoln High School')
    })

    it('saves every prefilled occupation and the stored school', async () => {
      const wrapper = await getWrapper({ user })
      await wrapper.setData({
        country: 'United States of America',
        state: 'CO',
        city: 'Denver',
        company: 'Acme',
      })

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(NetworkService.addBackgroundInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          occupation: user.occupation,
          gradeLevel: '11th',
          highSchoolId: 'school-on-file',
        })
      )
    })

    it('puts the stored school back when the school field is hidden and reshown', async () => {
      const wrapper = await getWrapper({ user })
      await wrapper.setData({
        country: 'United States of America',
        state: 'CO',
        city: 'Denver',
        company: 'Acme',
      })
      await wrapper
        .findComponent(FormSchoolSearch)
        .vm.$emit('update:modelValue', null)
      expect(submitButton(wrapper).attributes('disabled')).toBeDefined()

      // the search box remounts showing the stored school
      await wrapper.setData({ occupations: [] })
      await wrapper.setData({ occupations: user.occupation })

      expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()
    })
  })

  it('starts blank for a coach with nothing on file', async () => {
    const wrapper = await getWrapper()
    await wrapper.setData({
      country: 'United States of America',
      occupations: [VolunteerOccupations.HIGH_SCHOOL_STUDENT],
    })

    expect(wrapper.findComponent(GradeLevelSelect).props('modelValue')).toBe('')
    expect(wrapper.findComponent(FormSchoolSearch).props('defaultValue')).toBe(
      ''
    )
  })
})
