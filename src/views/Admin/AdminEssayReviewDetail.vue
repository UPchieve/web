<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { dayjs } from '@/utils/time-utils'
import NetworkService, { isNetworkError } from '@/services/NetworkService'
import type {
  EssayReviewStatus,
  EssayReviewSubmission,
} from '@/types/essay-review'

const route = useRoute()
const router = useRouter()

const essayReview = ref<EssayReviewSubmission | null>(null)
const isLoading = ref(true)
const isUpdating = ref(false)
const loadError = ref('')
const updateError = ref('')
const updateSuccess = ref('')
const finalReviews = ref(['', '', ''])
const selectedReviewIds = ref(['', '', ''])
const previewReviewId = ref('')

const submissionId = computed(() => String(route.params.submissionId))
const nextStatus = computed<EssayReviewStatus>(() =>
  essayReview.value?.status === 'reviewed' ? 'pending' : 'reviewed'
)
const actionLabel = computed(() =>
  essayReview.value?.status === 'reviewed'
    ? 'Return to pending'
    : 'Mark as reviewed'
)
const previewedReview = computed(() =>
  essayReview.value?.reviews.find(
    (review) => review.id === previewReviewId.value
  )
)
const reviewsToSend = computed(() =>
  finalReviews.value.map((review) => review.trim()).filter(Boolean)
)

function goBack() {
  router.go(-1)
}

async function loadEssayReview() {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await NetworkService.adminGetEssayReview(
      submissionId.value
    )
    essayReview.value = response.data.essayReview
    finalReviews.value = response.data.essayReview.finalReviews ?? ['', '', '']
    previewReviewId.value = response.data.essayReview.reviews[0]?.id ?? ''
  } catch {
    loadError.value = 'There was an issue loading this essay review.'
  } finally {
    isLoading.value = false
  }
}

function syncReviewSlot(reviewIndex: number) {
  const selectedReview = essayReview.value?.reviews.find(
    (review) => review.id === selectedReviewIds.value[reviewIndex]
  )
  finalReviews.value[reviewIndex] = selectedReview?.review ?? ''
}

function usePreviewedReview(reviewIndex: number) {
  if (!previewedReview.value) return
  selectedReviewIds.value[reviewIndex] = previewedReview.value.id
  finalReviews.value[reviewIndex] = previewedReview.value.review
}

async function sendReviews() {
  if (!essayReview.value || isUpdating.value || !reviewsToSend.value.length)
    return
  isUpdating.value = true
  updateError.value = ''
  updateSuccess.value = ''
  try {
    const response = await NetworkService.adminSendEssayReviews(
      essayReview.value.id,
      reviewsToSend.value
    )
    essayReview.value = response.data.essayReview
    updateSuccess.value = `${reviewsToSend.value.length} ${
      reviewsToSend.value.length === 1 ? 'review was' : 'reviews were'
    } emailed to ${
      essayReview.value.reviewEmail || essayReview.value.studentEmail
    }.`
  } catch (error) {
    updateError.value =
      isNetworkError(error) && error.status === 422
        ? error.message
        : 'The reviews could not be emailed. Please try again.'
  } finally {
    isUpdating.value = false
  }
}

async function updateStatus() {
  if (!essayReview.value || isUpdating.value) return
  isUpdating.value = true
  updateError.value = ''
  updateSuccess.value = ''

  try {
    const response = await NetworkService.adminUpdateEssayReview(
      essayReview.value.id,
      nextStatus.value
    )
    essayReview.value = response.data.essayReview
    updateSuccess.value = 'Review status updated.'
  } catch {
    updateError.value = 'There was an issue updating the review status.'
  } finally {
    isUpdating.value = false
  }
}

onMounted(loadEssayReview)
</script>

