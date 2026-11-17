<script setup lang="ts">
import { ref, watch } from 'vue'
import { getAdminSafetyReviewCounts } from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'

const props = defineProps<{ refreshKey?: number }>()
const counts = ref<{ sessions: number; conversations: number } | null>(null)
const error = ref(false)
async function loadCounts() {
  error.value = false
  try {
    counts.value = await getAdminSafetyReviewCounts()
  } catch (err) {
    error.value = true
    LoggerService.noticeError(err)
  }
}
watch(() => props.refreshKey, loadCounts, { immediate: true })
</script>

<template>
  <nav class="review-tabs" aria-label="Safety review queues">
    <router-link to="/admin/sessions/review" class="review-tabs__link">
      Sessions<span v-if="counts"> ({{ counts.sessions }})</span>
    </router-link>
    <router-link to="/admin/direct-messages/review" class="review-tabs__link">
      DMs<span v-if="counts"> ({{ counts.conversations }})</span>
    </router-link>
    <button v-if="error" type="button" @click="loadCounts">
      Retry loading counts
    </button>
  </nav>
</template>

<style scoped lang="scss">
.review-tabs {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid $c-border-grey;

  &__link {
    padding: 12px 0;
  }
}

.review-tabs .router-link-exact-active {
  font-weight: bold;
  border-bottom: 3px solid $c-information-blue;
}
</style>
