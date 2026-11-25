<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import starUrl from '@/assets/nths/impact-star.svg?url'
import type { NTHSChapterImpactPublic } from '@upchieve/api-contracts/nths-groups'
import {
  formatProgressHours,
  LOADING_IMPACT_PLACEHOLDER,
  meterPercent,
} from '@/services/NTHSImpactService'
import { plural } from '@/utils/plural'

type Period = 'year' | 'all'

const props = defineProps<{ impact?: NTHSChapterImpactPublic }>()

const TABS: { period: Period; label: string }[] = [
  { period: 'year', label: 'This school year' },
  { period: 'all', label: 'All-time' },
]

const shown = computed(() => props.impact ?? LOADING_IMPACT_PLACEHOLDER)
const isLoading = computed(() => !props.impact)
const uid = useId()
const ids = {
  title: `${uid}-title`,
  panel: `${uid}-panel`,
  tab: (period: Period) => `${uid}-tab-${period}`,
}
const selected = ref<Period>('year')
const tabButtons = ref<HTMLButtonElement[]>([])

const year = computed(() => shown.value.schoolYearToDate)
const goal = computed(() => shown.value.goals.hoursTutored)
const yearHours = computed(() => formatProgressHours(year.value.hoursTutored))
// Whole hours, rounded down so 39.96 never reads 40 here while the school-year
// tab reads 39.9.
const allTimeUnderOne = computed(() => {
  const hours = shown.value.allTime.hoursTutored
  return hours > 0 && hours < 1
})
const allTimeHours = computed(() =>
  allTimeUnderOne.value
    ? '<1'
    : String(Math.floor(shown.value.allTime.hoursTutored))
)
const allTimeUnit = computed(() =>
  allTimeUnderOne.value ? 'hour' : plural(allTimeHours.value, 'hour')
)
const fill = computed(() =>
  isLoading.value ? 0 : meterPercent(year.value.hoursTutored, goal.value)
)
const ticks = computed(() =>
  Array.from({ length: goal.value > 0 ? goal.value + 1 : 0 }, (_, i) => ({
    x: (i / goal.value) * 100,
    major: i % 10 === 0,
  }))
)

function selectNext(step: number) {
  const index = TABS.findIndex((tab) => tab.period === selected.value)
  const next = (index + step + TABS.length) % TABS.length
  selected.value = TABS[next].period
  tabButtons.value[next]?.focus()
}
</script>

<template>
  <section
    class="impact"
    :class="{ 'is-loading': isLoading }"
    :aria-busy="isLoading"
    :aria-labelledby="ids.title"
    :data-testid="isLoading ? 'impact-loading' : 'impact'"
  >
    <h2 :id="ids.title" class="visually-hidden">Our impact</h2>
    <p v-if="isLoading" class="visually-hidden" role="status">
      Loading chapter impact
    </p>
    <div
      class="tabs"
      role="tablist"
      aria-label="Impact period"
      @keydown.right.prevent="selectNext(1)"
      @keydown.left.prevent="selectNext(-1)"
    >
      <button
        v-for="tab in TABS"
        :id="ids.tab(tab.period)"
        :key="tab.period"
        ref="tabButtons"
        type="button"
        role="tab"
        class="tab"
        :class="tab.period"
        :aria-selected="selected === tab.period"
        :aria-controls="ids.panel"
        :tabindex="selected === tab.period ? 0 : -1"
        :data-testid="`impact-tab-${tab.period}`"
        @click="selected = tab.period"
      >
        {{ tab.label }}
      </button>
    </div>
    <div
      :id="ids.panel"
      class="panel"
      :class="selected"
      role="tabpanel"
      tabindex="0"
      :aria-labelledby="ids.tab(selected)"
    >
      <template v-if="selected === 'year'">
        <div
          class="numbers"
          :aria-hidden="isLoading || undefined"
          data-testid="impact-numbers"
        >
          <p class="big" data-testid="impact-hours">{{ yearHours }}</p>
          <p class="lbl">{{ plural(yearHours, 'hour') }} tutored this year</p>
          <p class="sub">
            <strong data-testid="impact-students">{{
              year.studentsHelped
            }}</strong>
            {{ plural(year.studentsHelped, 'student') }} ·
            <strong data-testid="impact-sessions">{{
              year.sessionsCompleted
            }}</strong>
            {{ plural(year.sessionsCompleted, 'session') }}
          </p>
        </div>
        <div class="goal" :aria-hidden="isLoading || undefined">
          <div class="gtop">
            <span>0</span>
            <span class="next"
              >Goal: {{ goal }} {{ plural(goal, 'hour') }}</span
            >
          </div>
          <div class="track">
            <div
              class="ruler"
              role="progressbar"
              aria-label="Hours tutored this year"
              :aria-valuenow="Math.min(year.hoursTutored, goal)"
              :aria-valuemin="0"
              :aria-valuemax="goal"
              :aria-valuetext="`${yearHours} of ${goal} hours`"
            >
              <i class="fill" :style="{ width: `${fill}%` }" />
              <svg
                class="ticks"
                viewBox="0 0 100 24"
                preserveAspectRatio="none"
              >
                <line
                  v-for="tick in ticks"
                  :key="tick.x"
                  :x1="tick.x"
                  :x2="tick.x"
                  y1="0"
                  :y2="tick.major ? 11 : 6"
                />
              </svg>
            </div>
            <img
              class="here"
              :src="starUrl"
              alt=""
              :style="{ '--x': `${fill}%` }"
            />
          </div>
        </div>
      </template>
      <template v-else>
        <p class="sentence" :aria-hidden="isLoading || undefined">
          <span class="visually-hidden">
            Your chapter has tutored for
            {{ allTimeUnderOne ? 'less than 1' : allTimeHours }}
            {{ allTimeUnit }}.
          </span>
          <span class="sline" aria-hidden="true">
            Your chapter has tutored for
            <span class="flip" data-testid="impact-hours"
              ><span
                v-for="(char, i) in allTimeHours"
                :key="`${i}-${char}`"
                class="tile"
                >{{ char
                }}<template v-if="/[1-9]/.test(char)"
                  ><span class="half under" />
                  <span class="half top" />
                  <span
                    class="half bottom"
                    data-testid="impact-hours-flip"
                    :data-digit="char" /></template></span
            ></span>
            {{ allTimeUnit }}.
          </span>
        </p>
        <div class="stats" :aria-hidden="isLoading || undefined">
          <p class="stat">
            <b data-testid="impact-students">{{
              shown.allTime.studentsHelped
            }}</b>
            <span
              >{{
                plural(shown.allTime.studentsHelped, 'student')
              }}
              helped</span
            >
          </p>
          <p class="stat">
            <b data-testid="impact-sessions">{{
              shown.allTime.sessionsCompleted
            }}</b>
            <span>{{
              plural(shown.allTime.sessionsCompleted, 'session')
            }}</span>
          </p>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped lang="scss">
