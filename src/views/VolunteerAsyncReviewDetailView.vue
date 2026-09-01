<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import LargeButton from '@/components/LargeButton.vue'
import { EVENTS } from '@/consts'
import type { EssayReviewSubmissionForVolunteer } from '@/types/essay-review'
import { dayjs } from '@/utils/time-utils'
import { countWords } from '@/utils/word-count'

const minimumReviewWordCount = 100

const route = useRoute()
const router = useRouter()
const submissions = ref<EssayReviewSubmissionForVolunteer[]>([])
const review = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref('')
const hasSubmitted = ref(false)

const selectedSubmission = computed(() =>
  submissions.value.find(
    (submission) => submission.id === route.params.submissionId
  )
)
const reviewWordCount = computed(() => countWords(review.value))
const isReviewTooShort = computed(
  () => reviewWordCount.value < minimumReviewWordCount
)

function submissionTypeLabel(submission: EssayReviewSubmissionForVolunteer) {
  return submission.subject === 'collegeList'
    ? 'College list'
    : 'Application essay'
}

function submissionHeading(submission: EssayReviewSubmissionForVolunteer) {
  if (submission.subject === 'collegeList') return 'College list'
  return submission.essayPurpose || 'Application essay'
}

async function load() {
  isLoading.value = true
  error.value = ''
  try {
    const response = await NetworkService.getEssayReviewsForVolunteer()
    submissions.value = response.data.essayReviews
    if (!selectedSubmission.value) {
      error.value = 'This submission is no longer available for review.'
    }
  } catch {
    error.value = 'We could not load this submission. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function submitReview() {
  if (!selectedSubmission.value || isReviewTooShort.value || isSubmitting.value)
    return

  isSubmitting.value = true
  error.value = ''
  try {
    await NetworkService.submitVolunteerEssayReview(
      selectedSubmission.value.id,
      review.value
    )
    AnalyticsService.captureEvent(
      EVENTS.VOLUNTEER_ASYNC_ESSAY_REVIEW_SUBMITTED,
      {
        submissionId: selectedSubmission.value.id,
        subject: selectedSubmission.value.subject,
        reviewLength: review.value.trim().length,
        reviewWordCount: reviewWordCount.value,
      }
    )
    hasSubmitted.value = true
  } catch {
    error.value = 'We could not submit your review. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

function goToList() {
  router.push({ name: 'VolunteerAsyncReviewList' })
}

onMounted(load)
</script>

<template>
  <main class="volunteer-async-review-detail">
    <button class="back-link" type="button" @click="goToList">
      ← Back to available submissions
    </button>

    <section v-if="hasSubmitted" class="detail-card thank-you">
      <h1>Thank you for reviewing this submission!</h1>
      <p>
        UPchieve staff will review your feedback before sharing it with the
        student.
      </p>
      <large-button variant="primary-blue" :showArrow="false" @click="goToList">
        Review another submission
      </large-button>
    </section>

    <template v-else>
      <div v-if="isLoading" class="empty-state">Loading submission...</div>
      <p
        v-else-if="error && !selectedSubmission"
        class="error-message"
        role="alert"
      >
        {{ error }}
      </p>

      <template v-else-if="selectedSubmission">
        <header class="page-header">
          <h1>{{ submissionHeading(selectedSubmission) }}</h1>
        </header>

        <div class="detail-layout">
          <section class="detail-card submission-card">
            <header class="submission-header">
              <h2 class="section-title">Student submission</h2>
              <span
                class="subject-badge"
                :class="`subject-badge-${selectedSubmission.subject}`"
              >
                {{ submissionTypeLabel(selectedSubmission) }}
              </span>
              <div class="submission-metadata">
                <span>
                  {{ selectedSubmission.wordCount.toLocaleString() }} words
                </span>
                <span>
                  Submitted
                  {{
                    dayjs(selectedSubmission.submittedAt).format('l, h:mm a')
                  }}
                </span>
              </div>
            </header>

            <div
              v-if="selectedSubmission.essayPrompt"
              class="submission-context"
            >
              <h3>Essay prompt</h3>
              <div class="plain-text-content">
                {{ selectedSubmission.essayPrompt }}
              </div>
            </div>

            <div class="submission-context">
              <h3>Requested feedback</h3>
              <div
                v-if="selectedSubmission.reviewReasons.length"
                class="chip-list"
              >
                <span
                  v-for="reason in selectedSubmission.reviewReasons"
                  :key="reason"
                  class="feedback-chip"
                >
                  {{ reason }}
                </span>
              </div>
              <p v-else class="muted-text">No feedback areas selected.</p>
            </div>

            <div class="submission-content-section">
              <h3>
                {{
                  selectedSubmission.subject === 'collegeList'
                    ? 'Current college list'
                    : 'Essay'
                }}
              </h3>
              <div class="submission-content">
                {{ selectedSubmission.essay }}
              </div>
            </div>

            <div
              v-if="selectedSubmission.additionalContext"
              class="submission-context additional-context"
            >
              <h3>Additional context from the student</h3>
              <div class="plain-text-content">
                {{ selectedSubmission.additionalContext }}
              </div>
            </div>
          </section>

          <section
            v-if="selectedSubmission.subject === 'collegeList'"
            class="detail-card review-guidance-card"
          >
            <h2 class="section-title">College list review guidance</h2>
            <p>
              Help the student build a balanced, affordable list and reinforce
              that they can succeed at a four year school.
              <a
                href="https://cdn.upchieve.org/review-materials/college-list-review.pdf"
                target="_blank"
                rel="noopener noreferrer"
                >Review the College List training guide</a
              >
              if you need a refresher.
            </p>
            <ul class="guidance-list">
              <li>
                Look for four year options, including the student's
                <a
                  href="https://oglethorpe.edu/admission/flagship50/flagship-institutions-and-tuition-by-state/"
                  target="_blank"
                  rel="noopener noreferrer"
                  >state flagship</a
                >
                and an in state public R1 university.
              </li>
              <li>
                Include at least one school that
                <a
                  href="https://blog.collegevine.com/schools-that-meet-100-percent-financial-need"
                  target="_blank"
                  rel="noopener noreferrer"
                  >meets full demonstrated financial need</a
                >.
              </li>
              <li>
                Aim for at least 2 reach, 3 target, and 2 likely schools. You
                can research fit with
                <a
                  href="https://bigfuture.collegeboard.org/college-search/filters"
                  target="_blank"
                  rel="noopener noreferrer"
                  >BigFuture College Search</a
                >.
              </li>
              <li>
                Aim for at least 4 schools with a graduation rate of 70% or
                higher.
              </li>
            </ul>
          </section>

          <section class="detail-card review-card">
            <h2 class="section-title">Your review</h2>
            <p class="review-guidance">
              Write clear, constructive feedback that staff can share with the
              student.
            </p>
            <p v-if="selectedSubmission.hasReviewed" class="success-message">
              You already submitted a review for this submission.
            </p>
            <template v-else>
              <textarea
                id="tutor-review"
                v-model="review"
                maxlength="20000"
                rows="14"
                placeholder="Share specific, actionable feedback..."
                autocomplete="off"
              />
              <p v-if="error" class="error-message" role="alert">
                {{ error }}
              </p>
              <div class="review-actions">
                <span
                  class="word-count"
                  :class="{ 'minimum-met': !isReviewTooShort }"
                >
                  {{ reviewWordCount.toLocaleString() }} /
                  {{ minimumReviewWordCount }} words minimum (recommended
                  length: 250 words)
                </span>
                <large-button
                  variant="primary-blue"
                  :showArrow="false"
                  :disabled="isReviewTooShort || isSubmitting"
                  @click="submitReview"
                >
                  {{ isSubmitting ? 'Submitting...' : 'Submit review' }}
                </large-button>
              </div>
            </template>
          </section>
        </div>
      </template>
    </template>
  </main>
</template>

<style lang="scss" scoped>
.volunteer-async-review-detail {
  max-width: 1200px;
  margin: 10px;
  padding: 20px 15px 60px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 0 0 60px;
  }
}

.back-link {
  margin-bottom: 24px;
  padding: 5px 15px;
  border: 0;
  border-radius: 20px;
  color: #417db1;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.page-header {
  margin-bottom: 24px;

  h1 {
    margin: 0;
    font-size: 30px;
  }
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.detail-card {
  box-sizing: border-box;
  width: 100%;
  padding: 24px;
  border-radius: 8px;
  background: #ffffff;
  text-align: left;
}

.section-title {
  margin: 0 0 16px;
  font-size: 20px;
}

.submission-header {
  margin-bottom: 4px;
}

.submission-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  color: $c-secondary-grey;
}

.subject-badge,
.feedback-chip {
  display: inline-flex;
  width: fit-content;
  padding: 4px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.subject-badge {
  margin-bottom: 12px;
}

.subject-badge-applicationEssays {
  color: #285f8f;
  background: #eaf3fb;
}

.subject-badge-collegeList {
  color: #65530d;
  background: #fff5cc;
}

.submission-context,
.submission-content-section {
  padding: 20px 0;
  border-top: 1px solid #e7ebef;

  h3 {
    margin: 0 0 10px;
    color: #3e4658;
    font-size: 15px;
  }
}

.submission-content-section {
  padding: 28px 0;

  h3 {
    font-size: 18px;
  }
}

.additional-context {
  padding-bottom: 0;
}

.submission-content,
.plain-text-content {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  line-height: 1.6;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feedback-chip {
  border: 1px solid #d9dfe5;
  color: #3e4658;
  background: #f8fafb;
}

.review-card {
  border: 1px solid #d9dfe5;
}

.review-guidance {
  margin: -6px 0 12px;
  color: $c-secondary-grey;
}

.guidance-list {
  margin: 16px 0 0;
  padding-left: 24px;
  line-height: 1.55;

  li + li {
    margin-top: 12px;
  }
}

.review-actions {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.word-count {
  color: $c-secondary-grey;
  font-size: 13px;
}

.minimum-met,
.success-message {
  color: #176b45;
}

.muted-text {
  color: $c-secondary-grey;
}

textarea {
  box-sizing: border-box;
  width: 100%;
  margin: 10px 0 16px;
  padding: 12px;
  border: 1px solid #82929d;
  border-radius: 4px;
  font: inherit;
}

.error-message {
  padding: 16px;
  border-radius: 8px;
  color: $c-error-red;
  background: #fff1f0;
}

.thank-you,
.empty-state {
  padding: 40px 24px;
  text-align: center;
}

@media (max-width: 700px) {
  .review-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
