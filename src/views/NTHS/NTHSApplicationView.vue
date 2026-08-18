<script lang="ts" setup>
import LargeButton from '@/components/LargeButton.vue'
import ArrowIcon from '@/assets/arrow.svg'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { onMounted } from 'vue'

const learnMoreLink =
  'https://docs.google.com/document/d/1UDxRRJZ4b_Pt3PfjzN_7hxb-ffaF-hGdn_e_q1RCqqs/edit?tab=t.0'

function onClickedLearnMore() {
  AnalyticsService.captureEvent(EVENTS.NTHS_APPLICATION_CLICKED_LEARN_MORE)
}
function onClickedApplyNow() {
  AnalyticsService.captureEvent(EVENTS.NTHS_APPLICATION_CLICKED_APPLY)
}

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.NTHS_APPLICATION_VIEWED_APPLY_NOW_PAGE)
})
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="content">
        <h1 class="title">National Tutoring Honors Society</h1>
        <span>
          UPchieve's National Tutoring Honor Society (NTHS) is a student-led
          honor society where high schoolers lead chapters that recruit tutors,
          build community, and promote educational equity.
          <br /><br />
          Missed the Spring 2026 cohort deadline? We're inviting a select group
          of student leaders to apply to start an NTHS chapter on a rolling
          basis. Unlike cohort-based programs, this is a self-paced application
          available year-round.
        </span>
        <div class="actions">
          <a
            class="learn-more-link"
            :href="learnMoreLink"
            target="_blank"
            rel="noopener noreferrer"
            @click="onClickedLearnMore"
            ><strong>Learn more about NTHS & the president's role here</strong>
            <arrow-icon class="arrow-icon" />
          </a>
          <span><em>Please only submit one application.</em></span>

          <LargeButton
            variant="primary-blue"
            class="apply-button"
            :show-arrow="false"
            routeTo="/groups/apply/form"
            @click="onClickedApplyNow"
            >Apply to Start a Chapter</LargeButton
          >
        </div>
      </div>
      <div class="footer">
        <img class="image" src="@/assets/nths/create-team.png" aria-hidden />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title {
  font-weight: 500;
  @include breakpoint-below('medium') {
    font-size: 24px;
  }
}

.page {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 32px;
}
.container {
  border-radius: 8px;
  width: 100%;
  background-color: #fff;
  overflow: hidden;
  box-shadow:
    3px 3px 3px $c-shadow-header,
    -3px 3px 3px $c-shadow-header;

  @include breakpoint-above('medium') {
    max-width: 600px;
  }
}
.content {
  padding: 32px;
  gap: 12px;
  display: flex;
  flex-direction: column;
}
.footer {
  display: flex;
  justify-content: center;
  background-color: $upchieve-green;
  background-color: color-mix(in oklab, $upchieve-green, white 70%);
  padding: 24px;
}
.actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}
.apply-button {
  margin-top: 16px;
}
.learn-more-link {
  color: $c-success-green;
}
.arrow-icon {
  fill: $c-success-green;
  height: 16px;
  width: 16px;
  margin-top: 2px;
  margin-left: 8px;
}
.image {
  max-height: 233px;
}
.header {
  padding: 1em 1em 0 1em;
  display: flex;
  justify-content: space-between;
  width: 100%;
  @include breakpoint-below('large') {
    flex-direction: column;
  }
}
</style>
