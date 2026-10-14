<script lang="ts" setup>
import { computed, ref } from 'vue'
import Chip from '@/components/Chip.vue'
import type { VolunteerPublicProfileInfoShared } from '@/types/sessions'

const props = defineProps<{
  info: VolunteerPublicProfileInfoShared
  viewerRole: 'student' | 'volunteer'
}>()

const VOLUNTEER_SHAREABLE_STATS = [
  { key: 'numSessionsTutored', singular: 'session', plural: 'sessions' },
  {
    key: 'numStudentsHelped',
    singular: 'student helped',
    plural: 'students helped',
  },
  {
    key: 'totalVolunteerHours',
    singular: 'hour tutored',
    plural: 'hours tutored',
  },
] as const

// Only collapse the student's view, not the volunteer's
const isCollapsible = computed(() => props.viewerRole === 'student')
const isCollapsed = ref(props.viewerRole === 'student')

function toggleCollapsed() {
  if (!isCollapsible.value) return
  isCollapsed.value = !isCollapsed.value
}

const statsToShow = computed(() =>
  VOLUNTEER_SHAREABLE_STATS.flatMap((stat) => {
    const value = props.info[stat.key]
    if (value == null) return []
    return [
      {
        key: stat.key,
        value,
        label: value === 1 ? stat.singular : stat.plural,
      },
    ]
  })
)

const occupations = computed(() => props.info.occupation ?? [])
const hasOccupations = computed(() => occupations.value.length > 0)
const hasAnyStat = computed(() => statsToShow.value.length > 0)
const hasAnyInfo = computed(() => hasOccupations.value || hasAnyStat.value)
</script>

<template>
  <div v-if="hasAnyInfo" class="tutor-info-card" data-testid="tutor-info-card">
    <div class="tutor-info-header">
      <span class="tutor-info-label">Meet your coach</span>
      <button
        v-if="isCollapsible"
        type="button"
        class="tutor-info-toggle"
        @click="toggleCollapsed"
      >
        {{ isCollapsed ? 'Show' : 'Hide' }}
      </button>
    </div>

    <template v-if="!isCollapsed">
      <div v-if="hasOccupations" class="tutor-info-pills">
        <Chip v-for="label in occupations" :key="label" :chip-content="label" />
      </div>

      <div v-if="hasAnyStat" class="tutor-info-stats">
        <div
          v-for="stat in statsToShow"
          :key="stat.key"
          class="tutor-info-stat"
        >
          <span class="tutor-info-stat-number">{{ stat.value }}</span>
          <span class="tutor-info-stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.tutor-info-card {
  background: #fff;
  border: 1px solid $upchieve-green;
  border-radius: 12px;
  padding: 16px;
}

:deep(.chip-item) {
  background-color: $selected-green;
  border-color: $upchieve-green;
}

.tutor-info-header {
  @include flex-container(row, space-between, center);
}

.tutor-info-label {
  font-size: 12px;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  color: $c-hover-green;
}

.tutor-info-toggle {
  background: none;
  border: none;
  padding: 0;
  color: $c-soft-black;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.tutor-info-pills {
  @include flex-container(row, flex-start, center);
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}

.tutor-info-stats {
  @include flex-container(row, flex-start, flex-start);
  gap: 24px;
}

.tutor-info-stat {
  @include flex-container(column, flex-start, flex-start);
}

.tutor-info-stat-number {
  font-size: 20px;
  font-weight: $font-weight-bold;
}

.tutor-info-stat-label {
  font-size: 13px;
  color: $c-secondary-grey;
}
</style>
