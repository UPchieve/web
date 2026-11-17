<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminReviewTabs from '@/components/Admin/AdminReviewTabs.vue'
import PageControl from '@/components/Admin/PageControl.vue'
import Loader from '@/components/Loader.vue'
import SessionFlags from '@/components/Admin/SessionFlags.vue'
import { dayjs } from '@/utils/time-utils'
import { getAdminDirectMessageReviews } from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import type { DirectMessageReviewSummary } from '@/types/direct-messages'

const route = useRoute()
const router = useRouter()
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const conversations = ref<DirectMessageReviewSummary[]>([])
const isLoading = ref(true)
const isLastPage = ref(false)
const error = ref('')

async function load() {
  isLoading.value = true
  error.value = ''
  try {
    const result = await getAdminDirectMessageReviews(page.value)
    conversations.value = result.conversations
    isLastPage.value = result.isLastPage
  } catch (err) {
    LoggerService.noticeError(err)
    error.value = 'Could not load DM reviews. Please try again.'
  } finally {
    isLoading.value = false
  }
}

function setPage(value: number) {
  router.push({ query: { page: value } })
}

watch(page, load, { immediate: true })
</script>

<template>
  <main class="dm-reviews">
    <AdminReviewTabs />
    <p>DM conversations needing review, ordered by the oldest pending flag.</p>
    <PageControl
      :page="page"
      :is-first-page="page === 1"
      :is-last-page="isLastPage"
      @next-page="setPage(page + 1)"
      @previous-page="setPage(page - 1)"
    />

    <p v-if="error" role="alert">
      {{ error }} <button type="button" @click="load">Retry</button>
    </p>

    <Loader v-else-if="isLoading" message="Loading DM reviews" />
    <template v-else>
      <p v-if="!conversations.length">No DM conversations need review.</p>
      <div v-else class="dm-reviews__list">
        <router-link
          v-for="conversation in conversations"
          :key="conversation.id"
          :to="`/admin/direct-messages/${conversation.id}`"
          class="dm-reviews__row"
        >
          <div class="dm-reviews__summary">
            <div class="dm-reviews__column">
              <span class="dm-reviews__label">Student</span
              ><strong>{{ conversation.studentName }}</strong>
            </div>
            <div class="dm-reviews__column">
              <span class="dm-reviews__label">Coach</span
              ><span>{{ conversation.volunteerName }}</span>
            </div>
            <div class="dm-reviews__column">
              <span class="dm-reviews__label">Needs review</span
              ><span
                >{{ conversation.pendingFlags }} pending
                {{ conversation.pendingFlags === 1 ? 'flag' : 'flags' }}</span
              >
            </div>
            <div class="dm-reviews__column">
              <span class="dm-reviews__label">Oldest pending flag</span
              ><time :datetime="conversation.oldestFlagAt">{{
                dayjs(conversation.oldestFlagAt).format('l, h:mm a')
              }}</time>
            </div>
          </div>
          <SessionFlags :flags="conversation.reasons" />
        </router-link>
      </div>
    </template>
  </main>
</template>

<style scoped lang="scss">
.dm-reviews {
  background: #fff;
  margin: 10px;
  padding: 10px;
  border-radius: 8px;
  overflow: hidden;
  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 40px;
  }
  &__list {
    max-width: 1200px;
  }
  &__row {
    display: block;
    padding: 20px 16px;
    color: $c-soft-black;
    text-decoration: none;
    border-bottom: 1px solid $c-border-grey;
    &:hover,
    &:focus-visible {
      background-color: #fbfbfb;
      text-decoration: none;
    }
    @include breakpoint-above('medium') {
      padding: 20px 40px;
    }
  }
  &__summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    @include breakpoint-above('medium') {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  &__column {
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-wrap: anywhere;
  }
  &__label {
    color: $c-secondary-grey;
    font-size: 14px;
  }
}
</style>
