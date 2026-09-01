<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { dayjs } from '@/utils/time-utils'
import NetworkService from '@/services/NetworkService'
import type {
  EssayReviewStatus,
  EssayReviewSubmission,
} from '@/types/essay-review'

type EssayReviewStatusFilter = EssayReviewStatus | 'all'

const router = useRouter()

const essayReviews = ref<EssayReviewSubmission[]>([])
const selectedStatus = ref<EssayReviewStatusFilter>('pending')
const currentPage = ref(1)
const pageSize = 25
const isLoading = ref(false)
const loadError = ref('')

const statusOptions: Array<{
  label: string
  value: EssayReviewStatusFilter
}> = [
  { label: 'Pending', value: 'pending' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'All', value: 'all' },
]

const filteredEssayReviews = computed(() => {
  if (selectedStatus.value === 'all') return essayReviews.value

  return essayReviews.value.filter(
    (essayReview) => essayReview.status === selectedStatus.value
  )
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredEssayReviews.value.length / pageSize))
)

const paginatedEssayReviews = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize
  return filteredEssayReviews.value.slice(startIndex, startIndex + pageSize)
})

const resultStart = computed(() => {
  if (!filteredEssayReviews.value.length) return 0
  return (currentPage.value - 1) * pageSize + 1
})

const resultEnd = computed(() =>
  Math.min(currentPage.value * pageSize, filteredEssayReviews.value.length)
)

function formatSubmittedAt(submittedAt: string) {
  return dayjs(submittedAt).format('l, h:mm a')
}

function getStatusLabel(status: EssayReviewStatus) {
  return status === 'reviewed' ? 'Reviewed' : 'Pending'
}

function selectStatus(status: EssayReviewStatusFilter) {
  selectedStatus.value = status
  currentPage.value = 1
}

function openEssayReview(submissionId: string) {
  router.push({
    name: 'AdminEssayReviewDetail',
    params: { submissionId },
  })
}

async function loadEssayReviews() {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await NetworkService.adminGetEssayReviews()
    essayReviews.value = response.data.essayReviews ?? []

    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  } catch {
    loadError.value = 'There was an issue loading async reviews.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadEssayReviews)
</script>

<template>
  <main class="essay-review-list">
    <header class="page-header">
      <div>
        <h1>Async reviews</h1>
        <p>Review student submissions and track completed feedback.</p>
      </div>

      <button
        class="outline-button"
        type="button"
        :disabled="isLoading"
        @click="loadEssayReviews"
      >
        {{ isLoading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </header>

    <section class="review-queue">
      <div class="queue-header">
        <div class="status-filters" aria-label="Filter async reviews">
          <button
            v-for="statusOption in statusOptions"
            :key="statusOption.value"
            type="button"
            class="status-filter-button"
            :class="{
              'status-filter-button-active':
                selectedStatus === statusOption.value,
            }"
            :aria-pressed="selectedStatus === statusOption.value"
            @click="selectStatus(statusOption.value)"
          >
            {{ statusOption.label }}
          </button>
        </div>

        <p class="result-count">
          <template v-if="filteredEssayReviews.length">
            Showing {{ resultStart }}–{{ resultEnd }} of
            {{ filteredEssayReviews.length }}
          </template>
          <template v-else>0 submissions</template>
        </p>
      </div>

      <p v-if="loadError" class="error-message" role="alert">
        {{ loadError }}
      </p>

      <div v-if="isLoading" class="empty-state">Loading async reviews…</div>

      <div v-else-if="!paginatedEssayReviews.length" class="empty-state">
        <h2>No async reviews found</h2>
        <p>There are no submissions matching this filter.</p>
      </div>

      <div v-else class="review-table-wrapper">
        <table class="review-table">
          <thead>
            <tr>
              <th scope="col">Submitted</th>
              <th scope="col">Student</th>
              <th scope="col">Submission type</th>
              <th scope="col">Words</th>
              <th scope="col">Status</th>
              <th scope="col"><span class="visually-hidden">Action</span></th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="essayReview in paginatedEssayReviews"
              :key="essayReview.id"
              class="review-row"
              tabindex="0"
              @click="openEssayReview(essayReview.id)"
              @keydown.enter="openEssayReview(essayReview.id)"
              @keydown.space.prevent="openEssayReview(essayReview.id)"
            >
              <td>{{ formatSubmittedAt(essayReview.submittedAt) }}</td>
              <td>
                <strong>
                  {{ essayReview.studentFirstName || 'Unknown student' }}
                </strong>
                <div class="student-email">{{ essayReview.studentEmail }}</div>
              </td>
              <td>
                {{
                  essayReview.subject === 'collegeList'
                    ? 'College list'
                    : 'Essay Review'
                }}
              </td>
              <td>{{ essayReview.wordCount.toLocaleString() }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="{
                    'status-badge-pending': essayReview.status === 'pending',
                    'status-badge-reviewed': essayReview.status === 'reviewed',
                  }"
                >
                  {{ getStatusLabel(essayReview.status) }}
                </span>
              </td>
              <td class="action-cell">
                <button
                  class="outline-button smallButton"
                  type="button"
                  @click.stop="openEssayReview(essayReview.id)"
                >
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer v-if="totalPages > 1" class="pagination">
        <button
          class="outline-button"
          type="button"
          :disabled="currentPage === 1"
          @click="currentPage -= 1"
        >
          ← Previous
        </button>

        <span>Page {{ currentPage }} of {{ totalPages }}</span>

        <button
          class="outline-button"
          type="button"
          :disabled="currentPage === totalPages"
          @click="currentPage += 1"
        >
          Next →
        </button>
      </footer>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.essay-review-list {
  max-width: 1200px;
  margin: 10px;
  padding: 20px 15px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 0;
  }
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-start;
  justify-content: space-between;
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

.review-queue {
  overflow: hidden;
  border-radius: 8px;
  background: #ffffff;
}

.queue-header {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #ececec;
}

.status-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-filter-button,
.outline-button {
  border: 1px solid #417db1;
  border-radius: 20px;
  color: #417db1;
  background: #ffffff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f7fcfe;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.status-filter-button {
  padding: 7px 14px;
}

.status-filter-buttonActive {
  color: #ffffff;
  background: #417db1;
}

.outline-button {
  padding: 8px 18px;
}

.smallButton {
  padding: 5px 15px;
}

.result-count,
.student-email,
.pagination {
  color: $c-secondary-grey;
  font-size: 14px;
}

.review-table-wrapper {
  overflow-x: auto;
}

.review-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  th,
  td {
    padding: 16px 20px;
    border-bottom: 1px solid #ececec;
    vertical-align: middle;
  }

  th {
    color: $c-secondary-grey;
    background: #fafafa;
    font-size: 13px;
    text-transform: uppercase;
  }
}

.review-row {
  cursor: pointer;

  &:hover {
    background: #f7fcfe;
  }
}

.action-cell {
  text-align: right;
}

.status-badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.status-badgePending {
  color: #8a4b08;
  background: #fff4e5;
}

.status-badgeReviewed {
  color: #176b45;
  background: #eaf8f0;
}

.empty-state {
  padding: 64px 24px;
  text-align: center;

  h2 {
    margin: 0 0 8px;
  }

  p {
    margin: 0;
    color: $c-secondary-grey;
  }
}

.pagination {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: flex-end;
  padding: 20px;
}

.error-message {
  margin: 20px;
  padding: 12px 14px;
  border-radius: 6px;
  color: $c-error-red;
  background: #fff1f0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  margin: -1px;
  clip: rect(0 0 0 0);
}
</style>
