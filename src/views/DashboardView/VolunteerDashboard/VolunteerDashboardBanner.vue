<script lang="ts" setup>
import Wave from '@/assets/volunteer_dashboard_banner/banner_wave.svg'
import Dust from '@/assets/volunteer_dashboard_banner/dust.svg'
import { useStore } from 'vuex'
import { computed } from 'vue'
import Spinner from '@/components/Spinner.vue'

const store = useStore()
const stats = computed(() => store.state.volunteer.globalStats)
const displayStats = computed(() => {
  return [
    { label: 'students online', value: stats.value?.studentsOnline },
    { label: 'active sessions', value: stats.value?.ongoingSessions },
  ]
})
</script>

<template>
  <div class="main" data-testid="volunteer-dashboard-banner">
    <div class="background" />
    <Wave class="bottom-wave" />
    <Dust class="dust" />
    <div class="content">
      <h1 class="title">Every session counts.</h1>
      <ul>
        <li v-for="(stat, index) in displayStats" :key="`stat-${index}`">
          <Spinner
            :containerWidth="10"
            :containerHeight="10"
            :width="10"
            :height="10"
            v-if="stat.value === undefined"
          />
          <span v-else class="stat-value">{{ stat.value }}</span>
          {{ stat.label }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main {
  --bgColor: #1b1e4b;
  --wave-height: 56px;
  --minBannerHeight: 150px;
  position: relative;
  isolation: isolate;

  @include breakpoint-below('medium') {
    --minBannerHeight: 80px;
  }
}

.background {
  background-color: var(--bgColor);
  min-height: var(--minBannerHeight);
  position: absolute;
  inset: 0 0 var(--wave-height);
}

.bottom-wave {
  width: 100%;
  height: var(--wave-height);
  position: absolute;
  left: 0;
  bottom: 0;
  display: block;
}

@keyframes dust-twinkling {
  0%,
  100% {
    opacity: 0.12;
  }
  50% {
    opacity: 0.9;
  }
}

.dust {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; // purely decorative

  :deep(circle) {
    // The SVG already has animation timing defined inside of each `<circle>`
    animation-name: dust-twinkling;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
}

.content {
  position: relative; // above the 'absolute' layers
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 40px 40px var(--minBannerHeight);
  color: white;
  // --banner-overlap comes from the parent fyi
  padding: 40px 40px calc(var(--banner-overlap, 0px) + 40px);

  .title {
    @include font-category('display-large');
    font-weight: $font-weight-bold;
  }

  ul {
    list-style: none;
    display: flex;
    flex-direction: row;
    gap: 8px;
    padding: 0;

    li {
      border-radius: 12px;
      padding: 4px 12px;
      background-color: #ffffff1f;
      color: #cddffb;
      @include font-category('helper-text');

      .stat-value {
        color: white;
        font-weight: $font-weight-bold;
      }
    }
  }
}
</style>
