<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Loader from '@/components/Loader.vue'
import LargeButton from '@/components/LargeButton.vue'
import SessionFlags from '@/components/Admin/SessionFlags.vue'
import ChatLog from '@/components/Admin/ChatLog/index.vue'
import StudentIcon from '@/assets/user_avatars/student-icon.svg'
import VolunteerIcon from '@/assets/user_avatars/volunteer-icon.svg'
import {
  getAdminDirectMessageReview,
  getAdminDirectMessageHistory,
  reviewAdminDirectMessageFlags,
} from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import type { DirectMessageReview } from '@/types/direct-messages'
import type { Uuid } from '@/types/shared'

const route = useRoute()
const review = ref<DirectMessageReview | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const isLoadingOlder = ref(false)
const error = ref('')
const status = ref('')

const conversationId = computed(() => String(route.params.conversationId))

const flagGroups = computed(() => {
  const groups = new Map<string, DirectMessageReview['flags']>()
  for (const flag of review.value?.flags ?? []) {
    const flags = groups.get(flag.category) ?? []
    flags.push(flag)
    groups.set(flag.category, flags)
  }

  return Array.from(groups, ([category, flags]) => ({ category, flags }))
})

const chatMessages = computed(() =>
  (review.value?.messages ?? []).map((message) => ({
    id: message.id,
    user: message.senderId,
    contents: message.contents,
    createdAt: message.createdAt,
    type: 'text',
  }))
)

async function load() {
  review.value = null
  isLoading.value = true
  error.value = ''

  try {
    const result = await getAdminDirectMessageReview(conversationId.value)
    review.value = result
  } catch (err) {
    LoggerService.noticeError(err)
    error.value = 'Could not load the conversation. Please try again.'
  } finally {
    isLoading.value = false
  }
}

function name(userId?: Uuid) {
  const conversation = review.value?.conversation
  if (!conversation) {
    return 'Unknown participant'
  }
  if (userId === conversation.studentId) {
    return `${conversation.studentName} (student)`
  }
  if (userId === conversation.volunteerId) {
    return `${conversation.volunteerName} (coach)`
  }

  return 'Unknown participant'
}

async function markReviewed() {
  if (!review.value?.flags.length || isSubmitting.value) {
    return
  }

  const currentConversationId = review.value.conversation.id
  const flagIds = review.value.flags.map((flag) => flag.id)
  isSubmitting.value = true
  error.value = ''

  try {
    const { reviewedCount } = await reviewAdminDirectMessageFlags(
      currentConversationId,
      flagIds
    )
    if (conversationId.value !== currentConversationId) {
      return
    }
    status.value = `${reviewedCount} ${reviewedCount === 1 ? 'flag' : 'flags'} marked reviewed.`
    await load()
  } catch (err) {
    LoggerService.noticeError(err)
    error.value = 'Could not save the review. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

async function loadOlder() {
  if (!review.value?.messages.length || isLoadingOlder.value) {
    return
  }

  const currentReview = review.value
  isLoadingOlder.value = true
  error.value = ''

  try {
    const history = await getAdminDirectMessageHistory(
      currentReview.conversation.id,
      currentReview.messages[0].id
    )

    if (review.value !== currentReview) {
      return
    }

    currentReview.messages.unshift(...history.messages)
    currentReview.hasMore = history.hasMore
  } catch (err) {
    LoggerService.noticeError(err)
    error.value = 'Could not load older messages. Please try again.'
  } finally {
    isLoadingOlder.value = false
  }
}

watch(
  conversationId,
  () => {
    status.value = ''
    load()
  },
  { immediate: true }
)
</script>

<template>
  <main class="dm-review">
    <router-link to="/admin/direct-messages/review"
      >← Back to DM reviews</router-link
    >
    <h1>DM Review</h1>
    <p v-if="error" role="alert">
      {{ error }} <button type="button" @click="load">Reload</button>
    </p>
    <p v-if="status" role="status">{{ status }}</p>
    <Loader v-if="isLoading" message="Loading conversation" />

    <template v-else-if="review">
      <SessionFlags
        :flags="[...new Set(review.flags.map((flag) => flag.category))]"
      />
      <section class="dm-review__section">
        <h2>Review conversation</h2>
        <p>
          {{ review.flags.length }} pending
          {{ review.flags.length === 1 ? 'flag' : 'flags' }} to review.
        </p>
        <LargeButton
          button-type="button"
          variant="primary-blue"
          :show-arrow="false"
          class="dm-review__review-button"
          data-testid="mark-flags-reviewed"
          :disabled="!review.flags.length || isSubmitting"
          @click="markReviewed"
        >
          {{ isSubmitting ? 'Saving...' : 'Mark flags reviewed' }}
        </LargeButton>
        <p class="dm-review__hint">
          Marks all pending flags below as reviewed.
        </p>
      </section>

      <section class="dm-review__section">
        <h2>Student</h2>
        <router-link
          class="dm-review__participant"
          :to="`/admin/users/${review.conversation.studentId}`"
        >
          <StudentIcon /> <strong>{{ review.conversation.studentName }}</strong>
        </router-link>
      </section>

      <section class="dm-review__section">
        <h2>Volunteer</h2>
        <router-link
          class="dm-review__participant"
          :to="`/admin/users/${review.conversation.volunteerId}`"
        >
          <VolunteerIcon />
          <strong>{{ review.conversation.volunteerName }}</strong>
        </router-link>
      </section>

      <section class="dm-review__section">
        <h2>Pending review reasons</h2>
        <p class="dm-review__hint" v-if="review.flags.length">
          Expand a reason to read the reports or moderation details. All pending
          flags below are included when you mark this conversation reviewed.
        </p>

        <p v-if="!review.flags.length">No pending flags remain.</p>
        <details
          v-for="group in flagGroups"
          :key="group.category"
          class="dm-review__reason"
        >
          <summary>
            {{ group.category }}
            <span class="dm-review__hint"
              >({{ group.flags.length }} pending
              {{ group.flags.length === 1 ? 'flag' : 'flags' }})</span
            >
          </summary>

          <article
            v-for="flag in group.flags"
            :key="flag.id"
            class="dm-review__flag"
          >
            <template v-if="flag.reportReason">
              <h3 class="dm-review__event">
                {{ name(flag.reportingUserId) }} reported
                {{ name(flag.reportedUserId) }}.
              </h3>
              <div class="dm-review__report-meta">
                <span class="dm-review__source">User report</span>
                <time class="dm-review__hint">{{
                  new Date(flag.createdAt).toLocaleString()
                }}</time>
              </div>
              <dl>
                <dt>Reason for reporting</dt>
                <dd class="dm-review__report-reason">
                  {{ flag.reportReason }}
                </dd>
                <dt>Reporter's comments</dt>
                <dd class="dm-review__text dm-review__evidence">
                  {{ flag.reportMessage || 'No additional details provided.' }}
                </dd>
              </dl>
            </template>
            <template v-else-if="flag.censoredMessage !== undefined">
              <h3>
                {{
                  flag.blocked
                    ? 'Blocked attempt — not delivered'
                    : 'Message checked by moderation'
                }}
              </h3>
              <p class="dm-review__event">
                {{ name(flag.senderId) }} tried to send this message.
              </p>
              <time class="dm-review__hint">{{
                new Date(flag.createdAt).toLocaleString()
              }}</time>
              <dl>
                <dt>Message</dt>
                <dd class="dm-review__text dm-review__evidence">
                  {{ flag.censoredMessage }}
                </dd>
                <dt>Flagged for</dt>
                <dd>{{ flag.reasons?.join(', ') || flag.category }}</dd>
                <dt>Detected by</dt>
                <dd>
                  {{
                    flag.censoredBy === 'ai'
                      ? 'AI moderation'
                      : 'Regex moderation'
                  }}
                </dd>
              </dl>
            </template>

            <template v-else>
              <h3>{{ flag.category }}</h3>
              <time class="dm-review__hint">{{
                new Date(flag.createdAt).toLocaleString()
              }}</time>
            </template>
          </article>
        </details>
      </section>

      <section class="dm-review__section">
        <h2>Chat log</h2>
        <p class="dm-review__hint">
          Messages delivered to the conversation. Blocked attempts appear in the
          review details above.
        </p>
        <button
          v-if="review.hasMore"
          type="button"
          :disabled="isLoadingOlder || isSubmitting"
          @click="loadOlder"
        >
          {{ isLoadingOlder ? 'Loading…' : 'Load older messages' }}
        </button>
        <p v-if="!review.messages.length">No delivered messages.</p>
        <ChatLog
          v-if="review.messages.length"
          :messages="chatMessages"
          :student="{
            id: review.conversation.studentId,
            firstname: review.conversation.studentName,
          }"
          :volunteer="{
            id: review.conversation.volunteerId,
            firstname: review.conversation.volunteerName,
          }"
        />
      </section>
    </template>
  </main>
