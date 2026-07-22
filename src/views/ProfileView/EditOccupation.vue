<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { EVENTS } from '@/consts'
import UserService from '@/services/UserService'
import OccupationField from '@/components/OccupationField.vue'
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

if (occupations.value.length === 0) {
  AnalyticsService.captureEvent(EVENTS.COACH_HAS_NO_OCCUPATION)
} else {
  AnalyticsService.captureEvent(EVENTS.COACH_HAS_OCCUPATION)
}

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

const isEditing = ref(false)
const showInputErrors = ref(false)

const college = ref(user.value.college ?? '')
const company = ref(user.value.company ?? '')
const gradeLevel = ref(user.value.gradeLevel ?? '')

const editButtonLabel = computed(() => (isEditing.value ? 'Save' : 'Edit'))
const hasOccupationInfo = computed(() => occupations.value.length > 0)

async function onEditButtonClick() {
  if (!isEditing.value) {
    AnalyticsService.captureEvent(EVENTS.COACH_CLICKED_EDIT_OCCUPATION)
    isEditing.value = true
    return
  }

  if (occupations.value.length === 0) {
    showInputErrors.value = true
    return
  }

  const previousOccupations = occupations.value
  const previousCollege = college.value
  const previousCompany = company.value
  const previousGradeLevel = gradeLevel.value

  try {
    await UserService.setProfile(
      {
        occupation: occupations.value,
        college: college.value,
        company: company.value,
        ...(gradeLevel.value ? { gradeLevel: gradeLevel.value } : {}),
      },
      store
    )
    AnalyticsService.captureEvent(EVENTS.COACH_SAVED_NEW_OCCUPATION)
    showInputErrors.value = false
    isEditing.value = false
    emit('success')
  } catch (err) {
    occupations.value = previousOccupations
    college.value = previousCollege
    company.value = previousCompany
    gradeLevel.value = previousGradeLevel
    AnalyticsService.captureEvent(EVENTS.COACH_ERRORED_ON_SAVE_OCCUPATION)
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
        data-testid="edit-occupation-btn"
        @click="onEditButtonClick"
      >
        <PencilIcon class="edit-occupation-icon" />
        {{ editButtonLabel }}
      </button>
    </div>
    <div class="description">
      Keep your occupation, education, and workplace information current.
    </div>

    <div v-show="!isEditing" class="answer occupation-answer">
      <template v-if="hasOccupationInfo">
        <ul>
          <li v-for="occupation in occupations" :key="occupation">
            {{ occupation }}
          </li>
        </ul>
        <div v-if="college && isCollegeEducated">
          College/university: {{ college }}
        </div>
        <div v-if="company && isWorking">Company: {{ company }}</div>
        <div v-if="gradeLevel && isInHighSchool">
          Grade level: {{ gradeLevel }}
        </div>
      </template>
      <template v-else>No occupation information provided</template>
    </div>

    <OccupationField
      v-show="isEditing"
      v-model="occupations"
      v-model:college="college"
      v-model:company="company"
      v-model:grade-level="gradeLevel"
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
