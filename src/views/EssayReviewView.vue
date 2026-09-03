<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import NetworkService from '@/services/NetworkService'
import { useRouter } from 'vue-router'
import { countWords } from '@/utils/word-count'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const maxEssayLength = 50000
const maxPromptLength = 5000
const maxAdditionalContextLength = 2000
const maxReviewReasons = 3

const essay = ref('')
const essayPurpose = ref('')
const essayPrompt = ref('')
const additionalContext = ref('')
const reviewReasons = ref<string[]>([])
const reviewEmail = ref('')

const error = ref('')
const pageTop = ref<HTMLElement | null>(null)
const isSubmitting = ref(false)
const hasSubmitted = ref(false)

const reviewReasonOptions = [
  'Is my opening engaging?',
  'Is my ending strong?',
  'Structure and flow',
  'Grammar and word choice',
  'Does it answer the prompt?',
  'Is it too long?',
  'Overall feedback',
]

const router = useRouter()

const normalizedEssay = computed(() => essay.value.trim())

const wordCount = computed(() => countWords(normalizedEssay.value))

const isSubmitDisabled = computed(() => {
  return (
    !normalizedEssay.value ||
    !reviewEmail.value.trim() ||
    normalizedEssay.value.length > maxEssayLength ||
    isSubmitting.value
  )
})

function validateSubmission(): string | null {
  if (!normalizedEssay.value) {
    return 'Please write or paste your essay before submitting it.'
  }

  if (normalizedEssay.value.length > maxEssayLength) {
    return `Your essay must be ${maxEssayLength.toLocaleString()} characters or fewer.`
  }

  if (essayPrompt.value.length > maxPromptLength) {
    return `The essay prompt must be ${maxPromptLength.toLocaleString()} characters or fewer.`
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
    await NetworkService.submitEssayReview({
      subject: 'applicationEssays',
      essay: normalizedEssay.value,
      essayPurpose: essayPurpose.value.trim() || undefined,
      essayPrompt: essayPrompt.value.trim() || undefined,
      additionalContext: additionalContext.value.trim() || undefined,
      reviewReasons: [...reviewReasons.value],
      reviewEmail: reviewEmail.value.trim(),
    })

    hasSubmitted.value = true
  } catch {
    error.value =
      'Something went wrong while submitting your essay. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

function goToDashboard() {
  router.push('/dashboard')
}

onMounted(() => {
  AnalyticsService.captureEvent(
    EVENTS.STUDENT_VIEWED_ASYNC_REVIEW_SUBMISSION_PAGE,
    { subject: 'applicationEssays' }
  )
  pageTop.value?.scrollIntoView()
})
</script>

<template>
  <div v-if="!hasSubmitted" class="essay-review" ref="pageTop">
    <header class="page-header">
      <span class="back-link" @click="goToDashboard">← Dashboard</span>

      <h1>Get your essay reviewed</h1>

      <p>
        Share your draft with 3 coaches and get written feedback within 24
        hours.
      </p>
    </header>

    <form class="review-form" @submit.prevent="handleSubmit" autocomplete="off">
      <section class="form-card">
        <div class="section-heading">
          <span class="step-number" aria-hidden="true">1</span>
          <h2>Add your essay</h2>
        </div>

        <div class="field-group">
          <label for="essay">Write or paste your essay</label>

          <textarea
            id="essay"
            v-model="essay"
            class="essay-input ph-no-capture"
            name="essay"
            rows="14"
            :maxlength="maxEssayLength"
            aria-describedby="essay-help essay-count"
            placeholder="Write or paste your essay here..."
            required
            autocomplete="off"
          />

          <div class="field-metadata">
            <span id="essay-help">
              Write or paste your full draft or a section.
            </span>

            <span id="essay-count">
              {{ wordCount.toLocaleString() }} words ·
              {{ essay.length.toLocaleString() }} /
              {{ maxEssayLength.toLocaleString() }} characters
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
          <label for="essayPurpose">What is this essay for?</label>

          <input
            id="essayPurpose"
            v-model="essayPurpose"
            type="text"
            name="essayPurpose"
            placeholder="For example, a college application or class assignment"
            autocomplete="off"
          />
        </div>

        <div class="field-group">
          <label for="essayPrompt">What prompt are you answering?</label>

          <textarea
            id="essayPrompt"
            v-model="essayPrompt"
            class="ph-no-capture"
            name="essayPrompt"
            rows="3"
            :maxlength="maxPromptLength"
            placeholder="Paste the essay prompt here..."
            autocomplete="off"
          />

          <div class="field-metadata field-metadata-end">
            <span>
              {{ essayPrompt.length.toLocaleString() }} /
              {{ maxPromptLength.toLocaleString() }} characters
            </span>
          </div>
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
            placeholder="For example, share your deadline or anything you're unsure about..."
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
            {{ isSubmitting ? 'Submitting...' : 'Submit my essay' }}
          </button>

          <p class="privacy-notice">
            Only the UPchieve Academic Coaches and staff helping with your
            review will see your essay.
          </p>
        </div>
      </section>
    </form>
  </div>

  <div v-else class="essay-review">
    <div>
      <h1>Your essay is on its way!</h1>

      <p>
        3 coaches will review your essay and email your feedback within
        <strong>24 hours.</strong>
      </p>

      <p>
        While you wait, you can keep working on your essay with a coach in a
        live tutoring session.
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

.privacy-notice {
  margin: 0;
  color: var(--textMuted);
  font-size: 0.78rem;
  line-height: 1.5;
  text-align: center;
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
