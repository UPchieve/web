<script lang="ts" setup>
import { computed } from 'vue'
import { VolunteerOccupations } from '@/services/VolunteerService'
import CheckBox from '@/components/CheckBox.vue'
import FormInput from '@/components/FormInput.vue'
import GradeLevelSelect from '@/components/GradeLevelSelect.vue'
import { getAcademicYear } from '@/utils/academic-year'

type OccupationFieldProps = {
  /** Displays the required-field message when no occupation has been selected. */
  showInputErrors?: boolean
}

const props = defineProps<OccupationFieldProps>()

// Named models make existing profile/background values immediately visible when
// this field is mounted, while keeping each value editable by the parent.
const occupations = defineModel<string[]>({ default: () => [] })
const college = defineModel<string>('college', { default: '' })
const company = defineModel<string>('company', { default: '' })
const gradeLevel = defineModel<string>('gradeLevel', { default: '' })

const isInHighSchool = computed(() =>
  occupations.value.includes(VolunteerOccupations.HIGH_SCHOOL_STUDENT)
)
const isCollegeEducated = computed(
  () =>
    occupations.value.includes(VolunteerOccupations.UNDERGRAD_STUDENT) ||
    occupations.value.includes(VolunteerOccupations.GRAD_STUDENT)
)
const isWorking = computed(
  () =>
    occupations.value.includes(VolunteerOccupations.WORKING_FULL_TIME) ||
    occupations.value.includes(VolunteerOccupations.WORKING_PART_TIME)
)

const shouldShowCompany = computed(() => isWorking.value)
const shouldShowGradeLevel = computed(() => isInHighSchool.value)

function isOccupationSelected(occupation: VolunteerOccupations) {
  return occupations.value.includes(occupation)
}

function updateOccupation(occupation: VolunteerOccupations, selected: boolean) {
  occupations.value = selected
    ? [...occupations.value, occupation]
    : occupations.value.filter(
        (selectedOccupation) => selectedOccupation !== occupation
      )
}
</script>

<template>
  <div class="occupation-field">
    <p data-testid="question-i-am-currently">
      I am currently...<span class="background-info__question-required">*</span>
    </p>
    <p class="background-info__question-description">Select all that apply.</p>
    <p
      v-if="props.showInputErrors && occupations.length === 0"
      class="error"
      data-testid="occupation-required-error"
    >
      Please select at least one occupation.
    </p>

    <div
      v-for="occupation in VolunteerOccupations"
      :key="occupation"
      class="uc-form-checkbox"
    >
      <CheckBox
        :id="occupation"
        :checked="isOccupationSelected(occupation)"
        :model-value="isOccupationSelected(occupation)"
        :data-testid="occupation"
        @update:model-value="updateOccupation(occupation, $event)"
      >
        {{ occupation }}
      </CheckBox>
    </div>

    <template v-if="isCollegeEducated">
      <FormInput
        v-model="college"
        name="college"
        label="What college/university do you currently attend?*"
        placeholder="Enter a college..."
        class="occupations-input"
      />
    </template>

    <template v-if="shouldShowCompany">
      <FormInput
        v-model="company"
        name="company"
        label="What company do you currently work at?*"
        placeholder="Enter your company..."
        class="occupations-input"
      />
    </template>
    <div v-if="shouldShowGradeLevel" class="occupation-field__grade-level">
      <GradeLevelSelect
        v-model="gradeLevel"
        :placeholder="gradeLevel ? gradeLevel + ' grade' : 'Grade level'"
        :label="`What grade will you be in during the ${getAcademicYear().asString} academic year?*`"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.uc-form-checkbox {
  margin-bottom: 0.6em;
}

.occupation-field__grade-level {
  margin-top: 2em;
}

.occupations-input {
  width: 90%;
  margin-top: 1.4em;

  @include breakpoint-above('medium') {
    width: 80%;
  }
}

.background-info__question-description {
  @include font-category('helper-text');
  margin-top: 10px;
  color: $c-secondary-grey;
}

.background-info__question-required,
.error {
  color: $c-error-red;
}
</style>
