<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'
import type {
  NTHSChapterImpactPublic,
  NTHSChapterRosterMemberPublic,
} from '@upchieve/api-contracts/nths-groups'
import {
  contributionBar,
  findOpenViewer,
} from '@/services/NTHSTopMembersService'
import { plural } from '@/utils/plural'
import { formatHoursMinutes } from '@/utils/time-utils'

const props = defineProps<{
  members: NTHSChapterRosterMemberPublic[]
  currentUserId: string
  impact: NTHSChapterImpactPublic | undefined
  isLoading?: boolean
  loadFailed?: boolean
}>()

const store = useStore()
const avatar = computed(
  (): { id: string; component: any } | undefined => store.getters['user/avatar']
)

const isBusy = computed(() => props.isLoading || !props.impact)
const viewer = computed(() =>
  findOpenViewer(props.members, props.currentUserId)
)
const ownHours = computed(() => viewer.value?.periodHours.thisSchoolYear ?? 0)
const chapterHours = computed(
  () => props.impact?.schoolYearToDate.hoursTutored ?? 0
)
const goalHours = computed(() => props.impact?.goals.hoursTutored ?? 0)
const bar = computed(() =>
  isBusy.value
    ? { ownWidth: 0, restWidth: 0, restHours: 0 }
    : contributionBar(ownHours.value, chapterHours.value, goalHours.value)
)
const otherCount = computed(
  () => props.members.filter((m) => m.userId !== props.currentUserId).length
)
const show = computed(() => props.loadFailed || isBusy.value || !!viewer.value)
const barHours = computed(() =>
  isBusy.value ? 0 : Math.max(ownHours.value, chapterHours.value)
)
const valueText = computed(
  () =>
    `${formatHoursMinutes(barHours.value)} of ${goalHours.value} member hours`
)
</script>

<template>
  <section
    v-if="show"
    class="contribution"
    :class="{ 'is-loading': isBusy && !loadFailed }"
    aria-labelledby="contribution-title"
    :aria-busy="isBusy && !loadFailed"
    data-testid="contribution"
  >
    <h2 id="contribution-title" class="eyebrow">Your contribution</h2>
    <p v-if="loadFailed" class="note" data-testid="contribution-error">
      We couldn't load your contribution. Refresh the page to try again.
    </p>
    <template v-else>
      <p class="figure" data-testid="contribution-hours">
        {{ formatHoursMinutes(ownHours) }}
      </p>
      <div class="track-wrap">
        <div
          class="track"
          role="progressbar"
          aria-label="Hours tutored"
          aria-valuemin="0"
          :aria-valuemax="goalHours"
          :aria-valuenow="Math.min(barHours, goalHours)"
          :aria-valuetext="isBusy ? undefined : valueText"
          data-testid="contribution-bar"
        >
          <span class="fill own" :style="{ width: `${bar.ownWidth}%` }" />
          <span class="fill rest" :style="{ width: `${bar.restWidth}%` }" />
        </div>
        <span class="marker" :style="{ '--at': `${bar.ownWidth}%` }">
          <component
            :is="avatar?.component"
            class="avatar"
            aria-hidden="true"
          />
        </span>
      </div>
      <ul class="legend">
        <li data-testid="contribution-legend-you">
          <span class="swatch own" />You · {{ formatHoursMinutes(ownHours) }}
        </li>
        <li data-testid="contribution-legend-others">
          <span class="swatch rest" />{{ otherCount }}
          {{ plural(otherCount, 'member') }} ·
          {{ formatHoursMinutes(bar.restHours) }}
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped lang="scss">
.contribution {
  @include nths-card;
}
.eyebrow {
  @include nths-card-eyebrow;
  margin: 0;
  color: $c-secondary-grey;
}
.note {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  margin: 8px 0 0;
  color: $c-secondary-grey;
}
.figure {
  font-size: 40px;
  font-weight: 500;
  line-height: 1.2;
  margin: 8px 0 16px;
  @include breakpoint-below('medium') {
    font-size: 24px;
  }
}
.track-wrap {
  position: relative;
}
.track {
  display: flex;
  height: 14px;
  overflow: hidden;
  background: $c-background-grey;
  border: 1px solid $c-border-grey;
  border-radius: 20px;
}
.fill {
  display: block;
  height: 100%;
  &.own {
    background: $c-information-blue;
  }
  &.rest {
    background: $c-success-green;
  }
}
.marker {
  position: absolute;
  top: 50%;
  left: clamp(18px, var(--at), calc(100% - 18px));
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  box-sizing: border-box;
  border: 3px solid $c-border-grey;
  border-radius: 50%;
  background: $upchieve-white;
  overflow: hidden;
}
.avatar {
  width: 100%;
  height: 100%;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  font-size: 14px;
  line-height: 1.5;
}
.swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 8px;
  border-radius: 50%;
  &.own {
    background: $c-information-blue;
  }
  &.rest {
    background: $c-success-green;
  }
}
.is-loading {
  .figure,
  .legend {
    @include nths-skeleton;
    width: fit-content;
  }
  .swatch {
    visibility: hidden;
  }
}
</style>
