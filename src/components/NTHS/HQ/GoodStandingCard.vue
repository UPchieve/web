<script setup lang="ts">
import { computed, ref } from 'vue'
import InformationIcon from '@/assets/nths/information-outline.svg'
import TargetIcon from '@/assets/nths/target.svg'
import type { NTHSChapterImpactPublic } from '@upchieve/api-contracts/nths-groups'
import {
  formatProgressHours,
  LOADING_IMPACT_PLACEHOLDER,
  standingFor,
  type Standing,
} from '@/services/NTHSImpactService'
import RequirementMeter from '@/components/NTHS/HQ/RequirementMeter.vue'

const props = defineProps<{ impact?: NTHSChapterImpactPublic }>()

// While loading, the card keeps its loaded shape with greyed text so nothing
// jumps. Goals come from the API, so the meters show no goal text until then.
const shown = computed(() => props.impact ?? LOADING_IMPACT_PLACEHOLDER)
const isLoading = computed(() => !props.impact)

const TOOLTIP_TEXTS: Record<Standing, string> = {
  'official-good-standing':
    'Your chapter is in good standing with 3 active members who have each tutored at least once, and 40 hours tutored this school year.',
  official:
    'Your chapter is official. It will be in good standing with 40 hours tutored this school year.',
  pending:
    'Your chapter will be official with 3 active members who have each tutored at least once, and in good standing with 40 hours tutored this school year.',
}
const tooltipText = computed(() =>
  props.impact ? TOOLTIP_TEXTS[standingFor(props.impact)] : ''
)

const heading = ref<HTMLElement>()
// A tap fires mouseenter and then click, so with both on, one tap opens the tooltip and closes it.
const canHover = window.matchMedia('(hover: hover)').matches
</script>

<template>
  <section
    class="card"
    :class="{ 'is-loading': isLoading }"
    aria-labelledby="chapter-goals-title"
    :aria-busy="isLoading"
    :data-testid="isLoading ? 'good-standing-loading' : 'good-standing'"
  >
    <div ref="heading" class="card-heading">
      <TargetIcon class="goal-icon" aria-hidden="true" />
      <h2 id="chapter-goals-title" class="card-title">Chapter goals</h2>
      <v-tooltip
        v-if="!isLoading"
        attach
        location="bottom end"
        :target="heading"
        :offset="6"
        max-width="280"
        open-on-focus
        :open-on-hover="canHover"
        :open-on-click="!canHover"
      >
        <template v-slot:activator="{ props: activatorProps }">
          <button
            type="button"
            class="info-button"
            aria-label="What are chapter goals?"
            data-testid="goals-info-button"
            v-bind="activatorProps"
          >
            <InformationIcon aria-hidden="true" />
          </button>
        </template>
        <span data-testid="goals-tooltip">{{ tooltipText }}</span>
      </v-tooltip>
    </div>
    <div
      class="meters"
      data-testid="good-standing-meters"
      :aria-hidden="isLoading || undefined"
    >
      <RequirementMeter
        label="Hours tutored"
        data-testid="hours-meter"
        :value="shown.schoolYearToDate.hoursTutored"
        :displayValue="formatProgressHours(shown.schoolYearToDate.hoursTutored)"
        :goal="shown.goals.hoursTutored"
        :loading="isLoading"
      />
      <RequirementMeter
        label="Members tutoring"
        data-testid="members-meter"
        :value="shown.schoolYearToDate.membersTutoring"
        :goal="shown.goals.membersTutoring"
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
.card-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}
.goal-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  color: $c-soft-black;
}
.card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.3;
}
.info-button {
  display: flex;
  margin-left: auto;
  padding: 4px;
  border: 0;
  background: none;
  cursor: pointer;
}
.card-heading :deep(.v-overlay__content) {
  padding: 10px 12px;
  border-radius: 6px;
  background: $c-soft-black;
  color: $upchieve-white;
  font-size: 14px;
  line-height: 1.4;
}
.meters {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.is-loading {
  :deep(.meter-label),
  :deep(.meter-value) {
    @include nths-skeleton;
  }
}
</style>
