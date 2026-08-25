<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import NetworkService from '@/services/NetworkService'
import type { EssayReviewSubmissionForVolunteer } from '@/types/essay-review'
import { dayjs } from '@/utils/time-utils'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { countWords } from '@/utils/word-count'
import LargeButton from '@/components/LargeButton.vue'

const minimumReviewWordCount = 50

const route = useRoute()
const router = useRouter()
const store = useStore()
const essays = ref<EssayReviewSubmissionForVolunteer[]>([])
const review = ref('')
const optedIn = ref(false)
const isLoading = ref(true)
const isSubmitting = ref(false)
const error = ref('')
const hasSubmitted = ref(false)
const isEmailNotificationsEnabled = computed(
  () =>
    store.getters['featureFlags/isAsyncEssayReviewEmailNotificationsEnabled']
)

const selectedEssay = computed(() =>
  essays.value.find((essay) => essay.id === route.params.submissionId)
)
const sortedEssays = computed(() =>
  [...essays.value].sort(
    (firstEssay, secondEssay) =>
      Number(firstEssay.hasReviewed) - Number(secondEssay.hasReviewed)
  )
)
const reviewWordCount = computed(() => countWords(review.value))
const isReviewTooShort = computed(
  () => reviewWordCount.value < minimumReviewWordCount
)

