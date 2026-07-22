import OccupationField from '@/components/OccupationField.vue'
import GradeLevelSelect from '@/components/GradeLevelSelect.vue'
import { VolunteerOccupations } from '@/services/VolunteerService'
import { it, describe, expect } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'

function getWrapper(props = {}) {
  return mount(OccupationField, {
    props: {
      modelValue: [],
      college: '',
      company: '',
      gradeLevel: '',
      ...props,
    },
  })
}

function checkboxFor(wrapper: VueWrapper, occupation: string) {
  return wrapper.find(`[data-testid="${occupation}"]`)
}

describe('OccupationField', () => {
  it('renders a checkbox for every occupation option', () => {
    const wrapper = getWrapper()

    Object.values(VolunteerOccupations).forEach((occupation) => {
      expect(checkboxFor(wrapper, occupation).exists()).toBe(true)
    })
  })

  it('checks the boxes for occupations already selected via the model', () => {
    const wrapper = getWrapper({
      modelValue: [VolunteerOccupations.WORKING_FULL_TIME],
    })

    expect(
      checkboxFor(wrapper, VolunteerOccupations.WORKING_FULL_TIME).element
        .checked
    ).toBe(true)
    expect(
      checkboxFor(wrapper, VolunteerOccupations.UNEMPLOYED).element.checked
    ).toBe(false)
  })

  it('emits update:modelValue adding an occupation when checked, and removing it when unchecked', async () => {
    const wrapper = getWrapper()

    await checkboxFor(wrapper, VolunteerOccupations.WORKING_PART_TIME).setValue(
      true
    )
    expect(wrapper.emitted('update:modelValue')![0][0]).toEqual([
      VolunteerOccupations.WORKING_PART_TIME,
    ])

    await wrapper.setProps({
      modelValue: [VolunteerOccupations.WORKING_PART_TIME],
    })
    await checkboxFor(wrapper, VolunteerOccupations.WORKING_PART_TIME).setValue(
      false
    )
    expect(wrapper.emitted('update:modelValue')![1][0]).toEqual([])
  })

  it.each([
    VolunteerOccupations.WORKING_FULL_TIME,
    VolunteerOccupations.WORKING_PART_TIME,
  ])('shows the company field when %s is selected', (occupation) => {
    const wrapper = getWrapper({ modelValue: [occupation] })
    expect(wrapper.find('input[name="company"]').exists()).toBe(true)
  })

  it('hides the company field when not working', () => {
    const wrapper = getWrapper({
      modelValue: [VolunteerOccupations.UNEMPLOYED],
    })
    expect(wrapper.find('input[name="company"]').exists()).toBe(false)
  })

  it.each([
    VolunteerOccupations.UNDERGRAD_STUDENT,
    VolunteerOccupations.GRAD_STUDENT,
  ])('shows the college field when %s is selected', (occupation) => {
    const wrapper = getWrapper({ modelValue: [occupation] })
    expect(wrapper.find('input[name="college"]').exists()).toBe(true)
  })

  it('hides the college field when not a college student', () => {
    const wrapper = getWrapper({
      modelValue: [VolunteerOccupations.WORKING_FULL_TIME],
    })
    expect(wrapper.find('input[name="college"]').exists()).toBe(false)
  })

  it('only shows grade level select for high school students', () => {
    const withHighSchool = getWrapper({
      modelValue: [VolunteerOccupations.HIGH_SCHOOL_STUDENT],
    })
    expect(withHighSchool.findComponent(GradeLevelSelect).exists()).toBe(true)

    const withoutHighSchool = getWrapper({
      modelValue: [VolunteerOccupations.RETIRED],
    })
    expect(withoutHighSchool.findComponent(GradeLevelSelect).exists()).toBe(
      false
    )
  })

  it('shows a required-field error when showInputErrors is true and nothing is selected', () => {
    const wrapper = getWrapper({ showInputErrors: true })
    expect(
      wrapper.find('[data-testid="occupation-required-error"]').exists()
    ).toBe(true)
  })

  it('hides the required-field error once an occupation is selected', () => {
    const wrapper = getWrapper({
      showInputErrors: true,
      modelValue: [VolunteerOccupations.CAREGIVER],
    })
    expect(
      wrapper.find('[data-testid="occupation-required-error"]').exists()
    ).toBe(false)
  })

  it('hides the required-field error when showInputErrors is false', () => {
    const wrapper = getWrapper({ showInputErrors: false })
    expect(
      wrapper.find('[data-testid="occupation-required-error"]').exists()
    ).toBe(false)
  })

  it('emits update:college and update:company as the corresponding inputs change', async () => {
    const wrapper = getWrapper({
      modelValue: [
        VolunteerOccupations.UNDERGRAD_STUDENT,
        VolunteerOccupations.WORKING_PART_TIME,
      ],
    })

    await wrapper.find('input[name="college"]').setValue('Umass')
    expect(wrapper.emitted('update:college')![0][0]).toBe('Umass')

    await wrapper.find('input[name="company"]').setValue('Acme')
    expect(wrapper.emitted('update:company')![0][0]).toBe('Acme')
  })

  it('emits update:gradeLevel when the grade level select changes', async () => {
    const wrapper = getWrapper({
      modelValue: [VolunteerOccupations.HIGH_SCHOOL_STUDENT],
    })

    await wrapper
      .findComponent(GradeLevelSelect)
      .vm.$emit('update:modelValue', '9th grade')

    expect(wrapper.emitted('update:gradeLevel')![0][0]).toBe('9th grade')
  })
})
