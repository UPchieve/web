<script setup lang="ts">
import { computed } from 'vue'
import type { NTHSChapterImpactPublic } from '@/services/NTHSGroupService'
import { allTimeLine, formatProgressHours } from '@/services/NTHSImpactService'
import RequirementMeter from '@/components/NTHS/HQ/RequirementMeter.vue'
import StandingChip from '@/components/NTHS/HQ/StandingChip.vue'

const props = defineProps<{ impact?: NTHSChapterImpactPublic }>()

// While loading, the panel keeps its loaded shape with greyed text so nothing
// jumps. Goals come from the API, so the meters show no goal text until then.
const PLACEHOLDER: NTHSChapterImpactPublic = {
  groupId: '',
  schoolYear: { label: '0000–00', startsAt: '', endsAt: '' },
  schoolYearToDate: {
    studentsHelped: 0,
    sessionsCompleted: 0,
    hoursTutored: 0,
    membersTutoring: 0,
  },
  allTime: { studentsHelped: 0, sessionsCompleted: 0, hoursTutored: 0 },
  goals: { hoursTutored: 0, membersTutoring: 0 },
}

const shown = computed(() => props.impact ?? PLACEHOLDER)
const isLoading = computed(() => !props.impact)
</script>

<template>
  <section
    class="impact"
    :class="{ 'is-loading': isLoading }"
    :aria-busy="isLoading"
    :data-testid="isLoading ? 'impact-loading' : 'impact'"
  >
    <p v-if="isLoading" class="visually-hidden" role="status">
      Loading chapter impact
    </p>
    <header
      class="impact-header"
      data-testid="impact-header"
      :aria-hidden="isLoading || undefined"
    >
      <span class="eyebrow">Chapter impact</span>
      <span class="all-time" data-testid="impact-all-time">
        {{ allTimeLine(shown) }}
      </span>
      <span class="year-pill">{{ shown.schoolYear.label }} school year</span>
    </header>

    <div
      class="cards"
      data-testid="impact-cards"
      :aria-hidden="isLoading || undefined"
    >
      <div class="card">
        <span class="card-eyebrow">This school year</span>
        <div class="figures">
          <div class="figure">
            <span class="figure-value" data-testid="students-helped">
              {{ shown.schoolYearToDate.studentsHelped }}
            </span>
            <span class="figure-caption">students helped</span>
          </div>
          <div class="figure">
            <span class="figure-value" data-testid="sessions-completed">
              {{ shown.schoolYearToDate.sessionsCompleted }}
            </span>
            <span class="figure-caption">sessions completed</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-eyebrow">Good standing</span>
          <StandingChip :impact="shown" />
        </div>
        <div class="meters">
          <RequirementMeter
            label="Hours tutored"
            data-testid="hours-meter"
            variant="hours"
            :value="shown.schoolYearToDate.hoursTutored"
            :displayValue="
              formatProgressHours(
                shown.schoolYearToDate.hoursTutored,
                shown.goals.hoursTutored
              )
            "
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
              isLoading
                ? undefined
                : `${shown.goals.membersTutoring} makes you official`
            "
            :loading="isLoading"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.visually-hidden {
  @include visually-hidden;
}
.impact-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 14px;
}
.eyebrow {
  @include nths-card-eyebrow;
  color: $c-nths-navy;
}
.all-time {
  font-size: 13px;
  line-height: 1.4;
  color: $c-secondary-grey;
}
.year-pill {
  margin-left: auto;
  border: 1px solid $border-grey;
  border-radius: 20px;
  background: $upchieve-white;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  color: $c-default-grey;
  white-space: nowrap;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 14px;
}
.card {
  @include nths-card(24px 26px);
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;

  .standing-chip {
    margin-left: auto;
  }
}
.card-eyebrow {
  @include nths-card-eyebrow;
  color: $c-nths-navy;
}
.figures {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
}
.figure {
  display: flex;
  flex-direction: column;
}
.figure-value {
  font-size: 48px;
  font-weight: 600;
  line-height: 1;
  color: $c-nths-navy;
}
.figure-caption {
  font-size: 14px;
  line-height: 1.4;
  color: $c-default-grey;
  margin-top: 8px;
}
.meters {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.is-loading {
  .all-time,
  .year-pill,
  .figure-value,
  .figure-caption,
  :deep(.meter-label),
  :deep(.meter-value),
  :deep(.standing-chip) {
    color: transparent;
    background: $c-border-grey;
    border-radius: 4px;
  }
}
</style>