$c-ruler-fill: #76e5fd;

p {
  margin: 0;
}
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: -1px;
  position: relative;
  z-index: 1;
}
.tab {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.25;
  padding: 10px 20px;
  border: none;
  border-radius: 8px 8px 0 0;
  background: $upchieve-white;
  color: $c-soft-black;

  &.year {
    background: $c-nths-cream;
  }
  &[aria-selected='false'] {
    color: $c-secondary-grey;

    &:hover {
      background: #dfe7f9;
    }
    &.year:hover {
      background: #fff1c8;
    }
  }
  &:focus-visible {
    outline: 2px solid $c-information-blue;
    outline-offset: 2px;
  }
}
.panel {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(0, 3fr);
  align-items: center;
  gap: 24px;
  padding: 20px 24px;
  border-radius: 0 8px 8px 8px;
  background: $c-nths-cream;

  &.all {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    background: $upchieve-white;
    border-radius: 8px;
  }
  &:focus-visible {
    outline: 2px solid $c-information-blue;
    outline-offset: 2px;
  }

  @include breakpoint-below('large') {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
.big {
  font-size: 40px;
  font-weight: 500;
  line-height: 1.25;
}
.lbl {
  font-size: 18px;
}
.sub {
  font-size: 14px;
  color: $c-secondary-grey;

  strong {
    color: $c-soft-black;
    font-weight: 500;
  }
}
.gtop {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 8px;
}
.next {
  font-weight: 500;
}
.track {
  position: relative;
}
.ruler {
  position: relative;
  height: 56px;
  border: 1.5px solid $c-soft-black;
  border-radius: 4px;
  background: $upchieve-white;
  overflow: hidden;
}
.fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: $c-ruler-fill;
}
.ticks {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;

  line {
    stroke: $c-soft-black;
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
  }
}
.here {
  position: absolute;
  top: 50%;
  left: clamp(27px, var(--x), calc(100% - 27px));
  width: 54px;
  height: 54px;
  transform: translate(-50%, -50%);
}
.sentence {
  font-size: 24px;
  font-weight: 500;
  line-height: 1.25;
}
.sline {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.flip {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tile {
  display: inline-block;
  width: 40px;
  height: 56px;
  line-height: 54px;
  text-align: center;
  border: 1px solid $c-border-grey;
  border-radius: 7px;
  background: #eaf6fd
    linear-gradient(
      transparent 27px,
      rgba(23, 29, 60, 0.07) 27px 28px,
      transparent 28px
    );
  color: #171d3c;
  font-size: 40px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  position: relative;
  perspective: 240px;
}
.half {
  position: absolute;
  left: 0;
  right: 0;
  height: 27px;
  overflow: hidden;
  background: #eaf6fd;

  &::after {
    content: '0';
    display: block;
  }
  &.top {
    top: 0;
    border-radius: 6px 6px 0 0;
    transform-origin: bottom;
    animation: fold-down 0.14s ease-in forwards;
  }
  &.under,
  &.bottom {
    top: 27px;
    border-radius: 0 0 6px 6px;
    box-shadow: inset 0 1px rgba(23, 29, 60, 0.07);

    &::after {
      margin-top: -27px;
    }
  }
  &.bottom {
    transform-origin: top;
    animation: fold-in 0.14s 0.14s ease-out backwards;

    &::after {
      content: attr(data-digit);
    }
  }
}
@keyframes fold-down {
  to {
    transform: rotateX(-90deg);
  }
}
@keyframes fold-in {
  from {
    transform: rotateX(90deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .half {
    display: none;
  }
}
.stats {
  display: flex;
  gap: 30px;
}
.stat {
  b {
    display: block;
    font-size: 24px;
    font-weight: 500;
  }
  span {
    font-size: 14px;
    color: $c-secondary-grey;
  }
}

.is-loading {
  .big,
  .lbl,
  .sub,
  .sub strong,
  .gtop span,
  .sentence,
  .tile,
  .stat b,
  .stat span {
    color: transparent;
  }
  .big,
  .lbl,
  .sub,
  .gtop span,
  .stat b,
  .stat span {
    background: $c-border-grey;
    border-radius: 4px;
  }
}
</style>