<template>
  <main class="essay-review-detail">
    <button class="back-button" type="button" @click="goBack">
      ← Back to essay reviews
    </button>

    <div v-if="isLoading" class="loading-state">Loading essay review...</div>
    <p v-else-if="loadError" class="error-message" role="alert">
      {{ loadError }}
    </p>
    <template v-else-if="essayReview">
      <header class="detail-header">
        <div>
          <div class="header-metadata">
            <span
              class="status-badge"
              :class="{
                'status-badge-pending': essayReview.status === 'pending',
                'status-badge-reviewed': essayReview.status === 'reviewed',
              }"
            >
              {{ essayReview.status === 'reviewed' ? 'Reviewed' : 'Pending' }}
            </span>
            <span>
              Submitted {{ dayjs(essayReview.submittedAt).format('l, h:mm a') }}
            </span>
          </div>

          <h1>{{ essayReview.essayPurpose || 'Essay review' }}</h1>
          <p class="submission-id">ID: {{ essayReview.id }}</p>
        </div>

        <button
          class="primary-button"
          type="button"
          :disabled="isUpdating || !!essayReview.emailSentAt"
          @click="updateStatus"
        >
          {{ isUpdating ? 'Updating…' : actionLabel }}
        </button>
      </header>

      <p v-if="updateError" class="error-message" role="alert">
        {{ updateError }}
      </p>
      <p v-if="updateSuccess" class="success-message" role="status">
        {{ updateSuccess }}
      </p>

      <div class="detail-layout">
        <div class="main-column">
          <section class="detail-card">
            <h2 class="section-title">Essay</h2>
            <div class="essay-metadata">
              <span>{{ essayReview.wordCount.toLocaleString() }} words</span>
              <span>
                {{ essayReview.characterCount.toLocaleString() }} characters
              </span>
            </div>
            <div class="essay-content">{{ essayReview.essay }}</div>
          </section>

          <section v-if="essayReview.essayPrompt" class="detail-card">
            <h2 class="section-title">Essay prompt</h2>
            <div class="plain-text-content">{{ essayReview.essayPrompt }}</div>
          </section>

          <section v-if="essayReview.additionalContext" class="detail-card">
            <h2 class="section-title">Additional context</h2>
            <div class="plain-text-content">
              {{ essayReview.additionalContext }}
            </div>
          </section>

          <section class="detail-card">
            <h2 class="section-title">
              Tutor reviews ({{ essayReview.reviews.length }})
            </h2>
            <p class="muted-text">
              Read each tutor's complete feedback, then place the strongest
              reviews into one of the three student email fields.
            </p>
            <p v-if="!essayReview.reviews.length" class="muted-text">
              No tutor reviews have been submitted yet.
            </p>
            <template v-if="essayReview.reviews.length">
              <label class="review-browser-label" for="review-browser">
                Choose a tutor review to read
              </label>
              <select
                id="review-browser"
                v-model="previewReviewId"
                class="review-select"
                autocomplete="off"
              >
                <option
                  v-for="review in essayReview.reviews"
                  :key="review.id"
                  :value="review.id"
                >
                  {{ review.reviewerFirstName || 'Tutor' }} ·
                  {{ dayjs(review.submittedAt).format('l, h:mm a') }}
                </option>
              </select>
              <article v-if="previewedReview" class="tutor-review">
                <header class="tutor-review-header">
                  <span>
                    <strong>{{
                      previewedReview.reviewerFirstName || 'Tutor'
                    }}</strong>
                    ·
                    {{ dayjs(previewedReview.submittedAt).format('l, h:mm a') }}
                  </span>
                </header>
                <div class="review-content">{{ previewedReview.review }}</div>
                <footer
                  v-if="!essayReview.emailSentAt"
                  class="review-slot-actions"
                >
                  <span>Use this feedback as:</span>
                  <button
                    v-for="(_, index) in finalReviews"
                    :key="index"
                    class="slot-button"
                    :class="{
                      'slot-button-selected':
                        selectedReviewIds[index] === previewedReview.id,
                    }"
                    type="button"
                    @click="usePreviewedReview(index)"
                  >
                    {{
                      selectedReviewIds[index] === previewedReview.id
                        ? `Review ${index + 1} ✓`
                        : `Review ${index + 1}`
                    }}
                  </button>
                </footer>
              </article>
            </template>
          </section>

          <section class="detail-card">
            <h2 class="section-title">Final reviews for student email</h2>
            <div v-if="essayReview.emailSentAt">
              <p class="success-message">
                Sent {{ dayjs(essayReview.emailSentAt).format('l, h:mm a') }}
              </p>
              <article
                v-for="(finalReview, index) in essayReview.finalReviews"
                :key="index"
                class="tutor-review"
              >
                <header class="tutor-review-header">
                  <strong>Review {{ index + 1 }}</strong>
                </header>
                <div class="review-content">{{ finalReview }}</div>
              </article>
            </div>
            <template v-else>
              <label
                v-for="(_, index) in finalReviews"
                :key="index"
                class="final-review-field"
              >
                Review {{ index + 1 }}
                <select
                  v-model="selectedReviewIds[index]"
                  class="review-select final-review-select"
                  @change="syncReviewSlot(index)"
                  autocomplete="off"
                >
                  <option value="">No tutor review selected</option>
                  <option
                    v-for="review in essayReview.reviews"
                    :key="review.id"
                    :value="review.id"
                  >
                    {{ review.reviewerFirstName || 'Tutor' }} ·
                    {{ dayjs(review.submittedAt).format('l, h:mm a') }}
                  </option>
                </select>
                <textarea
                  v-model="finalReviews[index]"
                  rows="8"
                  maxlength="20000"
                  autocomplete="off"
                />
              </label>
              <button
                class="primary-button"
                type="button"
                :disabled="isUpdating || !reviewsToSend.length"
                @click="sendReviews"
              >
                {{ isUpdating ? 'Sending...' : 'Email reviews to student' }}
              </button>
            </template>
          </section>
        </div>

        <aside class="side-column">
          <section class="detail-card">
            <h2 class="section-title">Student</h2>
            <dl class="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{{ essayReview.studentFirstName || 'Unknown student' }}</dd>
              </div>
              <div>
                <dt>Feedback email</dt>
                <dd>
                  {{ essayReview.reviewEmail || essayReview.studentEmail }}
                </dd>
              </div>
              <div>
                <dt>Account email</dt>
                <dd>{{ essayReview.studentEmail }}</dd>
              </div>
              <div>
                <dt>User ID</dt>
                <dd>{{ essayReview.userId }}</dd>
              </div>
            </dl>
          </section>

          <section class="detail-card">
            <h2 class="section-title">Requested feedback</h2>
            <div v-if="essayReview.reviewReasons.length" class="chip-list">
              <span
                v-for="reason in essayReview.reviewReasons"
                :key="reason"
                class="feedback-chip"
              >
                {{ reason }}
              </span>
            </div>
            <p v-else class="muted-text">No feedback areas selected.</p>
          </section>

          <section class="detail-card">
            <h2 class="section-title">Review information</h2>
            <dl class="detail-list">
              <div>
                <dt>Status</dt>
                <dd>
                  {{
                    essayReview.status === 'reviewed' ? 'Reviewed' : 'Pending'
                  }}
                </dd>
              </div>
              <div v-if="essayReview.staffReviewedAt">
                <dt>Staff reviewed</dt>
                <dd>
                  {{ dayjs(essayReview.staffReviewedAt).format('l, h:mm a') }}
                </dd>
              </div>
              <div v-if="essayReview.staffReviewerId">
                <dt>Staff reviewer ID</dt>
                <dd>{{ essayReview.staffReviewerId }}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </template>
  </main>
