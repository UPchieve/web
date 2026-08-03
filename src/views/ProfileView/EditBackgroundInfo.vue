<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { EVENTS } from '@/consts'
import UserService from '@/services/UserService'
import BackGroundInfoField from '@/components/BackgroundInfoField.vue'
import PencilIcon from '@/assets/pencil.svg'
import { VolunteerOccupations } from '@/services/VolunteerService'
import AnalyticsService from '@/services/AnalyticsService'

const emit = defineEmits<{
  (e: 'error', err: any): void
  (e: 'success'): void
}>()

const store = useStore()
const user = computed(() => store.state.user.user)

const occupations = ref<string[]>([...(user.value.occupation ?? [])])
const isEditing = ref(false)
const showInputErrors = ref(false)
const college = ref(user.value.college ?? '')
const company = ref(user.value.company ?? '')
const gradeLevel = ref(user.value.gradeLevel ?? '')
const highSchoolId = ref(user.value.schoolId ?? '')
const highSchoolName = ref(user.value.schoolName ?? '')
const city = ref(user.value.city ?? '')
const state = ref(user.value.state ?? '')
const country = ref(user.value.country ?? '')

if (occupations.value.length === 0) {
  AnalyticsService.captureEvent(EVENTS.COACH_HAS_NO_OCCUPATION)
} else {
  AnalyticsService.captureEvent(EVENTS.COACH_HAS_OCCUPATION)
}

const isInHighSchool = computed(() =>
  occupations.value.includes(VolunteerOccupations.HIGH_SCHOOL_STUDENT)
)

if (isInHighSchool.value) {
  if (highSchoolId.value) {
    AnalyticsService.captureEvent(EVENTS.COACH_HAS_SCHOOL)
  } else {
    AnalyticsService.captureEvent(EVENTS.COACH_HAS_NO_SCHOOL)
  }
}

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

const editButtonLabel = computed(() => (isEditing.value ? 'Save' : 'Edit'))
const hasOccupationInfo = computed(() => occupations.value.length > 0)

const isInUnitedStates = computed(
  () => country.value === 'United States of America'
)

async function onEditButtonClick() {
  if (!isEditing.value) {
    AnalyticsService.captureEvent(EVENTS.COACH_CLICKED_EDIT_BACKGROUND_INFO)
    isEditing.value = true
    return
  }

  if (
    !country.value ||
    !city.value ||
    (isInUnitedStates.value && !state.value) ||
    occupations.value.length === 0
  ) {
    showInputErrors.value = true
    return
  }

  const previousOccupations = occupations.value
  const previousCollege = college.value
  const previousCompany = company.value
  const previousGradeLevel = gradeLevel.value
  const previousHighSchoolId = highSchoolId.value
  const previousHighSchoolName = highSchoolName.value
  const previousCity = city.value
  const previousCountry = country.value
  const previousState = state.value

  const clearsSchool = !(isInHighSchool.value && isInUnitedStates.value)

  try {
    await UserService.setProfile(
      {
        occupation: occupations.value,
        college: college.value,
        company: company.value,
        ...(gradeLevel.value ? { gradeLevel: gradeLevel.value } : {}),
        ...(clearsSchool
          ? { schoolId: null }
          : { schoolId: highSchoolId.value }),
        state: state.value,
        country: country.value,
        city: city.value,
      },
      store
    )
    if (clearsSchool) {
      highSchoolId.value = ''
      highSchoolName.value = ''
    }
    AnalyticsService.captureEvent(EVENTS.COACH_SAVED_BACKGROUND_INFO)
    showInputErrors.value = false
    isEditing.value = false
    emit('success')
  } catch (err) {
    occupations.value = previousOccupations
    college.value = previousCollege
    company.value = previousCompany
    gradeLevel.value = previousGradeLevel
    highSchoolId.value = previousHighSchoolId
    highSchoolName.value = previousHighSchoolName
    city.value = previousCity
    state.value = previousState
    country.value = previousCountry
    AnalyticsService.captureEvent(EVENTS.COACH_ERRORED_ON_SAVE_BACKGROUND_INFO)
    emit('error', err)
  }
}
</script>

<template>
  <div class="edit-occupation">
    <div class="occupation-heading">
      <div class="prompt">Your Background Information</div>
      <button
        type="button"
        class="field-button"
        data-testid="edit-background-info-btn"
        @click="onEditButtonClick"
      >
        <PencilIcon class="edit-occupation-icon" />
        {{ editButtonLabel }}
      </button>
    </div>
    <div class="description">
      Keep your location, occupation, education, and workplace information
      current.
    </div>

    <div v-show="!isEditing" class="answer occupation-answer">
      <template v-if="hasOccupationInfo">
        <div v-if="country">Country: {{ country }}</div>
        <div v-if="state && isInUnitedStates">State: {{ state }}</div>
        <div v-if="city && country">City: {{ city }}</div>
        <div v-if="college && isCollegeEducated">
          College/university: {{ college }}
        </div>
        <ul>
          <li v-for="occupation in occupations" :key="occupation">
            {{ occupation }}
          </li>
        </ul>
        <div v-if="company && isWorking">Company: {{ company }}</div>
        <div v-if="highSchoolName && isInHighSchool && isInUnitedStates">
          School: {{ highSchoolName }}
        </div>
        <div v-if="gradeLevel && isInHighSchool">
          Grade level: {{ gradeLevel }}
        </div>
      </template>
      <template v-else>No background information provided</template>
    </div>

    <BackGroundInfoField
      v-show="isEditing"
      v-model="occupations"
      v-model:college="college"
      v-model:company="company"
      v-model:grade-level="gradeLevel"
      v-model:high-school-id="highSchoolId"
      v-model:high-school-name="highSchoolName"
      v-model:country="country"
      v-model:city="city"
      v-model:state="state"
      :show-input-errors="showInputErrors"
    />
  </div>
</template>

<style lang="scss" scoped>
ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.prompt {
  @include font-category('subheading');
}
.occupation-heading {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.answer {
  font-weight: 600;
}

.occupation-answer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: baseline;
}

.occupation-answer ul {
  margin-left: 20px;
}

.description {
  margin: 8px 0px;
  @include font-category('helper-text');
}

.field-button {
  color: $c-soft-black;
  border-radius: 0px;
  border: none;
  background-color: transparent;
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 4px;

  &:hover {
    background-color: transparent;
    color: $c-soft-black;
  }
}

.edit-occupation-icon {
  height: 14px;
  width: 14px;
}
</style>
