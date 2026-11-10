<script lang="ts" setup>
import { computed } from 'vue'
import StarIconFilled from '@/assets/icons/star_icon_filled.svg'
import CoachAvatar from '@/components/CoachAvatar.vue'
import type { VolunteerPublicProfileInfoShared } from '@/types/sessions'
import type { VolunteerStatus } from '@/types/users'
import {
  getSharedStats,
  SHORT_STAT_LABELS,
} from '@/utils/volunteer-shared-stats'

const props = defineProps<{
  name: string
  info: VolunteerPublicProfileInfoShared
  subject?: string
  status?: VolunteerStatus
  isFavorite?: boolean
}>()

const stats = computed(() => getSharedStats(props.info, SHORT_STAT_LABELS))

const details = computed(() => [
  ...(props.info.occupation ?? []),
  ...(props.subject ? [props.subject] : []),
])
</script>

<template>
  <div class="coach-info" data-testid="coach-info-popover">
    <div class="coach-info__header">
      <CoachAvatar :status="status">
        <template v-if="isFavorite" #badge>
          <StarIconFilled
            class="coach-info__star"
            data-testid="coach-info-favorite"
            aria-hidden="true"
          />
        </template>
      </CoachAvatar>
      <div class="coach-info__identity">
        <span class="coach-info__name">{{ name }}</span>
        <span v-if="details.length" class="coach-info__details">
          <template v-for="(detail, i) in details" :key="i">
            <span v-if="i > 0" class="coach-info__dot" aria-hidden="true">
              •
            </span>
            <span data-testid="coach-info-detail">{{ detail }}</span>
          </template>
        </span>
      </div>
    </div>

    <div v-if="stats.length" class="coach-info__stats">
      <div
        v-for="stat in stats"
        :key="stat.key"
        class="coach-info__stat"
        data-testid="coach-info-stat"
      >
        <span class="coach-info__stat-value">{{ stat.value }}</span>
        <span class="coach-info__stat-label">{{ stat.label }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.coach-info {
  width: 380px;
  max-width: calc(100vw - 32px);
  padding: 24px;
  border: 1px solid $c-border-grey;
  border-radius: 16px;
  background-color: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  text-align: left;

  &__header {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__star {
    display: block;
    width: 28px;
    height: 28px;
    overflow: visible;
    color: $c-college;
    stroke: $c-soft-black;
    stroke-width: 0.5;
    stroke-linejoin: round;
    filter: drop-shadow(1.5px 1.5px 0 $c-soft-black);
  }

  &__identity {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__name {
    font-size: 18px;
    font-weight: 500;
    color: $c-soft-black;
    overflow-wrap: anywhere;
  }

  &__details {
    display: inline;
    font-size: 16px;
    line-height: 1.5;
    color: $c-soft-black;
  }

  &__dot {
    margin: 0 6px;
  }

  &__stats {
    display: flex;
    justify-content: space-around;
    gap: 12px;
    margin: 20px 0 0;
    padding: 16px 12px;
    border-radius: 8px;
    background-color: $c-background-blue;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__stat-value {
    font-size: 24px;
    font-weight: $font-weight-bold;
    color: $c-soft-black;
  }

  &__stat-label {
    margin: 0;
    font-size: 14px;
    color: $c-secondary-grey;
  }
}
</style>
