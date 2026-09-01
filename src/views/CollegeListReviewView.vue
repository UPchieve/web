<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import NetworkService from '@/services/NetworkService'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { countWords } from '@/utils/word-count'

const maxCollegeListLength = 50000
const maxAdditionalContextLength = 2000
const maxReviewReasons = 3

const collegeList = ref('')
const additionalContext = ref('')
const reviewReasons = ref<string[]>([])
const reviewEmail = ref('')
const homeState = ref('')
const gpa = ref('')
const englishCourse = ref('')
const mathCourse = ref('')
const testScores = ref('')
const intendedMajors = ref('')
const collegePreferences = ref('')
const affordabilityContext = ref('')

const error = ref('')
const pageTop = ref<HTMLElement | null>(null)
const isSubmitting = ref(false)
const hasSubmitted = ref(false)

const reviewReasonOptions = [
  'Academic fit',
  'Financial fit',
  'Reach, target, and likely balance',
  'Additional schools to consider',
  'Graduation outcomes',
  'Overall feedback',
]

const router = useRouter()
const store = useStore()
const gradeLevel = computed(() => store.getters['user/gradeLevel'] || '')
const normalizedCollegeList = computed(() => collegeList.value.trim())

const wordCount = computed(() => countWords(normalizedCollegeList.value))

const isSubmitDisabled = computed(() => {
  return (
    !normalizedCollegeList.value ||
    !reviewEmail.value.trim() ||
    normalizedCollegeList.value.length > maxCollegeListLength ||
    isSubmitting.value
  )
})

function validateSubmission(): string | null {
  if (!normalizedCollegeList.value) {
    return 'Please add your current college list before submitting it.'
  }

  if (normalizedCollegeList.value.length > maxCollegeListLength) {
    return `Your college list must be ${maxCollegeListLength.toLocaleString()} characters or fewer.`
  }

  if (additionalContext.value.length > maxAdditionalContextLength) {
    return `The additional context must be ${maxAdditionalContextLength.toLocaleString()} characters or fewer.`
  }

  if (reviewReasons.value.length > maxReviewReasons) {
    return `Please select no more than ${maxReviewReasons} feedback areas.`
  }

  if (!reviewEmail.value.trim()) {
    return 'Please enter an email where we can send your feedback.'
  }

  return null
}

function handleReviewReasonClick(reason: string) {
  error.value = ''

  const selectedReasonIndex = reviewReasons.value.indexOf(reason)

  if (selectedReasonIndex >= 0) {
    reviewReasons.value.splice(selectedReasonIndex, 1)
    return
  }

  if (reviewReasons.value.length >= maxReviewReasons) {
    error.value = `Please select no more than ${maxReviewReasons} feedback areas.`
    return
  }

  reviewReasons.value.push(reason)
}

