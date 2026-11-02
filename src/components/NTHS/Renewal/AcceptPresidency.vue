<script lang="ts" setup>
import { computed, reactive } from 'vue'
import LargeButton from '@/components/LargeButton.vue'
import FormCheckBox from '@/components/FormCheckBox.vue'
import { NTHS_COMMITMENTS } from '@/services/NTHSApplicationService'
import type { NTHSRenewalCommitments } from '@/services/NTHSGroupService'

export type AcceptPresidencyProps = {
  chapterName: string
  schoolYear?: string
  submitting?: boolean
}

defineProps<AcceptPresidencyProps>()
const emit = defineEmits<{
  (e: 'accept', commitments: NTHSRenewalCommitments): void
  (e: 'cancel'): void
}>()

const checked = reactive<Record<string, boolean>>(
  Object.fromEntries(NTHS_COMMITMENTS.map(({ key }) => [key, false]))
)
const canAccept = computed(() =>
  NTHS_COMMITMENTS.every(({ key }) => checked[key])
)

function onAccept() {
  if (!canAccept.value) return
  emit(
    'accept',
    Object.fromEntries(
      NTHS_COMMITMENTS.map(({ key }) => [key, true])
    ) as NTHSRenewalCommitments
  )
}

function onCancel() {
  emit('cancel')
}

defineExpose({ onCancel })
</script>

<template>
  <div class="accept-presidency">
    <p class="eyebrow">Accept the presidency</p>
    <h2 class="title">
      Lead {{ chapterName
      }}<template v-if="schoolYear"> in {{ schoolYear }}</template>
    </h2>
    <p class="body">
      Confirm each of the president's commitments<template v-if="schoolYear">
        for next school year</template
      >. Nothing is saved until you accept.
    </p>
    <div class="commitments">
      <FormCheckBox
        v-for="commitment in NTHS_COMMITMENTS"
        :key="commitment.key"
        v-model="checked[commitment.key]"
        :name="`renewal-${commitment.key}`"
        :label="commitment.label"
      />
    </div>
    <div class="actions">
      <LargeButton
        :showArrow="false"
        variant="secondary"
        data-testid="accept-presidency-cancel"
        :disabled="submitting"
        @click="onCancel"
        >Cancel</LargeButton
      >
      <LargeButton
        :showArrow="false"
        variant="primary-blue"
        data-testid="accept-presidency-accept"
        :disabled="!canAccept || submitting"
        @click="onAccept"
        >Accept the presidency</LargeButton
      >
    </div>
  </div>
</template>

<style lang="scss" scoped>
.accept-presidency {
  text-align: left;
  @include nths-answer-copy;
}
.commitments {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
}
</style>