</template>

<style lang="scss" scoped>
.essay-review-detail {
  max-width: 1200px;
  margin: 10px;
  padding: 20px 15px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 0;
  }
}

.back-button {
  margin-bottom: 20px;
  padding: 5px 15px;
  border: 0;
  border-radius: 20px;
  color: #417db1;
  background: transparent;
  font: inherit;
  cursor: pointer;

  &:hover {
    background: #f7fcfe;
  }
}

.detail-header {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 28px;
  border-radius: 8px;
  background: #ffffff;

  h1 {
    margin: 10px 0 6px;
    font-size: 30px;
  }
}

.header-metadata,
.submission-id,
.essay-metadata,
.muted-text {
  color: $c-secondary-grey;
  font-size: 14px;
}

.header-metadata,
.essay-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
}

.submission-id {
  margin: 0;
  overflow-wrap: anywhere;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  align-items: start;
}

.main-column,
.side-column {
  display: grid;
  gap: 20px;
}

.side-column {
  position: sticky;
  top: 24px;
}

.detail-card {
  padding: 24px;
  border-radius: 8px;
  background: #ffffff;
}

.section-title {
  margin: 0 0 16px;
  color: $c-secondary-grey;
  font-size: 16px;
}

.essay-metadata {
  margin-bottom: 20px;
}