async function handleSubmit() {
  error.value = ''
  hasSubmitted.value = false

  const validationError = validateSubmission()
  if (validationError) {
    error.value = validationError
    return
  }

  isSubmitting.value = true
  try {
    const collegeListContext = [
      ['Grade level', gradeLevel.value],
      ['Home state', homeState.value],
      ['GPA', gpa.value],
      ['Current English course', englishCourse.value],
      ['Current math course', mathCourse.value],
      ['SAT or ACT scores and plans', testScores.value],
      ['Intended majors or interests', intendedMajors.value],
      ['College preferences', collegePreferences.value],
      [
        'Affordability or financial aid considerations',
        affordabilityContext.value,
      ],
      ['Anything else', additionalContext.value],
    ]
      .filter(([, value]) => value.trim())
      .map(([label, value]) => `${label}: ${value.trim()}`)
      .join('\n')

    await NetworkService.submitEssayReview({
      subject: 'collegeList',
      essay: normalizedCollegeList.value,
      essayPurpose: 'College list review',
      additionalContext: collegeListContext || undefined,
      reviewReasons: [...reviewReasons.value],
      reviewEmail: reviewEmail.value.trim(),
    })

    hasSubmitted.value = true
  } catch {
    error.value =
      'Something went wrong while submitting your college list. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

function goToDashboard() {
  router.push('/dashboard')
}

onMounted(() => {
  pageTop.value?.scrollIntoView()
})
</script>

<template>
  <div v-if="!hasSubmitted" class="essay-review" ref="pageTop">
    <header class="page-header">
      <span class="back-link" @click="goToDashboard">← Dashboard</span>

      <h1>Get feedback on your college list</h1>

      <p>
        Share your college list with 3 coaches and get written feedback within
        24 hours.
      </p>
    </header>

    <form class="review-form" @submit.prevent="handleSubmit" autocomplete="off">
      <section class="form-card">
        <div class="section-heading">
          <span class="step-number" aria-hidden="true">1</span>
          <h2>Add your college list</h2>
        </div>

        <div class="field-group">
          <label for="collegeList">
            Which colleges are you currently considering?
          </label>

          <textarea
            id="collegeList"
            v-model="collegeList"
            class="essay-input ph-no-capture"
            name="collegeList"
            rows="14"
            :maxlength="maxCollegeListLength"
            aria-describedby="college-list-help college-list-count"
            placeholder="Add each college you are considering and anything you already know about why it is on your list..."
            required
            autocomplete="off"
          />

          <div class="field-metadata">
            <span id="college-list-help">
              Include every school currently on your list.
            </span>

            <span id="college-list-count">
              {{ wordCount.toLocaleString() }} words ·
              {{ collegeList.length.toLocaleString() }} /
              {{ maxCollegeListLength.toLocaleString() }} characters
            </span>
          </div>
        </div>
      </section>

      <section class="form-card">
        <div class="section-heading">
          <span class="step-number" aria-hidden="true">2</span>
          <h2>Tell us what you need help with</h2>
        </div>

        <div class="field-group">
          <label for="homeState">What state do you live in?</label>
          <input
            id="homeState"
            v-model="homeState"
            type="text"
            placeholder="For example, Florida"
            autocomplete="off"
          />
        </div>

        <div class="field-group">
          <label for="gpa">What is your current GPA?</label>
          <input
            id="gpa"
            v-model="gpa"
            type="text"
            placeholder="Include whether it is weighted or unweighted if you know"
            autocomplete="off"
          />
        </div>

        <div class="field-group">
          <label for="englishCourse">What English course are you taking?</label>
          <input
            id="englishCourse"
            v-model="englishCourse"
            type="text"
            placeholder="For example, AP English Literature"
            autocomplete="off"
          />
        </div>

        <div class="field-group">
          <label for="mathCourse">What math course are you taking?</label>
          <input
            id="mathCourse"
            v-model="mathCourse"
            type="text"
            placeholder="For example, Precalculus"
            autocomplete="off"
          />
        </div>

        <div class="field-group">
          <label for="testScores">
            SAT or ACT scores and plans
            <span class="optionalLabel">Optional</span>
          </label>
          <input
            id="testScores"
            v-model="testScores"
            type="text"
            placeholder="Share scores or whether you plan to apply test optional"
            autocomplete="off"
          />
        </div>

        <div class="field-group">
          <label for="intendedMajors">
            What majors or careers interest you?
            <span class="optionalLabel">Optional</span>
          </label>
          <input
            id="intendedMajors"
            v-model="intendedMajors"
            type="text"
            placeholder="List any areas you are considering"
            autocomplete="off"
          />
        </div>

        <div class="field-group">
          <label for="collegePreferences">
            What matters most to you in a college?
            <span class="optionalLabel">Optional</span>
          </label>
          <textarea
            id="collegePreferences"
            v-model="collegePreferences"
            rows="3"
            placeholder="For example, location, campus size, programs, or student life"
            autocomplete="off"
          />
        </div>

        <div class="field-group">
          <label for="affordabilityContext">
            What should we know about affordability or financial aid?
            <span class="optionalLabel">Optional</span>
          </label>
          <textarea
            id="affordabilityContext"
            v-model="affordabilityContext"
            rows="3"
            placeholder="Share only what you are comfortable sharing"
            autocomplete="off"
          />
        </div>
        <fieldset class="feedback-fieldset">
          <legend>
            What would you like help with?
            <span>Choose up to {{ maxReviewReasons }}</span>
          </legend>

          <div class="chip-list">
            <button
              v-for="reason in reviewReasonOptions"
              :key="reason"
              type="button"
              class="feedback-chip"
              :class="{
                'feedback-chip-selected': reviewReasons.includes(reason),
              }"
              :aria-pressed="reviewReasons.includes(reason)"
              @click="handleReviewReasonClick(reason)"
            >
              {{ reason }}
            </button>
          </div>
        </fieldset>

        <div class="field-group">
          <label for="additionalContext">
            Is there anything else we should know?
            <span class="optionalLabel">Optional</span>
          </label>

          <textarea
            id="additionalContext"
            v-model="additionalContext"
            class="ph-no-capture"
            name="additionalContext"
            rows="4"
            :maxlength="maxAdditionalContextLength"
            placeholder="Share your application goals, questions, or anything else that may help your reviewer..."
            autocomplete="off"
          />

          <div class="field-metadata field-metadata-end">
            <span>
              {{ additionalContext.length.toLocaleString() }} /
              {{ maxAdditionalContextLength.toLocaleString() }} characters
            </span>
          </div>
        </div>
      </section>

      <section class="form-card">
        <div class="section-heading">
          <span class="step-number" aria-hidden="true">3</span>
          <h2>Where should we send your feedback?</h2>
        </div>

        <div class="field-group">
          <label for="review-email">Email address</label>

          <input
            id="review-email"
            v-model="reviewEmail"
            type="email"
            name="review-email"
            aria-describedby="review-email-help"
            placeholder="Email address"
            required
            autocomplete="off"
          />

          <div class="field-metadata">
            <span id="review-email-help">
              School email systems often block messages from us, so a personal
              email is the best way to make sure you receive your feedback.
            </span>
          </div>
        </div>

        <div class="submission-section">
          <p v-if="error" class="status-message error-message" role="alert">
            {{ error }}
          </p>

          <button
            class="submit-button"
            type="submit"
            data-testid="submit-feedback-btn"
            :disabled="isSubmitDisabled"
          >
            {{ isSubmitting ? 'Submitting...' : 'Submit my college list' }}
          </button>
        </div>
      </section>
    </form>
  </div>

  <div v-else class="essay-review">
    <div>
      <h1>Your college list is on its way!</h1>

      <p>
        3 coaches will review your college list and email your feedback within
        <strong>24 hours.</strong>
      </p>

      <p>
        While you wait, you can keep working on your college list with a coach
        in a live tutoring session.
      </p>

      <router-link to="/dashboard"> Back to dashboard </router-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.essay-review {
  --pageBackground: #f4f6fa;
  --surface: #ffffff;
  --textPrimary: #252a3a;
  --textMuted: #687086;
  --borderDefault: #dce1ea;
  --borderStrong: #bdc6d8;
  --primary: #225bd7;
  --primaryHover: #174aba;
  --danger: #b42318;
  --dangerSoft: #fff1f0;

  min-height: 100%;
  box-sizing: border-box;
  padding: 40px;
  color: var(--textPrimary);
  background: var(--pageBackground);
}

.page-header,
.review-form {
  width: min(760px, 100%);
  margin-inline: auto;
}

.page-header {
  margin-bottom: 24px;

  h1 {
    margin: 14px 0 8px;
    font-size: clamp(1.75rem, 3vw, 2.25rem);
    line-height: 1.2;
    letter-spacing: -0.025em;
  }

  p {
    max-width: 650px;
    margin: 0;
    color: var(--textMuted);
    line-height: 1.55;
  }
}

.back-link {
  color: var(--textMuted);
  font-size: 0.9rem;
  text-decoration: none;

  &:hover {
    color: var(--primary);
    text-decoration: underline;
  }

  &:focus-visible {
    border-radius: 4px;
    outline: 3px solid rgb(34 91 215 / 20%);
    outline-offset: 3px;
  }
}

.review-form {
  display: grid;
  gap: 20px;
}

.form-card {
  box-sizing: border-box;
  padding: 24px;
  border: 1px solid var(--borderDefault);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgb(16 24 40 / 4%);
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 1.125rem;
    line-height: 1.35;
  }
}

