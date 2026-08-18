<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import useVuelidate from '@vuelidate/core'
import FormSchoolSearch from '@/components/FormSchoolSearch.vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import FormInput from '@/components/FormInput.vue'
import FormTextArea from '@/components/FormTextArea.vue'
import FormCheckBox from '@/components/FormCheckBox.vue'
import FormErrors from '@/components/FormErrors.vue'
import LargeButton from '@/components/LargeButton.vue'
import Loader from '@/components/Loader.vue'
import { getAcademicYear } from '@/utils/academic-year'
import { STATES_WITH_ABBREVIATIONS } from '@/consts'
import NetworkService from '@/services/NetworkService'
import {
  buildEmptyResponses,
  collectResponses,
  HIGH_SCHOOL_GRADES,
  NTHS_APPLICATION_QUESTIONS,
  type NTHSQuestion,
} from '@/services/NTHSApplicationService'

const router = useRouter()
const store = useStore()
const v = useVuelidate()

const step = ref<'school' | 'questions'>('school')
const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref<string>('')

const school = reactive({
  schoolId: null as string | null,
  cannotFindSchool: false,
  name: '',
  city: '',
  state: '',
  website: '',
})
const gradeLevel = ref<string>(store.getters['user/gradeLevel'])

const responses = reactive(buildEmptyResponses())

const academicYear = getAcademicYear().asString

// Seeds the search box with the school already on file so the applicant can
// confirm it rather than retype it. Read once: FormSchoolSearch passes this
// straight to the autocomplete's default-value, which it only reads on mount.
const profileSchoolName = store.state.user.user?.schoolName ?? ''

// The applicant must name a school one way or the other: the server rejects an
// application with neither, and a row with no school holds neither dedup index.
// Website stays optional, since a school too obscure for our data may be too
// obscure to have a site.
const hasSchool = computed(
  () =>
    !!school.schoolId ||
    (!!school.name.trim() && !!school.city.trim() && !!school.state)
)
const canLeaveSchoolStep = computed(() => hasSchool.value && !!gradeLevel.value)

const questions = NTHS_APPLICATION_QUESTIONS

// $silentErrors covers fields the applicant has not touched yet, so the button
// stays disabled until every required answer and attestation is filled in.
const isQuestionsStepIncomplete = computed(
  () => v.value.$error || !!v.value.$silentErrors?.length
)

onMounted(async () => {
  try {
    // Submitting rewrites users_schools, so an untouched prefill has to resolve
    // to the same school it displays.
    if (profileSchoolName) school.schoolId = store.state.user.user.schoolId
    // currentGradeName is advanced by academic year, so a coach who signed up
    // as a freshman three years ago sees 12th rather than 9th. It is absent for
    // anyone with no grade on file, and College or Other for anyone past high
    // school, none of which match an option here.
    const preselected = HIGH_SCHOOL_GRADES.find(
      (grade) => grade.split(' ')[0] === gradeLevel.value
    )
    if (preselected) gradeLevel.value = preselected
  } catch {
    error.value = 'We could not load the application. Please try again.'
  } finally {
    isLoading.value = false
  }
})

function goToQuestions() {
  if (!canLeaveSchoolStep.value) return
  error.value = ''
  step.value = 'questions'
}

function goBackToSchool() {
  error.value = ''
  step.value = 'school'
}

