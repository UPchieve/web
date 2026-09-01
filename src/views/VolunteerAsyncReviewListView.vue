<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import LargeButton from '@/components/LargeButton.vue'
import { EVENTS } from '@/consts'
import type { EssayReviewSubmissionForVolunteer } from '@/types/essay-review'
import { dayjs } from '@/utils/time-utils'

const route = useRoute()
const router = useRouter()
const store = useStore()
const submissions = ref<EssayReviewSubmissionForVolunteer[]>([])
const optedIn = ref(false)
const isLoading = ref(true)
const error = ref('')

const isEmailNotificationsEnabled = computed(
  () =>
    store.getters['featureFlags/isAsyncEssayReviewEmailNotificationsEnabled']
)
const sortedSubmissions = computed(() =>
  [...submissions.value].sort(
    (firstSubmission, secondSubmission) =>
      Number(firstSubmission.hasReviewed) - Number(secondSubmission.hasReviewed)
  )
)

function submissionTypeLabel(submission: EssayReviewSubmissionForVolunteer) {
  return submission.subject === 'collegeList'
    ? 'College list'
    : 'Application essay'
}

async function load() {
  isLoading.value = true
  error.value = ''
  try {
    const [submissionResponse, preferenceResponse] = await Promise.all([
      NetworkService.getEssayReviewsForVolunteer(),
      NetworkService.getEssayReviewEmailPreference(),
    ])
    submissions.value = submissionResponse.data.essayReviews
    optedIn.value = preferenceResponse.data.optedIn
    AnalyticsService.captureEvent(
      EVENTS.VOLUNTEER_ASYNC_ESSAY_REVIEW_LIST_VIEWED,
      {
        essayCount: submissions.value.length,
        applicationEssayCount: submissions.value.filter(
          (submission) => submission.subject === 'applicationEssays'
        ).length,
        collegeListCount: submissions.value.filter(
          (submission) => submission.subject === 'collegeList'
        ).length,
        source:
          typeof route.query.source === 'string'
            ? route.query.source
            : 'direct',
      }
    )
  } catch {
    error.value = 'We could not load submissions right now. Please try again.'
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

function openSubmission(submission: EssayReviewSubmissionForVolunteer) {
  AnalyticsService.captureEvent(EVENTS.VOLUNTEER_ASYNC_ESSAY_REVIEW_OPENED, {
    submissionId: submission.id,
    subject: submission.subject,
    reviewCount: submission.reviewCount,
    essayAgeHours:
      (Date.now() - new Date(submission.submittedAt).getTime()) /
      (60 * 60 * 1000),
  })
  router.push({
    name: 'VolunteerAsyncReviewDetail',
    params: { submissionId: submission.id },
  })
}

onMounted(load)
</script>

<template>
  <main class="volunteer-async-reviews">
    <header class="page-header">
      <h1>Submissions awaiting review</h1>
      <p>
        Choose any submission below. You will only see subjects you are
        certified to review, and multiple tutors may review the same one.
      </p>
    </header>

    <p v-if="error" class="error-message" role="alert">{{ error }}</p>
    <div v-if="isLoading" class="empty-state">Loading submissions...</div>

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
        Email me when new submissions need reviews
      </label>

      <div v-if="submissions.length" class="review-table-wrapper">
        <table class="review-table">
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Submission type</th>
              <th>Words</th>
              <th>Reviews</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="submission in sortedSubmissions"
              :key="submission.id"
              class="review-row"
              tabindex="0"
              @click="openSubmission(submission)"
              @keydown.enter="openSubmission(submission)"
              @keydown.space.prevent="openSubmission(submission)"
            >
              <td data-label="Submitted">
                {{ dayjs(submission.submittedAt).format('l, h:mm a') }}
              </td>
              <td data-label="Submission type">
                <span
                  class="subject-badge"
                  :class="`subject-badge-${submission.subject}`"
                >
                  {{ submissionTypeLabel(submission) }}
                </span>
                <div
                  v-if="
                    submission.subject === 'applicationEssays' &&
                    submission.essayPurpose
                  "
                  class="submission-purpose"
                >
                  {{ submission.essayPurpose }}
                </div>
              </td>
              <td data-label="Words">
                {{ submission.wordCount.toLocaleString() }}
              </td>
              <td data-label="Reviews">{{ submission.reviewCount }}</td>
              <td data-label="Status">
                <span
                  class="status-badge"
                  :class="
                    submission.hasReviewed
                      ? 'status-badge-reviewed'
                      : 'status-badge-pending'
                  "
                >
                  {{ submission.hasReviewed ? 'Reviewed by you' : 'Available' }}
                </span>
              </td>
              <td class="review-action-cell">
                <large-button
                  variant="primary-blue"
                  :showArrow="false"
                  class="outline-button"
                  type="button"
                  @click.stop="openSubmission(submission)"
                >
                  View
                </large-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <section v-else class="detail-card empty-state">
        <h2>No submissions are waiting right now</h2>
        <p>We'll add new submissions here as students send them.</p>
      </section>
    </template>
  </main>
</template>

<style lang="scss" scoped>
.volunteer-async-reviews {
  max-width: 1200px;
  margin: 10px;
  padding: 20px 15px 60px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 0 0 60px;
  }
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

.detail-card {
  box-sizing: border-box;
  width: 100%;
  margin: 0 0 20px;
  padding: 24px;
  border-radius: 8px;
  background: #ffffff;
  text-align: left;
}

.email-preference {
  display: flex;
  gap: 10px;
  align-items: center;
  cursor: pointer;
}

.status-badge,
.subject-badge {
  display: inline-flex;
  width: fit-content;
  padding: 4px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.subject-badge-applicationEssays {
  color: #285f8f;
  background: #eaf3fb;
}

.subject-badge-collegeList {
  color: #65530d;
  background: #fff5cc;
}

.submission-purpose {
  margin-top: 6px;
  color: $c-secondary-grey;
  font-size: 13px;
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

.outline-button {
  padding: 7px 14px;
  border: 1px solid #417db1;
  border-radius: 18px;
  color: #417db1;
  background: #ffffff;
  font: inherit;
  cursor: pointer;
}

.error-message {
  padding: 16px;
  border-radius: 8px;
  color: $c-error-red;
  background: #fff1f0;
}

.empty-state {
  padding: 40px 24px;
  text-align: center;
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

  .review-table .status-badge,
  .review-table .subject-badge {
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
</style>