</template>

<style scoped lang="scss">
.dm-review {
  margin: 10px;
  padding: 20px 15px;
  background: white;
  border-radius: 8px;
  max-width: 800px;
  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 40px;
  }
  h1 {
    margin: 16px 0;
  }
  h2 {
    color: $c-secondary-grey;
    font-size: 16px;
    margin: 0 0 16px;
  }
  h3 {
    font-size: 16px;
    margin: 0 0 8px;
  }
  &__section {
    padding: 24px 0;
    border-bottom: 1px solid $c-border-grey;
  }
  &__hint {
    color: #626773;
    font-size: 14px;
    line-height: 1.6;
  }
  &__participant {
    display: flex;
    align-items: center;
    gap: 16px;
    max-width: 400px;
    padding: 10px;
    color: $c-soft-black;
    text-decoration: none;
    &:hover {
      background: #f9f9f9;
    }
    svg {
      width: 32px;
      height: 32px;
    }
    span {
      margin-left: auto;
      font-size: 14px;
      color: $c-secondary-grey;
    }
  }
  &__reason {
    border-bottom: 1px solid $c-border-grey;
    padding: 16px 0;
    summary {
      cursor: pointer;
      font-weight: 600;
    }
  }
  &__flag {
    padding: 20px;
    margin-top: 16px;
    border: 1px solid $c-border-grey;
    border-radius: 6px;
    background: #f9fafb;
  }
  &__review-button {
    width: auto;
    padding: 8px 16px;
    font-size: 14px;
  }
  &__report-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin-top: 8px;
  }
  &__source {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    background: white;
    border: 1px solid $c-border-grey;
  }
  &__report-reason {
    font-weight: 600;
    color: $c-soft-black;
  }
  &__evidence {
    padding: 12px 16px;
    background: white;
    border-left: 3px solid $c-border-grey;
    line-height: 1.6;
  }
  &__event {
    margin: 8px 0 4px;
  }
  &__text {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  dl {
    display: grid;
    grid-template-columns: 1fr;
    gap: 4px;
    font-size: 14px;
  }
  dt {
    margin-top: 12px;
    color: $c-secondary-grey;
    font-weight: 600;
  }
  dd {
    margin: 0;
  }
}
</style>