.essay-content,
.plain-text-content {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.essay-content {
  font-size: 17px;
  line-height: 1.8;
}

.plain-text-content {
  line-height: 1.65;
}

.detail-list {
  display: grid;
  gap: 16px;
  margin: 0;

  > div {
    display: grid;
    gap: 4px;
  }

  dt {
    color: $c-secondary-grey;
    font-size: 13px;
    font-weight: 700;
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feedback-chip,
.status-badge {
  display: inline-flex;
  padding: 4px 10px;
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

.primary-button {
  min-height: 42px;
  padding: 9px 18px;
  border: 1px solid #417db1;
  border-radius: 22px;
  color: #ffffff;
  background: #417db1;
  font: inherit;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.final-review-field {
  display: block;
  margin-top: 16px;
  font-weight: 700;

  textarea {
    box-sizing: border-box;
    width: 100%;
    margin-top: 6px;
    padding: 12px;
    border: 1px solid #82929d;
    border-radius: 4px;
    font: inherit;
    font-weight: 400;
  }
}

.loading-state,
.error-message,
.success-message {
  padding: 16px;
  border-radius: 8px;
}

.tutor-review {
  margin-top: 16px;
  overflow: hidden;
  border: 1px solid #d9dfe5;
  border-radius: 8px;
}

.review-browser-label {
  display: block;
  margin: 18px 0 6px;
  font-weight: 700;
}

.review-select {
  box-sizing: border-box;
  width: 100%;
  min-height: 42px;
  padding: 8px 10px;
  border: 1px solid #82929d;
  border-radius: 4px;
  background: #ffffff;
  font: inherit;
}

.final-review-select {
  margin-top: 6px;
  font-weight: 400;
}

.tutor-review-header {
  padding: 14px 18px;
  color: $c-secondary-grey;
  background: #f8fafb;
  font-size: 14px;
}

.review-content {
  padding: 20px 18px;
  white-space: pre-wrap;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.review-slot-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 12px 18px;
  border-top: 1px solid #e7ebef;
  background: #f8fafb;

  > span {
    margin-right: 4px;
    color: $c-secondary-grey;
    font-size: 13px;
    font-weight: 700;
  }
}

.slot-button {
  padding: 6px 12px;
  border: 1px solid #417db1;
  border-radius: 16px;
  color: #417db1;
  background: #ffffff;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.slot-button-selected {
  color: #176b45;
  border-color: #176b45;
  background: #eaf8f0;
}

.loading-state {
  color: $c-secondary-grey;
  background: #ffffff;
  text-align: center;
}

.error-message {
  color: $c-error-red;
  background: #fff1f0;
}

.success-message {
  color: #176b45;
  background: #eaf8f0;
}

@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .side-column {
    position: static;
  }
}
</style>
