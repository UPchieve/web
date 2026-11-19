<script setup lang="ts">
import { computed } from 'vue'
import type { NTHSChapterImpactPublic } from '@/services/NTHSGroupService'
import {
  formatProgressHours,
  LOADING_IMPACT_PLACEHOLDER,
} from '@/services/NTHSImpactService'
import RequirementMeter from '@/components/NTHS/HQ/RequirementMeter.vue'

const props = defineProps<{ impact?: NTHSChapterImpactPublic }>()

// While loading, the card keeps its loaded shape with greyed text so nothing
// jumps. Goals come from the API, so the meters show no goal text until then.
const shown = computed(() => props.impact ?? LOADING_IMPACT_PLACEHOLDER)
const isLoading = computed(() => !props.impact)
</script>

<template>
  <section
    class="card"
    :class="{ 'is-loading': isLoading }"
    :aria-busy="isLoading"
    :data-testid="isLoading ? 'good-standing-loading' : 'good-standing'"
  >
    <span class="card-eyebrow">Good standing</span>
    <div
      class="meters"
      data-testid="good-standing-meters"
      :aria-hidden="isLoading || undefined"
    >
      <RequirementMeter
        label="Hours tutored"
        data-testid="hours-meter"
        variant="hours"
        :value="shown.schoolYearToDate.hoursTutored"
        :displayValue="formatProgressHours(shown.schoolYearToDate.hoursTutored)"
        :goal="shown.goals.hoursTutored"
        note="Keeps your chapter in good standing"
        :loading="isLoading"
      />
      <RequirementMeter
        label="Members tutoring"
        data-testid="members-meter"
        variant="members"
        :value="shown.schoolYearToDate.membersTutoring"
        :goal="shown.goals.membersTutoring"
        :note="
          isLoading || shown.official
            ? undefined
            : `${shown.goals.membersTutoring} makes you official`
        "
        :loading="isLoading"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.card {
  @include nths-card(24px 26px);
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.card-eyebrow {
  @include nths-card-eyebrow;
  color: $c-nths-navy;
}
.meters {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.is-loading {
  :deep(.meter-label),
  :deep(.meter-value) {
    color: transparent;
    background: $c-border-grey;
    border-radius: 4px;
  }
}
</style>
