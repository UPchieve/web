import FormSchoolSearch from '@/components/FormSchoolSearch.vue'
import NetworkService from '@/services/NetworkService'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const SCHOOL = {
  id: 'school-123',
  name: 'Central High School',
  city: 'Denver',
  state: 'CO',
}

const CANNOT_FIND_OPTION = '[data-testid="cannot-find-school-option"]'

function getWrapper(props = {}) {
  return mount(FormSchoolSearch, {
    props: {
      startSearchEvent: '',
      cannotFindSchoolEvent: '',
      selectedEvent: '',
      ...props,
    },
  })
}

// the autocomplete debounces its search by 500ms before results render
async function search(wrapper: VueWrapper, query: string) {
  await wrapper.find('input').setValue(query)
  await new Promise((resolve) => setTimeout(resolve, 600))
  await flushPromises()
}

describe('FormSchoolSearch', () => {
  beforeEach(() => {
    NetworkService.searchSchool = vi
      .fn()
      .mockResolvedValue({ data: { results: [SCHOOL] } })
  })

  it('links out to the cannot-find-school form by default', async () => {
    const wrapper = getWrapper()
    await search(wrapper, 'Central')

    expect(wrapper.find(CANNOT_FIND_OPTION).exists()).toBe(false)
    expect(wrapper.find('a[href*="cant-find-school"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('offers a selectable cannot-find-school option when allowCannotFindSchool is set', async () => {
    const wrapper = getWrapper({ allowCannotFindSchool: true })
    await search(wrapper, 'Central')

    expect(wrapper.find(CANNOT_FIND_OPTION).text()).toBe(
      "I can't find my school"
    )
    expect(wrapper.find('a[href*="cant-find-school"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('clears the school and flags cannotFindSchool when that option is selected', async () => {
    const wrapper = getWrapper({ allowCannotFindSchool: true })
    await search(wrapper, 'Central')

    await wrapper.find(CANNOT_FIND_OPTION).trigger('click')
    await flushPromises()

    // searching itself emits update:cannotFindSchool(false), so the
    // cannot-find selection is the most recent emission, not the first
    const cannotFindEmits = wrapper.emitted('update:cannotFindSchool')!
    expect(wrapper.emitted('update:modelValue')![0][0]).toBe(null)
    expect(cannotFindEmits[cannotFindEmits.length - 1][0]).toBe(true)
    expect(wrapper.emitted('selected-school-name')![0][0]).toBe('')
    expect(wrapper.find('input').element.value).toBe("I can't find my school")

    wrapper.unmount()
  })

  it('leaves the field valid after picking the cannot-find-school option', async () => {
    const wrapper = getWrapper({
      allowCannotFindSchool: true,
      isRequired: true,
    })
    await search(wrapper, 'Central')

    await wrapper.find(CANNOT_FIND_OPTION).trigger('click')
    await wrapper.find('input').trigger('blur')
    await flushPromises()

    expect(wrapper.find('.error-caption').exists()).toBe(false)

    wrapper.unmount()
  })

  it('shows a required error when the field is left empty', async () => {
    const wrapper = getWrapper({ isRequired: true })

    await wrapper.find('input').trigger('blur')
    await flushPromises()

    expect(wrapper.find('.error-caption').text()).toBe('Required')

    wrapper.unmount()
  })

  it('unsets cannotFindSchool as soon as the user searches again', async () => {
    const wrapper = getWrapper({ allowCannotFindSchool: true })
    await search(wrapper, 'Central')
    await wrapper.find(CANNOT_FIND_OPTION).trigger('click')
    await flushPromises()

    await search(wrapper, 'Another')

    const cannotFindEmits = wrapper.emitted('update:cannotFindSchool')!
    expect(cannotFindEmits[cannotFindEmits.length - 1][0]).toBe(false)

    wrapper.unmount()
  })

  it('emits the selected school and unsets cannotFindSchool when a school is picked', async () => {
    const wrapper = getWrapper({ allowCannotFindSchool: true })
    await search(wrapper, 'Central')

    await wrapper.find('li').trigger('click')
    await flushPromises()

    // Both fire on every keystroke too, so the pick is the last emission.
    const modelEmits = wrapper.emitted('update:modelValue')!
    const cannotFindEmits = wrapper.emitted('update:cannotFindSchool')!
    expect(modelEmits[modelEmits.length - 1][0]).toBe(SCHOOL.id)
    expect(cannotFindEmits[cannotFindEmits.length - 1][0]).toBe(false)
    expect(wrapper.emitted('selected-school-name')![0][0]).toBe(SCHOOL.name)

    wrapper.unmount()
  })

  it('clears a preselected school as soon as the user searches again', async () => {
    const wrapper = getWrapper({ modelValue: SCHOOL.id })

    await search(wrapper, 'Somewhere else')

    const modelEmits = wrapper.emitted('update:modelValue')!
    expect(modelEmits[modelEmits.length - 1][0]).toBeNull()

    wrapper.unmount()
  })
})