.step-number {
  display: inline-grid;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  place-items: center;
  border-radius: 50%;
  color: #ffffff;
  background: var(--primary);
  font-size: 0.82rem;
  font-weight: 700;
}

.field-group {
  display: grid;
  gap: 8px;

  & + &,
  & + .feedback-fieldset,
  .feedback-fieldset + & {
    margin-top: 22px;
  }

  label {
    font-size: 0.93rem;
    font-weight: 650;
  }
}

.optionalLabel {
  color: var(--textMuted);
  font-weight: 400;
}

textarea,
input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--borderStrong);
  border-radius: 9px;
  color: var(--textPrimary);
  background: var(--surface);
  font: inherit;
  line-height: 1.5;
  outline: none;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;

  &:hover {
    border-color: #9fa9bd;
  }

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgb(34 91 215 / 14%);
  }

  &::placeholder {
    color: #9299aa;
  }
}

textarea {
  min-height: 92px;
  padding: 12px 14px;
  resize: vertical;
}

.essay-input {
  min-height: 280px;
}

input {
  min-height: 44px;
  padding: 9px 12px;
}

.field-metadata {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: var(--textMuted);
  font-size: 0.78rem;
  line-height: 1.4;
}

.field-metadata-end {
  justify-content: flex-end;
}

.feedback-fieldset {
  min-width: 0;
  margin: 22px 0 0;
  padding: 0;
  border: 0;

  legend {
    margin-bottom: 12px;
    padding: 0;
    font-size: 0.93rem;
    font-weight: 650;

    span {
      color: var(--textMuted);
      font-weight: 400;
    }
  }
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.feedback-chip {
  min-height: 36px;
  padding: 7px 13px;
  border: 1px solid var(--borderDefault);
  border-radius: 999px;
  color: #3e4658;
  background: var(--surface);
  font: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    color 150ms ease,
    background 150ms ease,
    transform 100ms ease;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 3px solid rgb(34 91 215 / 20%);
    outline-offset: 2px;
  }
}

.feedback-chip-selected {
  border-color: var(--primary);
  color: #ffffff;
  background: var(--primary);

  &:hover {
    border-color: var(--primaryHover);
    color: #ffffff;
    background: var(--primaryHover);
  }
}

.submission-section {
  display: grid;
  gap: 14px;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--borderDefault);
}

.status-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 9px;
  font-size: 0.85rem;
  line-height: 1.45;
}

.error-message {
  color: var(--danger);
  background: var(--dangerSoft);
}

.submit-button {
  width: 100%;
  min-height: 46px;
  padding: 10px 18px;
  border: 0;
  border-radius: 999px;
  color: #ffffff;
  background: var(--primary);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 150ms ease,
    opacity 150ms ease,
    transform 100ms ease;

  &:hover:not(:disabled) {
    background: var(--primaryHover);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 3px solid rgb(34 91 215 / 25%);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

@media (max-width: 560px) {
  .essay-review {
    padding: 20px 14px;
  }

  .form-card {
    padding: 19px;
  }

  .field-metadata {
    display: grid;
  }

  .field-metadata-end {
    justify-content: initial;
  }
}
</style>
