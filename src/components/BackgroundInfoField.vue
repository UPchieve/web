<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useStore } from 'vuex'
import { VolunteerOccupations } from '@/services/VolunteerService'
import CheckBox from '@/components/CheckBox.vue'
import FormInput from '@/components/FormInput.vue'
import GradeLevelSelect from '@/components/GradeLevelSelect.vue'
import { getAcademicYear } from '@/utils/academic-year'
import FormSchoolSearch from '@/components/FormSchoolSearch.vue'
import { COUNTRIES, STATES } from '@/consts'
import FormSearchableSelect from '@/components/FormInputs/FormSearchableSelect.vue'

type BackgroundInfoFieldProps = {
  /** Displays the required-field message when no occupation has been selected. */
  showInputErrors?: boolean
}

const props = defineProps<BackgroundInfoFieldProps>()

const store = useStore()
const user = computed(() => store.state.user.user)

// Named models make existing profile/background values immediately visible when
// this field is mounted, while keeping each value editable by the parent.
const occupations = defineModel<string[]>({ default: () => [] })
const college = defineModel<string>('college', { default: '' })
const company = defineModel<string>('company', { default: '' })
const gradeLevel = defineModel<string>('gradeLevel', { default: '' })
const highSchoolId = defineModel<string>('highSchoolId', { default: '' })
const highSchoolName = defineModel<string>('highSchoolName', { default: '' })
const cannotFindHighSchool = defineModel<boolean>('cannotFindHighSchool', {
  default: false,
})

const city = defineModel<string>('city', { default: '' })
const state = defineModel<string>('state', { default: '' })
const country = defineModel<string>('country', { default: '' })

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
const isInUnitedStates = computed(
  () => country.value === 'United States of America'
)

const hasExistingStudentSchool = computed(
  () => store.getters['user/hasExistingStudentSchool']
)

const isUsHighSchooler = computed(
  () => isInHighSchool.value && isInUnitedStates.value
)
const shouldShowSchoolField = computed(
  () => isUsHighSchooler.value && !hasExistingStudentSchool.value
)
const shouldShowStudentSchoolNote = computed(
  () => isUsHighSchooler.value && hasExistingStudentSchool.value
)

// v-if unmounts the school field, so the values it drives are reset here to
// keep them from going stale behind a blank field
watch(shouldShowSchoolField, (shows) => {
  if (!shows) {
    highSchoolId.value = ''
    highSchoolName.value = ''
    cannotFindHighSchool.value = false
  }
})

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

function updateHighSchool(name: string) {
  highSchoolName.value = name
}
</script>

<template>
  <div>
    <div class="location-field">
      <p data-testid="question-where-do-you-live">
        Where do you currently live?<span
          class="background-info__question-required"
          >*</span
        >
      </p>
      <p
        v-if="
          props.showInputErrors &&
          (!country || !city || (isInUnitedStates && !state))
        "
        class="error"
        data-testid="location-required-error"
      >
        Please set your location.
      </p>

      <FormSearchableSelect
        name="country-select"
        class="location-input"
        v-model="country"
        :options="COUNTRIES"
        data-testid="location-input"
        :isRequired="true"
        :label="'Country*'"
      />
      <template v-if="isInUnitedStates">
        <FormSearchableSelect
          class="location-input"
          name="state-select"
          id="state"
          v-model="state"
          :options="STATES"
          :searchable="true"
          data-testid="state-select"
          :isRequired="true"
          :label="'State*'"
        />
      </template>
      <template v-if="country">
        <FormInput
          type="text"
          v-model="city"
          placeholder="Enter a city..."
          class="location-input"
          id="city"
          data-testid="city-input"
          autocomplete="off"
          :is-required="true"
          :label="'City*'"
        />
      </template>
    </div>
    <div class="occupation-field">
      <p data-testid="question-i-am-currently">
        I am currently...<span class="background-info__question-required"
          >*</span
        >
      </p>
      <p class="background-info__question-description">
        Select all that apply.
      </p>
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
      <div v-if="shouldShowSchoolField" class="occupation-field__school">
        <p
          v-if="props.showInputErrors && !highSchoolId && !cannotFindHighSchool"
          class="error"
          data-testid="school-required-error"
        >
          Please select your school.
        </p>
        <FormSchoolSearch
          :isRequired="true"
          :allowCannotFindSchool="true"
          :label="'What high school do you currently attend?'"
          startSearchEvent=""
          cannotFindSchoolEvent=""
          selectedEvent=""
          :placeholder="highSchoolName || user.schoolName"
          v-model="highSchoolId"
          v-model:cannotFindSchool="cannotFindHighSchool"
          @selected-school-name="updateHighSchool"
        />
      </div>
      <p
        v-else-if="shouldShowStudentSchoolNote"
        data-testid="school-set-from-student-account"
        class="background-info__question-description"
      >
        We already have your school on file from your student account.
      </p>
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
  </div>
</template>

<style lang="scss" scoped>
.location-field,
.occupation-field {
  margin: 1em 0;
}
.uc-form-checkbox {
  margin-bottom: 0.6em;
}

.occupation-field__grade-level {
  margin-top: 2em;
}

.occupation-field__school {
  margin-top: 2em;
}

.location-input,
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
