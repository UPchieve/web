<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { dayjs } from '@/utils/time-utils'
import NetworkService from '@/services/NetworkService'
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

const submissionId = computed(() => String(route.params.submissionId))
const nextStatus = computed<EssayReviewStatus>(() =>
  essayReview.value?.status === 'reviewed' ? 'pending' : 'reviewed'
)
const actionLabel = computed(() =>
  essayReview.value?.status === 'reviewed'
    ? 'Return to pending'
    : 'Mark as reviewed'
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
  } catch {
    loadError.value = 'There was an issue loading this essay review.'
  } finally {
    isLoading.value = false
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
          :disabled="isUpdating"
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
              <div v-if="essayReview.reviewedAt">
                <dt>Reviewed</dt>
                <dd>{{ dayjs(essayReview.reviewedAt).format('l, h:mm a') }}</dd>
              </div>
              <div v-if="essayReview.reviewedBy">
                <dt>Reviewed by</dt>
                <dd>{{ essayReview.reviewedBy }}</dd>
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

.loading-state,
.error-message,
.success-message {
  padding: 16px;
  border-radius: 8px;
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