async function submit() {
  if (isQuestionsStepIncomplete.value || isSubmitting.value) return
  isSubmitting.value = true
  error.value = ''

  try {
    await NetworkService.submitNTHSApplication({
      schoolId: school.schoolId ?? undefined,
      unlistedSchool: school.schoolId
        ? undefined
        : {
            name: school.name.trim(),
            city: school.city.trim(),
            state: school.state,
            website: school.website.trim() || undefined,
          },
      gradeLevel: gradeLevel.value.split(' ')[0],
      responses: collectResponses(responses),
    })
    await store.dispatch('nths/fetchNthsData')
    router.replace('/groups/application-pending')
  } catch (err: any) {
    error.value =
      err?.response?.data?.err ??
      err?.message ??
      'We could not submit your application. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

function questionTestId(question: NTHSQuestion) {
  return `nths-question-${question.key}`
}
</script>

<template>
  <div class="page">
    <div class="container">
      <loader v-if="isLoading" />
      <template v-else>
        <h1 class="title">Apply to start an NTHS chapter</h1>

        <FormErrors :errors="error ? [error] : []" />

        <form
          v-if="step === 'school'"
          @submit.prevent="goToQuestions"
          autocomplete="off"
        >
          <p class="step-label">Step 1 of 2</p>
          <p class="help">
            We need your school and grade before the rest of the application.
            Everything is required unless marked optional.
          </p>

          <FormSchoolSearch
            :allowCannotFindSchool="true"
            label="What high school do you currently attend?"
            :isRequired="true"
            requiredMessage="Pick your school from the list"
            :defaultValue="profileSchoolName"
            startSearchEvent=""
            cannotFindSchoolEvent=""
            selectedEvent=""
            v-model="school.schoolId"
            v-model:cannotFindSchool="school.cannotFindSchool"
          />

          <template v-if="school.cannotFindSchool">
            <p class="help">
              Tell us a bit more and we'll track down your school.
            </p>
            <FormInput
              v-model="school.name"
              :isRequired="true"
              name="school-name"
              label="What is your school called?"
              placeholder="Enter your school's full name"
            />
            <FormInput
              v-model="school.city"
              :isRequired="true"
              name="school-city"
              label="What city is it in?"
              placeholder="Enter the city"
            />
            <FormSelect
              v-model="school.state"
              name="school-state"
              :options="STATES_WITH_ABBREVIATIONS"
              optionTextField="label"
              :reduce="(option: { value: string }) => option.value"
              placeholder="State"
              label="What state is it in?"
            />
            <FormInput
              v-model="school.website"
              :isRequired="false"
              name="school-website"
              label="What is your school's website? (optional, but it helps us find your school)"
              placeholder="riversidehigh.org"
            />
          </template>

          <FormSelect
            v-model="gradeLevel"
            name="grade level"
            :options="HIGH_SCHOOL_GRADES"
            placeholder="Grade level"
            :label="`What grade will you be in during the ${academicYear} academic year?`"
          />

          <div class="footer">
            <LargeButton
              variant="primary-blue"
              type="submit"
              :showArrow="false"
              :disabled="!canLeaveSchoolStep"
              >Continue</LargeButton
            >
          </div>
        </form>

        <form v-else @submit.prevent="submit" autocomplete="off">
          <p class="step-label">Step 2 of 2</p>
          <p class="help">Everything is required unless marked optional.</p>

          <template v-for="question in questions" :key="question.key">
            <FormTextArea
              v-if="question.type === 'longText'"
              v-model="responses[question.key] as string"
              :name="question.key"
              :testid="questionTestId(question)"
              :label="question.label"
              :placeholder="question.placeholder"
              :isRequired="question.isRequired !== false"
              :rows="4"
              :maxLength="2000"
            />
            <FormInput
              v-else-if="question.type === 'shortText'"
              v-model="responses[question.key] as string"
              :name="question.key"
              :label="question.label"
              :placeholder="question.placeholder"
              :isRequired="question.isRequired !== false"
            />
            <FormCheckBox
              v-else
              v-model="responses[question.key] as boolean"
              :name="question.key"
              :label="question.label"
              :isRequired="question.isRequired !== false"
            />
          </template>

          <div class="footer">
            <LargeButton
              :showArrow="false"
              :disabled="isSubmitting"
              @click="goBackToSchool"
              >Back</LargeButton
            >
            <LargeButton
              variant="primary-blue"
              type="submit"
              :showArrow="false"
              :disabled="isQuestionsStepIncomplete || isSubmitting"
              >Submit application</LargeButton
            >
          </div>
        </form>
      </template>
      <loader v-if="isSubmitting" overlay />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page {
  display: flex;
  width: 100%;
  justify-content: center;
  padding: 32px 16px;
}

.container {
  width: 100%;
  max-width: 640px;
  background-color: #fff;
  border-radius: 8px;
  padding: 32px;
  box-shadow:
    3px 3px 3px $c-shadow-header,
    -3px 3px 3px $c-shadow-header;
}

.title {
  font-weight: 500;
  margin-bottom: 8px;
  @include breakpoint-below('medium') {
    font-size: 24px;
  }
}

.step-label {
  color: $c-secondary-grey;
  font-size: 14px;
  margin-bottom: 8px;
}

.help {
  margin-bottom: 16px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.footer {
  border-top: rgb(224, 224, 224) 1px solid;
  padding-top: 1em;
  margin-top: 1em;
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 12px;
}
</style>
