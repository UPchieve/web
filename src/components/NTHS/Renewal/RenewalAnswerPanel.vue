<script lang="ts" setup>
import { computed, ref } from 'vue'
import LargeButton from '@/components/LargeButton.vue'
import AcceptPresidency from '@/components/NTHS/Renewal/AcceptPresidency.vue'
import { useRenewalNaming } from '@/composables/useRenewalNaming'
import {
  renewalCountdownLabel,
  renewalDate,
  renewalDaysLeft,
  renewalSchoolYear,
} from '@/services/NTHSRenewalService'
import type { NTHSRenewalCommitments } from '@/services/NTHSGroupService'

const props = defineProps<{ groupId: string }>()

const isAskingCommitments = ref(false)
let resolveCommitments: (answer?: NTHSRenewalCommitments) => void = () =>
  undefined

const { renewal, chapterName, isSubmitting, errorMessage, accept, decline } =
  useRenewalNaming(
    () => props.groupId,
    () => {
      isAskingCommitments.value = true
      return new Promise((resolve) => {
        resolveCommitments = resolve
      })
    }
  )

const schoolYear = computed(() =>
  renewalSchoolYear(renewal.value?.closesOn ?? null)
)

const question = computed(() => {
  const closesOn = renewalDate(renewal.value?.closesOn ?? null)
  if (renewal.value?.prompt === 'member-must-answer') {
    return {
      title: `${chapterName.value} needs a president for ${schoolYear.value}`,
      body: `Nobody has accepted the presidency for next school year yet. If nobody accepts by ${closesOn}, ${chapterName.value} closes and everyone leaves the chapter. Your UPchieve account stays open, and you can keep tutoring. Will you lead it?`,
      primary: "I'll lead the chapter",
      secondary: 'Not me',
    }
  }
  const stakes = `Accept to keep it running, or step down so someone else can. If nobody accepts by ${closesOn}, the chapter closes.`
  const named = renewal.value?.namedSelf
    ? {
        title: `You said you'd lead ${chapterName.value} in ${schoolYear.value}. Still on?`,
        body: stakes,
      }
    : {
        title: `You've been named president of ${chapterName.value} for ${schoolYear.value}`,
        body: `Your chapter's admins named you to lead the chapter next school year. ${stakes}`,
      }
  return {
    ...named,
    primary: renewal.value?.commitmentsRequired
      ? 'Accept the presidency'
      : 'Accept',
    secondary: 'Step down',
  }
})

const countdown = computed(() => {
  const r = renewal.value
  if (!r?.memberStageOpen) return ''
  return renewalCountdownLabel(renewalDaysLeft(r.closesOn))
})

// The step stays up through the POST so the question doesn't flash behind it.
async function onAccept() {
  await accept()
  isAskingCommitments.value = false
}
</script>

<template>
  <section class="renewal-answer-panel" data-testid="renewal-answer-panel">
    <p v-if="countdown" class="countdown" data-testid="renewal-countdown-chip">
      {{ countdown }}
    </p>
    <AcceptPresidency
      v-if="isAskingCommitments"
      :chapterName="chapterName"
      :schoolYear="schoolYear"
      :submitting="isSubmitting"
      @accept="resolveCommitments"
      @cancel="resolveCommitments()"
    />
    <template v-else>
      <p class="eyebrow">Before you continue</p>
      <h2 class="title">{{ question.title }}</h2>
      <p class="body">{{ question.body }}</p>
      <div class="actions">
        <LargeButton
          variant="secondary"
          :showArrow="false"
          data-testid="renewal-answer-secondary"
          :disabled="isSubmitting"
          @click="decline"
          >{{ question.secondary }}</LargeButton
        >
        <LargeButton
          variant="primary-blue"
          :showArrow="false"
          data-testid="renewal-answer-primary"
          :disabled="isSubmitting"
          @click="onAccept"
          >{{ question.primary }}</LargeButton
        >
      </div>
    </template>
    <p
      v-if="errorMessage"
      class="error"
      role="alert"
      data-testid="renewal-answer-error"
    >
      {{ errorMessage }}
    </p>
  </section>
</template>

<style lang="scss" scoped>
.renewal-answer-panel {
  @include nths-card;
  @include nths-answer-copy;
  max-width: 640px;
}
.countdown {
  @include nths-badge;
  background: $c-error-red;
  border-radius: 9999px;
  color: $upchieve-white;
  margin: 0 0 12px;
}
.error {
  @include nths-error-box;
  margin: 16px 0 0;
}
</style>