async function load() {
  isLoading.value = true
  error.value = ''
  try {
    const [essayResponse, preferenceResponse] = await Promise.all([
      NetworkService.getEssayReviewsForVolunteer(),
      NetworkService.getEssayReviewEmailPreference(),
    ])
    essays.value = essayResponse.data.essayReviews
    optedIn.value = preferenceResponse.data.optedIn
    AnalyticsService.captureEvent(
      EVENTS.VOLUNTEER_ASYNC_ESSAY_REVIEW_LIST_VIEWED,
      {
        essayCount: essays.value.length,
        source:
          typeof route.query.source === 'string'
            ? route.query.source
            : 'direct',
      }
    )
  } catch {
    error.value = 'We could not load essays right now. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function updateEmailPreference() {
  try {
    await NetworkService.updateEssayReviewEmailPreference(optedIn.value)
    AnalyticsService.captureEvent(
      EVENTS.VOLUNTEER_ASYNC_ESSAY_REVIEW_EMAIL_OPT_IN_UPDATED,
      { optedIn: optedIn.value }
    )
  } catch {
    optedIn.value = !optedIn.value
    error.value = 'We could not save your email preference.'
  }
}

async function submitReview() {
  if (!selectedEssay.value || isReviewTooShort.value || isSubmitting.value)
    return
  isSubmitting.value = true
  error.value = ''
  try {
    await NetworkService.submitVolunteerEssayReview(
      selectedEssay.value.id,
      review.value
    )
    AnalyticsService.captureEvent(
      EVENTS.VOLUNTEER_ASYNC_ESSAY_REVIEW_SUBMITTED,
      {
        submissionId: selectedEssay.value.id,
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

function openEssay(id: string) {
  hasSubmitted.value = false
  review.value = ''
  const essay = essays.value.find((item) => item.id === id)
  AnalyticsService.captureEvent(EVENTS.VOLUNTEER_ASYNC_ESSAY_REVIEW_OPENED, {
    submissionId: id,
    reviewCount: essay?.reviewCount,
    essayAgeHours: essay
      ? (Date.now() - new Date(essay.submittedAt).getTime()) / (60 * 60 * 1000)
      : undefined,
  })
  router.push({
    name: 'VolunteerEssayReviewDetail',
    params: { submissionId: id },
  })
}

function goToList() {
  router.push({ name: 'VolunteerEssayReviews' })
}

watch(
  () => route.params.submissionId,
  (submissionId, previousSubmissionId) => {
    hasSubmitted.value = false
    review.value = ''
    error.value = ''

    if (!submissionId && previousSubmissionId) void load()
  }
)

onMounted(load)
</script>

<template>
  <main class="volunteer-essay-reviews">
    <button
      v-if="selectedEssay"
      class="back-link"
      type="button"
      @click="goToList"
    >
      ← Back to available essays
    </button>

    <section v-if="hasSubmitted" class="detail-card thank-you">
      <h1>Thank you for reviewing this essay!</h1>
      <p>
        UPchieve staff will review your feedback before sharing it with the
        student.
      </p>
      <large-button variant="primary-blue" :showArrow="false" @click="goToList">
        Review another essay
      </large-button>
    </section>

    <template v-else>
      <header class="page-header">
        <h1>
          {{
            selectedEssay
              ? selectedEssay.essayPurpose || 'Application essay'
              : 'Essays awaiting review'
          }}
        </h1>
        <p v-if="!selectedEssay">
          Choose any Application Essay below. Multiple tutors may review the
          same essay.
        </p>
      </header>

      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <div v-if="isLoading" class="empty-state">Loading essays...</div>

      <template v-else-if="selectedEssay">
        <div class="detail-layout">
          <section class="detail-card submission-card">
            <header class="submission-header">
              <div>
                <h2 class="section-title">Student submission</h2>
                <div class="essay-metadata">
                  <span
                    >{{ selectedEssay.wordCount.toLocaleString() }} words</span
                  >
                  <span
                    >Submitted
                    {{
                      dayjs(selectedEssay.submittedAt).format('l, h:mm a')
                    }}</span
                  >
                </div>
              </div>
            </header>

            <div v-if="selectedEssay.essayPrompt" class="submission-context">
              <h3>Essay prompt</h3>
              <div class="plain-text-content">
                {{ selectedEssay.essayPrompt }}
              </div>
            </div>

            <div class="submission-context">
              <h3>Requested feedback</h3>
              <div v-if="selectedEssay.reviewReasons.length" class="chip-list">
                <span
                  v-for="reason in selectedEssay.reviewReasons"
                  :key="reason"
                  class="feedback-chip"
                  >{{ reason }}</span
                >
              </div>
              <p v-else class="muted-text">No feedback areas selected.</p>
            </div>

            <div class="essay-section">
              <h3>Essay</h3>
              <div class="essay-content">{{ selectedEssay.essay }}</div>
            </div>

            <div
              v-if="selectedEssay.additionalContext"
              class="submission-context additional-context"
            >
              <h3>Additional context from the student</h3>
              <div class="plain-text-content">
                {{ selectedEssay.additionalContext }}
              </div>
            </div>
          </section>

          <section class="detail-card review-card">
            <h2 class="section-title">Your review</h2>
            <p class="review-guidance">
              Write clear, constructive feedback that staff can share with the
              student.
            </p>
            <p v-if="selectedEssay.hasReviewed" class="success-message">
              You already submitted a review for this essay.
            </p>
            <template v-else>
              <!-- TODO: add a minimum amount of characters/words? use the logic from essay detail review?-->
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
                  class="character-count"
                  :class="{ 'minimum-met': !isReviewTooShort }"
                >
                  {{ reviewWordCount.toLocaleString() }} / 50 words minimum
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

      <template v-else>
        <label
          v-if="isEmailNotificationsEnabled"
          class="email-preference detail-card uc-form-checkbox"
        >
          <input
            v-model="optedIn"
            type="checkbox"
            class="checkbox-input"
            @change="updateEmailPreference"
          />
          Email me when Application Essays need reviews
        </label>
        <div v-if="essays.length" class="review-table-wrapper">
          <table class="review-table">
            <thead>
              <tr>
                <th>Submitted</th>
                <th>Essay type</th>
                <th>Words</th>
                <th>Reviews</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="essay in sortedEssays"
                :key="essay.id"
                class="review-row"
                tabindex="0"
                @click="openEssay(essay.id)"
                @keydown.enter="openEssay(essay.id)"
                @keydown.space.prevent="openEssay(essay.id)"
              >
                <td data-label="Submitted">
                  {{ dayjs(essay.submittedAt).format('l, h:mm a') }}
                </td>
                <td data-label="Essay type">
                  <strong>{{
                    essay.essayPurpose || 'Application essay'
                  }}</strong>
                </td>
                <td data-label="Words">
                  {{ essay.wordCount.toLocaleString() }}
                </td>
                <td data-label="Reviews">{{ essay.reviewCount }}</td>
                <td data-label="Status">
                  <span
                    class="status-badge"
                    :class="
                      essay.hasReviewed
                        ? 'status-badge-reviewed'
                        : 'status-badge-pending'
                    "
                    >{{
                      essay.hasReviewed ? 'Reviewed by you' : 'Available'
                    }}</span
                  >
                </td>
                <td class="review-action-cell">
                  <large-button
                    variant="primary-blue"
                    :showArrow="false"
                    class="outline-button"
                    type="button"
                    @click.stop="openEssay(essay.id)"
                  >
                    View
                  </large-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <section v-else class="detail-card empty-state">
          <h2>No essays are waiting right now</h2>
          <p>We'll add new submissions here as students send them.</p>
        </section>
      </template>
    </template>
  </main>
</template>

<style lang="scss" scoped>
.volunteer-essay-reviews {
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
  p {
    margin: 8px 0 0;
    color: $c-secondary-grey;
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
  margin: 0 0 20px;
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

.submission-context,
.essay-section {
  padding: 20px 0;
  border-top: 1px solid #e7ebef;

  h3 {
    margin: 0 0 10px;
    color: #3e4658;
    font-size: 15px;
  }
}

.essay-section {
  padding: 28px 0;

  h3 {
    font-size: 18px;
  }
}

.additional-context {
  padding-bottom: 0;
}

.review-card {
  border: 1px solid #d9dfe5;
}

.review-guidance {
  margin: -6px 0 12px;
  color: $c-secondary-grey;
}

.review-actions {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.character-count {
  color: $c-secondary-grey;
  font-size: 13px;
}

.minimum-met {
  color: #176b45;
}

.essay-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  color: $c-secondary-grey;
}
.essay-content,
.plain-text-content {
  white-space: pre-wrap;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.feedback-chip,
.status-badge {
  display: inline-flex;
  padding: 4px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}
.feedback-chip {
  border: 1px solid #d9dfe5;
  color: #3e4658;
  background: #f8fafb;
}
.status-badge-pending {
  color: #8a4b08;
  background: #fff4e5;
}
.status-badge-reviewed {
  color: #176b45;
  background: #eaf8f0;
}

.review-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  background: #ffffff;
}
.review-table {
  width: 100%;
  border-collapse: collapse;
}
.review-table th,
.review-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #e7ebef;
  text-align: left;
  vertical-align: middle;
}
.review-table th {
  color: $c-secondary-grey;
  background: #f8fafb;
  font-size: 13px;
  text-transform: uppercase;
}
.review-row {
  cursor: pointer;
}
.review-row:hover,
.review-row:focus {
  background: #f7fcfe;
  outline: none;
}

@media (max-width: 700px) {
  .review-table-wrapper {
    overflow: visible;
    background: transparent;
  }

  .review-table,
  .review-table tbody,
  .review-table tr,
  .review-table td {
    display: block;
    width: 100%;
  }

  .review-table thead {
    display: none;
  }

  .review-table tbody {
    display: grid;
    gap: 16px;
  }

  .review-row {
    box-sizing: border-box;
    padding: 18px;
    border: 1px solid #d9dfe5;
    border-radius: 8px;
    background: #ffffff;
  }

  .review-table td {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: minmax(90px, 0.4fr) minmax(0, 1fr);
    gap: 12px;
    padding: 7px 0;
    border: 0;
  }

  .review-table td::before {
    color: $c-secondary-grey;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    content: attr(data-label);
  }

  .review-table .status-badge {
    width: fit-content;
    justify-self: start;
  }

  .review-action-cell {
    display: block !important;
    padding-top: 14px !important;
  }

  .review-action-cell::before {
    display: none;
  }

  .review-action-cell .outline-button {
    width: 100%;
  }
}

.outline-button {
  padding: 7px 14px;
  border: 1px solid #417db1;
  border-radius: 18px;
  color: #417db1;
  background: #ffffff;
  font: inherit;
  cursor: pointer;
}

.email-preference {
  display: flex;
  gap: 10px;
  align-items: center;
  cursor: pointer;
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

.primary-button {
  display: inline-block;
  padding: 10px 20px;
  border: 0;
  border-radius: 4px;
  color: white;
  background: #417db1;
  font: inherit;
  cursor: pointer;
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 16px;
  border-radius: 8px;
  color: $c-error-red;
  background: #fff1f0;
}
.success-message {
  color: #176b45;
}
.muted-text {
  color: $c-secondary-grey;
}
.thank-you,
.empty-state {
  padding: 40px 24px;
  text-align: center;
}
</style>
