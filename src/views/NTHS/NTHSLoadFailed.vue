<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Callout from '@/components/Callout.vue'
import DocumentTitle from '@/components/DocumentTitle.vue'
import LargeButton from '@/components/LargeButton.vue'

const route = useRoute()
const router = useRouter()
const isRetrying = ref(false)
const hasRetried = ref(false)
// The route record is reused when only its params change.
watch(
  () => route.fullPath,
  () => {
    hasRetried.value = false
  }
)
// Empty while retrying, so a repeat of the same wording is announced.
const statusText = computed(() => {
  if (isRetrying.value) return ''
  return hasRetried.value
    ? "We still couldn't load NTHS."
    : "We couldn't load NTHS right now."
})

async function tryAgain(): Promise<void> {
  if (isRetrying.value) return
  isRetrying.value = true
  hasRetried.value = true
  try {
    await router.replace(route.fullPath)
  } finally {
    isRetrying.value = false
  }
}
</script>

<template>
  <div class="nths-load-failed">
    <DocumentTitle title="NTHS" />
    <h1 class="visually-hidden">NTHS</h1>
    <div class="content">
      <Callout variant="warning">
        <template v-slot:content>
          <div class="callout-content" data-testid="nths-load-failed">
            <p role="status">
              {{ statusText }}
            </p>
            <LargeButton
              variant="primary-blue"
              :showArrow="false"
              :aria-disabled="isRetrying"
              :aria-busy="isRetrying"
              data-testid="nths-load-retry"
              @click="tryAgain"
            >
              {{ isRetrying ? 'Trying again…' : 'Try again' }}
            </LargeButton>
          </div>
        </template>
      </Callout>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.nths-load-failed {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: $c-background-grey;
  color: $c-soft-black;
  text-align: left;
}
.content {
  width: 80%;
  padding: clamp(20px, 3vw, 30px) clamp(16px, 4vw, 36px) 40px;

  @include breakpoint-below('medium') {
    width: 100%;
  }
}
.callout-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  padding-bottom: 8px;

  p {
    margin: 0;
  }
}
</style>
